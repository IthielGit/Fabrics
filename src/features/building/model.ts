import type {
  CanvasElement,
  FabricsDocument,
  Level,
  OpeningElement,
  RoomElement,
  WallElement,
} from '../../types/document'
import { toPoints } from '../geometry/polygon'
import type { Point } from '../geometry/viewport'
import type { BuildOptions, BuildingModel, Bounds3, SlabShape, WallPiece } from './types'
import { buildWallPieces } from './wallPieces'

/** Niveaux à afficher : tous, ou jusqu'à `upToLevelId` compris (triés par altitude). */
export function visibleLevels(levels: readonly Level[], upToLevelId?: string): Level[] {
  const sorted = [...levels].sort((a, b) => a.elevation - b.elevation)
  if (upToLevelId === undefined) return sorted
  const index = sorted.findIndex((l) => l.id === upToLevelId)
  return index < 0 ? sorted : sorted.slice(0, index + 1)
}

/** Dalle sous une pièce : dessus au niveau du sol, épaisseur du niveau vers le bas. */
export function buildRoomSlab(room: RoomElement, level: Level): SlabShape | null {
  const outline = toPoints(room.points)
  if (outline.length < 3 || level.slabThickness < 1) return null
  return {
    sourceId: room.id,
    levelId: level.id,
    kind: 'slab',
    outline,
    baseY: level.elevation - level.slabThickness,
    thickness: level.slabThickness,
  }
}

/** Toit plat au-dessus d'une pièce du dernier niveau. */
export function buildRoomRoof(room: RoomElement, level: Level): SlabShape | null {
  const outline = toPoints(room.points)
  if (outline.length < 3 || level.slabThickness < 1) return null
  return {
    sourceId: room.id,
    levelId: level.id,
    kind: 'roof',
    outline,
    baseY: level.elevation + level.height,
    thickness: level.slabThickness,
  }
}

function extendPlanBounds(points: readonly Point[], y0: number, y1: number, into: Bounds3 | null): Bounds3 {
  const bounds: Bounds3 = into ?? {
    min: { x: Infinity, y: Infinity, z: Infinity },
    max: { x: -Infinity, y: -Infinity, z: -Infinity },
  }
  for (const p of points) {
    bounds.min.x = Math.min(bounds.min.x, p.x)
    bounds.max.x = Math.max(bounds.max.x, p.x)
    bounds.min.z = Math.min(bounds.min.z, p.y)
    bounds.max.z = Math.max(bounds.max.z, p.y)
  }
  bounds.min.y = Math.min(bounds.min.y, y0)
  bounds.max.y = Math.max(bounds.max.y, y1)
  return bounds
}

/** Emprise d'un ensemble de morceaux de mur et de dalles. */
export function modelBounds(walls: readonly WallPiece[], slabs: readonly SlabShape[]): Bounds3 | null {
  let bounds: Bounds3 | null = null
  for (const w of walls) {
    const c = Math.cos(w.rotationY)
    const s = Math.sin(w.rotationY)
    const hx = w.size.x / 2
    const hz = w.size.z / 2
    // Coins dans le plan : rotation autour de y d'un angle φ → (x, z) = (c·u + s·v, −s·u + c·v).
    const corners: Point[] = [
      [-hx, -hz],
      [hx, -hz],
      [hx, hz],
      [-hx, hz],
    ].map(([u, v]) => ({ x: w.center.x + c * u + s * v, y: w.center.z - s * u + c * v }))
    bounds = extendPlanBounds(corners, w.center.y - w.size.y / 2, w.center.y + w.size.y / 2, bounds)
  }
  for (const slab of slabs) {
    bounds = extendPlanBounds(slab.outline, slab.baseY, slab.baseY + slab.thickness, bounds)
  }
  return bounds
}

/**
 * Traduit le document en modèle 3D : murs découpés par leurs ouvertures, dalle sous chaque pièce,
 * toit plat sur les pièces du dernier niveau. Un document sans niveaux (Visuel) donne un modèle vide.
 */
export function buildBuildingModel(
  doc: Pick<FabricsDocument, 'elements' | 'levels'>,
  options: BuildOptions = {},
): BuildingModel {
  const allLevels = doc.levels ?? []
  const levels = visibleLevels(allLevels, options.upToLevelId)
  if (levels.length === 0) return { walls: [], slabs: [], bounds: null }

  const sortedAll = [...allLevels].sort((a, b) => a.elevation - b.elevation)
  const topLevel = sortedAll[sortedAll.length - 1]
  const showRoof = levels[levels.length - 1].id === topLevel.id

  const byId = new Map(levels.map((l) => [l.id, l]))
  const firstLevel = sortedAll[0]
  const levelOf = (el: CanvasElement): Level | undefined =>
    byId.get(el.levelId ?? firstLevel.id)

  const openings = doc.elements.filter(
    (el): el is OpeningElement => el.type === 'opening' && !el.hidden,
  )
  const walls: WallPiece[] = []
  const slabs: SlabShape[] = []

  for (const el of doc.elements) {
    if (el.hidden) continue
    const level = levelOf(el)
    if (!level) continue
    if (el.type === 'wall') {
      walls.push(...buildWallPieces(el as WallElement, openings, level))
    } else if (el.type === 'room') {
      const slab = buildRoomSlab(el, level)
      if (slab) slabs.push(slab)
      if (showRoof && level.id === topLevel.id) {
        const roof = buildRoomRoof(el, level)
        if (roof) slabs.push(roof)
      }
    }
  }
  return { walls, slabs, bounds: modelBounds(walls, slabs) }
}
