import type { CanvasElement, Level, WallElement } from '../../types/document'
import { flattenPoints, polygonCentroid } from '../geometry/polygon'
import type { Point } from '../geometry/viewport'
import { axisAlignedRectangle, type Measurements } from '../measurements/measurements'
import type { References } from '../measurements/references'
import { roomDimensionsText } from '../measurements/clientView'
import { stairFootprint } from '../stairs/stairs'
import type { StairVoid } from '../stairs/voids'
import { formatArea } from '../units/format'
import { wallsOuterBox } from './clientDimensions'
import { DEFAULT_FACADE_OPTIONS, facadeChains, type FacadeChainOptions } from './facadeChains'
import type { AutoAnnotations, AutoDimension, AutoLabel } from './types'

/**
 * Cotes **Exécution** d'un niveau (M10 ter lot B), au nu brut des murs (D38) :
 * - les trois chaînes de chaque façade (`facadeChains`) ;
 * - des chaînes intérieures qui traversent le bâtiment à hauteur de chaque pièce, avec l'épaisseur
 *   de chaque mur et la largeur de chaque pièce entre deux murs ;
 * - chaque baie : repère, `largeur / hauteur` en dimensions brutes de maçonnerie (D39), allège ;
 * - chaque pièce : nom, surface, altitudes du sol et du dessus de la dalle haute (`±0`, `+2850`) ;
 * - les plateformes (altitude du dessus), les trémies (dimensions) et les escaliers (nombre de
 *   contremarches, hauteur, giron).
 * Les nombres viennent des métrés et des repères : plan et métrés d'exécution ne se contredisent pas.
 */
export interface ExecutionLabels {
  /** « All. 900 ». */
  sill: (mm: number) => string
  /** « Sol ±0 ». */
  floor: (altitude: string) => string
  /** « Dalle +2700 ». */
  slab: (altitude: string) => string
  /** « +2650 sous plafond ». */
  ceiling: (altitude: string) => string
  /** « N » : lettre de la flèche du nord. */
  north: string
  /** « E », « S », « O » : les autres lettres de la rose des vents (sans elles, seul le N est écrit). */
  east?: string
  south?: string
  west?: string
  /** « Niveau RDC (±0) » : repère de niveau du plan. */
  levelMark: (levelName: string, altitude: string) => string
  /** « Trémie ». */
  stairVoid: string
  /** « 16 CM × 175 ». */
  risers: (count: number, height: number) => string
  /** « Giron 260 ». */
  tread: (mm: number) => string
}

export interface ExecutionContext {
  level: Level
  /** Niveau juste au-dessus (altitude de la dalle haute) ; absent : haut des murs du niveau. */
  levelAbove?: Level
  measurements: Pick<Measurements, 'rooms' | 'stairs'>
  references: References
  /** Trémies qui percent ce niveau. */
  voids: readonly StairVoid[]
  labels: ExecutionLabels
}

export interface ExecutionOptions extends FacadeChainOptions {
  /** Distance entre le centre d'une pièce et sa chaîne intérieure, en mm (pour ne pas couvrir le nom). */
  innerShift: number
  /** Distance entre la face d'un mur et l'étiquette d'une ouverture, en mm. */
  openingLabelGap: number
}

export const DEFAULT_EXECUTION_OPTIONS: ExecutionOptions = {
  ...DEFAULT_FACADE_OPTIONS,
  innerShift: 700,
  openingLabelGap: 450,
}

/** Rectangle qui englobe une liste de points `[x1, y1, x2, y2, …]`. */
function pointsBox(flat: readonly number[]) {
  const xs = flat.filter((_, i) => i % 2 === 0)
  const ys = flat.filter((_, i) => i % 2 === 1)
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) }
}

/** Altitude en mm entiers, avec son signe : `±0`, `+2850`, `-450`. */
export function formatAltitude(mm: number): string {
  const rounded = Math.round(mm)
  if (rounded === 0) return '±0'
  return rounded > 0 ? `+${rounded}` : `${rounded}`
}

const ALIGN_TOLERANCE = 0.5
const TICK_MERGE = 1

/**
 * Chaîne intérieure le long d'une ligne horizontale (`y` fixé) ou verticale (`x` fixé) : faces des
 * murs perpendiculaires qu'elle traverse. `null` si elle traverse moins de deux murs.
 */
export function innerChainTicks(
  walls: readonly WallElement[],
  direction: 'horizontal' | 'vertical',
  at: number,
): number[] | null {
  const ticks: number[] = []
  let crossed = 0
  for (const wall of walls) {
    for (let i = 0; i + 3 < wall.points.length; i += 2) {
      const [ax, ay, bx, by] = wall.points.slice(i, i + 4)
      // Ligne horizontale : murs verticaux (x constant) dont le tracé couvre `at`.
      const [c0, c1, s0, s1] = direction === 'horizontal' ? [ax, bx, ay, by] : [ay, by, ax, bx]
      if (Math.abs(c0 - c1) > ALIGN_TOLERANCE) continue
      if (at < Math.min(s0, s1) || at > Math.max(s0, s1)) continue
      ticks.push(c0 - wall.thickness / 2, c0 + wall.thickness / 2)
      crossed++
    }
  }
  if (crossed < 2) return null
  const sorted = ticks.sort((a, b) => a - b)
  return sorted.filter((v, k) => k === 0 || v - sorted[k - 1] >= TICK_MERGE)
}

function chainToDimensions(
  ticks: readonly number[],
  direction: 'horizontal' | 'vertical',
  at: number,
  idPrefix: string,
): AutoDimension[] {
  const result: AutoDimension[] = []
  for (let k = 0; k + 1 < ticks.length; k++) {
    const points: [number, number, number, number] =
      direction === 'horizontal' ? [ticks[k], at, ticks[k + 1], at] : [at, ticks[k], at, ticks[k + 1]]
    result.push({ id: `${idPrefix}-${k}`, points, offset: 0, chainIndex: k })
  }
  return result
}

/** Centre d'une ouverture sur l'axe de son mur, et normale du mur (vecteur unitaire). */
function openingFrame(
  opening: { segmentIndex: number; offset: number },
  wall: WallElement,
): { centre: Point; normal: Point } | null {
  const i = opening.segmentIndex * 2
  const [ax, ay, bx, by] = wall.points.slice(i, i + 4)
  if (bx === undefined || by === undefined) return null
  const length = Math.hypot(bx - ax, by - ay)
  if (length === 0) return null
  const dx = (bx - ax) / length
  const dy = (by - ay) / length
  return { centre: { x: ax + dx * opening.offset, y: ay + dy * opening.offset }, normal: { x: -dy, y: dx } }
}

export function executionDimensions(
  elements: readonly CanvasElement[],
  context: ExecutionContext,
  options: ExecutionOptions = DEFAULT_EXECUTION_OPTIONS,
): AutoAnnotations {
  const { level, levelAbove, measurements, references, voids, labels } = context
  const visible = elements.filter((el) => !el.hidden)
  const walls = visible.filter((el): el is WallElement => el.type === 'wall')
  const dimensions: AutoDimension[] = [...facadeChains(visible, options)]
  const result: AutoLabel[] = []

  // Chaînes intérieures : une horizontale et une verticale par pièce, sans doublon.
  const seenChains = new Set<string>()
  const roomById = new Map(measurements.rooms.map((room) => [room.id, room]))
  const floor = labels.floor(formatAltitude(level.elevation))
  const slab = labels.slab(formatAltitude(levelAbove ? levelAbove.elevation : level.elevation + level.height))
  for (const room of visible) {
    if (room.type !== 'room') continue
    const centre = polygonCentroid(room.points)
    const measure = roomById.get(room.id)
    if (!centre || !measure) continue
    result.push({
      id: `room-${room.id}`,
      x: centre.x,
      y: centre.y,
      // Altitude sous plafond : sol + hauteur sous plafond (Technique seulement, jamais en Client).
      lines: [
        room.name,
        formatArea(measure.netArea),
        floor,
        ...(measure.ceilingHeight === null
          ? []
          : [labels.ceiling(formatAltitude(level.elevation + measure.ceilingHeight))]),
        slab,
      ],
      bounds: pointsBox(room.points),
    })
    for (const direction of ['horizontal', 'vertical'] as const) {
      const at = direction === 'horizontal' ? centre.y + options.innerShift : centre.x + options.innerShift
      const ticks = innerChainTicks(walls, direction, at)
      if (!ticks) continue
      const key = `${direction}:${ticks.map((t) => Math.round(t)).join(',')}`
      if (seenChains.has(key)) continue
      seenChains.add(key)
      dimensions.push(...chainToDimensions(ticks, direction, at, `inner-${room.id}-${direction}`))
    }
  }

  // Ouvertures : repère, baie brute « largeur / hauteur », allège. Étiquette du côté extérieur.
  const box = wallsOuterBox(walls)
  const middle = box ? { x: (box.minX + box.maxX) / 2, y: (box.minY + box.maxY) / 2 } : { x: 0, y: 0 }
  const wallById = new Map(walls.map((wall) => [wall.id, wall]))
  for (const opening of visible) {
    if (opening.type !== 'opening') continue
    const wall = wallById.get(opening.wallId)
    const frame = wall && openingFrame(opening, wall)
    if (!wall || !frame) continue
    const { centre, normal } = frame
    const outward = (centre.x - middle.x) * normal.x + (centre.y - middle.y) * normal.y >= 0 ? 1 : -1
    const distance = wall.thickness / 2 + options.openingLabelGap
    const lines = [
      references.openings.get(opening.id) ?? '',
      `${Math.round(opening.width)} / ${Math.round(opening.height)}`,
    ].filter((line) => line !== '')
    if (opening.sillHeight > 0) lines.push(labels.sill(Math.round(opening.sillHeight)))
    result.push({
      id: `opening-${opening.id}`,
      x: centre.x + normal.x * distance * outward,
      y: centre.y + normal.y * distance * outward,
      lines,
      // Si l'emplacement est pris : l'autre côté du mur.
      alternatives: [{ x: centre.x - normal.x * distance * outward, y: centre.y - normal.y * distance * outward }],
    })
  }

  // Plateformes : altitude du dessus.
  for (const platform of visible) {
    if (platform.type !== 'platform') continue
    const centre = polygonCentroid(platform.points)
    if (!centre) continue
    result.push({
      id: `platform-${platform.id}`,
      x: centre.x,
      y: centre.y,
      lines: [platform.name, labels.floor(formatAltitude(level.elevation + platform.elevation))],
    })
  }

  // Trémies qui percent ce niveau : nom et dimensions (rectangle) ou une cote par côté.
  for (const stairVoid of voids) {
    const flat = flattenPoints(stairVoid.polygon)
    const centre = polygonCentroid(flat)
    if (!centre) continue
    const size = axisAlignedRectangle(flat)
    const lines = [labels.stairVoid]
    if (size) lines.push(roomDimensionsText(size))
    else {
      for (let i = 0; i < stairVoid.polygon.length; i++) {
        const a = stairVoid.polygon[i]
        const b = stairVoid.polygon[(i + 1) % stairVoid.polygon.length]
        dimensions.push({ id: `void-${stairVoid.stairId}-${i}`, points: [a.x, a.y, b.x, b.y], offset: 0 })
      }
    }
    result.push({ id: `void-${stairVoid.stairId}`, x: centre.x, y: centre.y, lines })
  }

  // Escaliers : contremarches, hauteur, giron (escalier complet, avec un niveau au-dessus).
  const stairById = new Map(measurements.stairs.map((stair) => [stair.id, stair]))
  for (const stair of visible) {
    if (stair.type !== 'stair') continue
    const measure = stairById.get(stair.id)
    const centre = polygonCentroid(flattenPoints(stairFootprint(stair)))
    if (!measure || !centre || measure.risers === null || measure.riserHeight === null) continue
    const lines = [labels.risers(measure.risers, Math.round(measure.riserHeight))]
    if (measure.treadDepth !== null) lines.push(labels.tread(Math.round(measure.treadDepth)))
    result.push({ id: `stair-${stair.id}`, x: centre.x, y: centre.y, lines })
  }

  return { dimensions, labels: result }
}
