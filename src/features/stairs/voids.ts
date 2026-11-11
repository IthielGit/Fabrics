import type { CanvasElement, Level, RoomElement, StairElement } from '../../types/document'
import { polygonArea, toPoints } from '../geometry/polygon'
import type { Point } from '../geometry/viewport'
import { levelAboveOf, stairStatus, stairToWorld, stairVoid } from './stairs'

// Trémies (M9, lot D bis) : l'ouverture que l'escalier perce dans la dalle du niveau du dessus.
// Elle est calculée à partir de l'emprise de l'escalier agrandie de `voidMargin`, jamais stockée.

/** Trémie d'un escalier, dans le plan, sur le niveau d'arrivée. */
export interface StairVoid {
  stairId: string
  /** Niveau percé : celui juste au-dessus du niveau de départ de l'escalier. */
  levelId: string
  /** Contour de la trémie (polygone en L pour un escalier en L). */
  polygon: Point[]
  /** Rectangles qui composent la trémie (pour tracer la croix) : un seul, deux pour un L. */
  rects: Point[][]
}

type VoidGeometry = Pick<
  StairElement,
  'x' | 'y' | 'rotation' | 'mirrored' | 'shape' | 'width' | 'length' | 'length2' | 'gap' | 'voidMargin'
>

/** Rectangles locaux (avant retournement et rotation) dont la réunion est la trémie. */
function localVoidRects(stair: VoidGeometry): { x: number; y: number; w: number; h: number }[] {
  const m = stair.voidMargin
  const w = stair.width
  const l1 = stair.length
  const l2 = stair.length2 ?? 0
  const gap = stair.gap ?? 0
  if (stair.shape === 'l') {
    // Barre du haut (palier et 2e volée), puis 1re volée dessous.
    return [
      { x: -m, y: -m, w: w + l2 + 2 * m, h: w + 2 * m },
      { x: -m, y: w + m, w: w + 2 * m, h: l1 },
    ]
  }
  if (stair.shape === 'u') {
    return [{ x: -m, y: -m, w: 2 * w + gap + 2 * m, h: w + Math.max(l1, l2) + 2 * m }]
  }
  return [{ x: -m, y: -m, w: w + 2 * m, h: l1 + 2 * m }]
}

/** Rectangles de la trémie dans le plan (de quoi tracer la croix). */
export function stairVoidRects(stair: VoidGeometry): Point[][] {
  return localVoidRects(stair).map(({ x, y, w, h }) =>
    [
      { x, y },
      { x: x + w, y },
      { x: x + w, y: y + h },
      { x, y: y + h },
    ].map((p) => stairToWorld(stair, p)),
  )
}

/** Trémies de tous les escaliers qui ont un niveau au-dessus (un escalier sans niveau du dessus n'en perce pas). */
export function collectStairVoids(
  elements: readonly CanvasElement[],
  levels: readonly Level[] | undefined,
): StairVoid[] {
  const voids: StairVoid[] = []
  for (const element of elements) {
    if (element.type !== 'stair' || element.hidden) continue
    if (stairStatus(element, levels).kind === 'no-level-above') continue
    const sorted = levels ? [...levels].sort((a, b) => a.elevation - b.elevation) : []
    const start = sorted.find((level) => level.id === element.levelId) ?? sorted[0]
    const upper = levelAboveOf(levels, start?.id)
    if (!upper) continue
    voids.push({
      stairId: element.id,
      levelId: upper.id,
      polygon: stairVoid(element),
      rects: stairVoidRects(element),
    })
  }
  return voids
}

// --- Relation entre une trémie et une pièce ------------------------------------------------------

/** Vrai si `point` est dans le polygone (lancer de rayon ; le bord compte comme dedans). */
export function pointInPolygon(point: Point, polygon: readonly Point[]): boolean {
  let inside = false
  const n = polygon.length
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const a = polygon[i]
    const b = polygon[j]
    // Sur le bord : dedans.
    const cross = (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x)
    if (
      Math.abs(cross) < 1e-6 &&
      point.x >= Math.min(a.x, b.x) - 1e-6 &&
      point.x <= Math.max(a.x, b.x) + 1e-6 &&
      point.y >= Math.min(a.y, b.y) - 1e-6 &&
      point.y <= Math.max(a.y, b.y) + 1e-6
    ) {
      return true
    }
    if (a.y > point.y !== b.y > point.y && point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside
    }
  }
  return inside
}

/** Vrai si les segments [a, b] et [c, d] se croisent franchement (pas un simple contact). */
function segmentsCross(a: Point, b: Point, c: Point, d: Point): boolean {
  const orient = (p: Point, q: Point, r: Point) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x)
  const d1 = orient(c, d, a)
  const d2 = orient(c, d, b)
  const d3 = orient(a, b, c)
  const d4 = orient(a, b, d)
  return d1 * d2 < -1e-6 && d3 * d4 < -1e-6
}

/** Vrai si `inner` tient entièrement dans `outer` (sommets dedans, aucun côté ne traverse le contour). */
export function polygonInside(inner: readonly Point[], outer: readonly Point[]): boolean {
  if (inner.length < 3 || outer.length < 3) return false
  if (!inner.every((p) => pointInPolygon(p, outer))) return false
  for (let i = 0; i < inner.length; i++) {
    const a = inner[i]
    const b = inner[(i + 1) % inner.length]
    for (let j = 0; j < outer.length; j++) {
      if (segmentsCross(a, b, outer[j], outer[(j + 1) % outer.length])) return false
    }
  }
  return true
}

/** Centre de la boîte d'un polygone (suffit pour savoir dans quelle pièce tombe la trémie). */
function boxCenter(polygon: readonly Point[]): Point {
  const xs = polygon.map((p) => p.x)
  const ys = polygon.map((p) => p.y)
  return { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 }
}

export interface RoomVoids {
  /** Trémies entièrement dans la pièce : la dalle est trouée. */
  holes: StairVoid[]
  /** Trémies qui débordent de la pièce : avertissement, dalle laissée pleine. */
  overflowing: StairVoid[]
  /** Surface retirée par les trémies, en mm². */
  area: number
}

/**
 * Trémies qui concernent une pièce : celles de son niveau dont le centre tombe dans la pièce. Une
 * trémie qui tient entièrement dans la pièce la troue ; sinon (première version : pas de découpe
 * entre polygones) elle est signalée et la dalle reste pleine.
 */
export function voidsOfRoom(room: Pick<RoomElement, 'points'>, voids: readonly StairVoid[]): RoomVoids {
  const outline = toPoints(room.points)
  const holes: StairVoid[] = []
  const overflowing: StairVoid[] = []
  for (const candidate of voids) {
    if (!pointInPolygon(boxCenter(candidate.polygon), outline)) continue
    if (polygonInside(candidate.polygon, outline)) holes.push(candidate)
    else overflowing.push(candidate)
  }
  const area = holes.reduce((sum, hole) => sum + polygonArea(hole.polygon.flatMap((p) => [p.x, p.y])), 0)
  return { holes, overflowing, area }
}

/** Escaliers dont la trémie déborde de la pièce du niveau du dessus (pour les avertir). */
export function overflowingStairIds(
  elements: readonly CanvasElement[],
  levels: readonly Level[] | undefined,
): Set<string> {
  const voids = collectStairVoids(elements, levels)
  const firstLevelId = levels && levels.length > 0 ? [...levels].sort((a, b) => a.elevation - b.elevation)[0].id : undefined
  const ids = new Set<string>()
  for (const element of elements) {
    if (element.type !== 'room' || element.hidden) continue
    const sameLevel = voids.filter((v) => v.levelId === (element.levelId ?? firstLevelId))
    for (const v of voidsOfRoom(element, sameLevel).overflowing) ids.add(v.stairId)
  }
  return ids
}
