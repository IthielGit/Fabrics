/**
 * Traçabilité du quantitatif (M21, 21.3) : pour chaque quantité, ses éléments sources (nom),
 * les dimensions utilisées, la formule (par code, texte dans `src/i18n/fr.ts`), les déductions
 * (ouvertures, trémies, murs du dessous) et la règle avec sa version (déjà sur la quantité).
 *
 * Quantité → éléments sources → dimensions → formule → déductions → règle et version.
 * Fonctions pures ; dimensions en mm, mm², mm³ ou nombre, comme les quantités.
 */
import type { CanvasElement, Level, OpeningElement, RoomElement, WallElement } from '../../../types/document'
import type { SlabMeasure } from '../../scene/slabMeasures'
import { measureOpenings, type BuildingMeasurements } from '../measurements'
import { LEVEL_SLAB_PART } from './geometric'
import type { LevelSlab } from './levelSlabs'
import { floorOpeningsOfRoom } from './takeoff'
import type { QuantityDimension, QuantityResult } from './types'

/** Nom d'une dimension utilisée par une formule (libellé dans `fr.quantities.inputs`). */
export type TraceInputName =
  | 'length'
  | 'height'
  | 'thickness'
  | 'facesLength'
  | 'width'
  | 'depth'
  | 'sillHeight'
  | 'visibleHeight'
  | 'wallThickness'
  | 'perimeter'
  | 'area'
  | 'voidArea'
  | 'netArea'
  | 'netVolume'
  | 'layerThickness'
  | 'totalThickness'
  | 'footprint'
  | 'wallsBelow'
  | 'holesArea'
  | 'projectedArea'
  | 'pitch'
  | 'risers'
  | 'treads'

export interface TraceInput {
  name: TraceInputName
  value: number
  /** `angle` : degrés. */
  dimension: QuantityDimension | 'angle'
}

export interface TraceSource {
  id: string
  name: string
}

/** Une ouverture (ou une trémie, un mur du dessous) retirée — ou gardée sous le seuil. */
export interface TraceDeduction {
  elementId: string
  name: string
  /** Surface (mm²) ou longueur (mm, portes des plinthes) de l'élément. */
  value: number
  dimension: QuantityDimension
  /** `false` : sous le seuil de la règle, non déduite. */
  deducted: boolean
}

export interface QuantityTrace {
  sources: TraceSource[]
  inputs: TraceInput[]
  deductions: TraceDeduction[]
  /** Des ouvertures déduites se chevauchent : la déduction est la surface de leur union. */
  union: boolean
}

export type TracedQuantity = QuantityResult & { trace: QuantityTrace }

export interface TraceContext {
  building: BuildingMeasurements
  elements: readonly CanvasElement[]
  levels: readonly Level[]
  slabs: readonly SlabMeasure[]
  levelSlabs: readonly LevelSlab[]
}

const len = (name: TraceInputName, value: number): TraceInput => ({ name, value, dimension: 'length' })
const area = (name: TraceInputName, value: number): TraceInput => ({ name, value, dimension: 'area' })

/** Vrai si deux rectangles d'ouvertures déduites se chevauchent (même côté de mur). */
function overlaps(list: readonly { segmentIndex: number; rectangle: { from: number; to: number; bottom: number; top: number } }[]): boolean {
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i]
      const b = list[j]
      if (a.segmentIndex !== b.segmentIndex) continue
      const r = a.rectangle
      const s = b.rectangle
      if (r.from < s.to && s.from < r.to && r.bottom < s.top && s.bottom < r.top) return true
    }
  }
  return false
}

/** Ajoute la trace à chaque quantité (même ordre). */
export function traceQuantities(list: readonly QuantityResult[], context: TraceContext): TracedQuantity[] {
  const all = context.building.levels.map((entry) => entry.measurements)
  const walls = new Map(all.flatMap((m) => m.walls).map((w) => [w.id, w]))
  const openings = new Map(all.flatMap((m) => m.openings).map((o) => [o.id, o]))
  const rooms = new Map(all.flatMap((m) => m.rooms).map((r) => [r.id, r]))
  const platforms = new Map(all.flatMap((m) => m.platforms).map((p) => [p.id, p]))
  const roofs = new Map(all.flatMap((m) => m.roofs).map((r) => [r.id, r]))
  const stairs = new Map(all.flatMap((m) => m.stairs).map((s) => [s.id, s]))
  const chimneys = new Map(all.flatMap((m) => m.chimneys).map((c) => [c.id, c]))
  const slabs = new Map(context.slabs.map((s) => [s.id, s]))
  const levelSlabs = new Map(context.levelSlabs.map((s) => [s.levelId, s]))
  const levels = new Map(context.levels.map((l) => [l.id, l]))
  const wallElements = new Map(context.elements.filter((el): el is WallElement => el.type === 'wall').map((w) => [w.id, w]))
  const openingElements = context.elements.filter((el): el is OpeningElement => el.type === 'opening')
  const roomElements = new Map(context.elements.filter((el): el is RoomElement => el.type === 'room').map((r) => [r.id, r]))
  const { rectangles } = measureOpenings(context.elements, wallElements)
  const placedByWall = new Map<string, typeof rectangles>()
  for (const p of rectangles) placedByWall.set(p.wallId, [...(placedByWall.get(p.wallId) ?? []), p])
  const levelsBelow = [...context.levels].sort((a, b) => a.elevation - b.elevation)

  const traceOf = (q: QuantityResult): QuantityTrace => {
    const [id] = q.elementIds
    const trace: QuantityTrace = { sources: [], inputs: [], deductions: [], union: false }
    switch (q.category) {
      case 'wall': {
        const wall = walls.get(id)
        if (!wall) break
        trace.sources.push({ id, name: wall.name })
        trace.inputs.push(len('length', wall.length), len('height', wall.height), len('thickness', wall.thickness))
        if (q.code.startsWith('wall.faces') || q.code === 'wall.plasterArea' || q.code === 'wall.paintArea') {
          trace.inputs.push(len('facesLength', wall.facesLength))
        }
        const deducts = ['wall.openingsArea', 'wall.netArea', 'wall.netVolume', 'wall.facesNetArea', 'wall.plasterArea', 'wall.paintArea']
        if (deducts.includes(q.code)) {
          const threshold = q.family === 'takeoff' ? (q.rule.threshold?.value ?? 0) : 0
          const placed = placedByWall.get(id) ?? []
          trace.deductions = placed.map((p) => ({
            elementId: p.openingId,
            name: openings.get(p.openingId)?.name ?? p.openingId,
            value: p.area,
            dimension: 'area' as const,
            deducted: p.area > threshold,
          }))
          trace.union = overlaps(placed.filter((p) => p.area > threshold))
        }
        break
      }
      case 'wallLayer': {
        const wall = walls.get(id)
        const layer = wall?.layers?.find((l) => l.id === q.partId)
        if (!wall || !layer) break
        trace.sources.push({ id, name: wall.name })
        const total = (wall.layers ?? []).reduce((sum, l) => sum + l.thickness, 0)
        trace.inputs.push(len('layerThickness', layer.thickness), len('totalThickness', total))
        trace.inputs.push(q.code === 'wallLayer.area' ? area('netArea', wall.netArea) : { name: 'netVolume', value: wall.volume, dimension: 'volume' })
        break
      }
      case 'opening': {
        const opening = openings.get(id)
        if (!opening) break
        trace.sources.push({ id, name: opening.name }, { id: opening.wallId, name: opening.wallName })
        trace.inputs.push(
          len('width', opening.width),
          len('height', opening.height),
          len('sillHeight', opening.sillHeight),
          len('visibleHeight', opening.width > 0 ? opening.area / opening.width : 0),
        )
        if (q.code === 'opening.revealArea') trace.inputs.push(len('wallThickness', walls.get(opening.wallId)?.thickness ?? 0))
        break
      }
      case 'room': {
        const room = rooms.get(id)
        if (!room) break
        trace.sources.push({ id, name: room.name })
        trace.inputs.push(area('area', room.area), len('perimeter', room.perimeter))
        if (room.voidArea > 0) trace.inputs.push(area('voidArea', room.voidArea))
        const element = roomElements.get(id)
        if (q.code === 'room.skirtingLength' && element) {
          trace.deductions = floorOpeningsOfRoom(element, openingElements, wallElements).map((door) => ({
            elementId: door.id,
            name: openings.get(door.id)?.name ?? door.name,
            value: door.width,
            dimension: 'length' as const,
            deducted: true,
          }))
        }
        break
      }
      case 'slab': {
        if (q.partId === LEVEL_SLAB_PART) {
          const slab = levelSlabs.get(id)
          const level = levels.get(id)
          if (!slab) break
          trace.sources.push({ id, name: level?.name ?? id })
          trace.inputs.push(area('footprint', slab.footprint), len('thickness', slab.thickness))
          if (slab.wallsBelow > 0) {
            const index = levelsBelow.findIndex((l) => l.id === id)
            const below = index > 0 ? levelsBelow[index - 1] : undefined
            trace.inputs.push(area('wallsBelow', slab.wallsBelow))
            if (below) trace.sources.push({ id: below.id, name: below.name })
          }
          if (slab.voids > 0) trace.inputs.push(area('voidArea', slab.voids))
        } else {
          const slab = slabs.get(id)
          if (!slab) break
          trace.sources.push({ id, name: slab.name })
          trace.inputs.push(area('area', slab.area + slab.holesArea), area('holesArea', slab.holesArea), len('perimeter', slab.perimeter), len('thickness', slab.thickness))
        }
        break
      }
      case 'platform': {
        const platform = platforms.get(id)
        if (!platform) break
        trace.sources.push({ id, name: platform.name })
        trace.inputs.push(area('area', platform.area), len('thickness', platform.thickness))
        break
      }
      case 'roof': {
        const roof = roofs.get(id)
        if (!roof) break
        trace.sources.push({ id, name: roof.name })
        trace.inputs.push(area('projectedArea', roof.projectedArea))
        if (roof.pitch !== null) trace.inputs.push({ name: 'pitch', value: roof.pitch, dimension: 'angle' })
        break
      }
      case 'stair': {
        const stair = stairs.get(id)
        if (!stair) break
        trace.sources.push({ id, name: stair.name })
        trace.inputs.push(len('width', stair.width))
        if (stair.rise !== null) trace.inputs.push(len('height', stair.rise))
        break
      }
      case 'chimney': {
        const chimney = chimneys.get(id)
        if (!chimney) break
        trace.sources.push({ id, name: chimney.name })
        trace.inputs.push(len('width', chimney.width), len('depth', chimney.depth))
        break
      }
    }
    return trace
  }

  return list.map((q) => ({ ...q, trace: traceOf(q) }))
}
