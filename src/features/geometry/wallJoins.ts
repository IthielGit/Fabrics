import type { CanvasElement } from '../../types/document'
import { toPoints } from './polygon'
import type { Point } from './viewport'
import { sameLocation } from './walls'

export interface WallJoinInput {
  id: string
  /** Axe du mur : `[x1, y1, x2, y2, …]`. */
  points: readonly number[]
  /** Épaisseur en mm. */
  thickness: number
}

/** Une extrémité libre de mur : son point, la direction de l'axe en s'éloignant, la demi-épaisseur. */
interface WallEnd {
  wallId: string
  point: Point
  angle: number
  direction: Point
  half: number
}

/** Au-delà de ce rapport, un angle très aigu est coupé plutôt que prolongé en pointe. */
const MAX_MITER_RATIO = 4
/** Deux extrémités à moins de 1 mm l'une de l'autre se rejoignent. */
const JOIN_TOLERANCE = 1

function wallEnds(wall: WallJoinInput): WallEnd[] {
  const points = toPoints(wall.points).filter((p, i, all) => i === 0 || !sameLocation(p, all[i - 1]))
  if (points.length < 2) return []
  const first = points[0]
  const last = points[points.length - 1]
  if (points.length >= 4 && sameLocation(first, last)) return [] // contour fermé : déjà raccordé

  const half = wall.thickness / 2
  const make = (point: Point, toward: Point): WallEnd => {
    const length = Math.hypot(toward.x - point.x, toward.y - point.y)
    const direction = { x: (toward.x - point.x) / length, y: (toward.y - point.y) / length }
    return {
      wallId: wall.id,
      point,
      angle: Math.atan2(direction.y, direction.x),
      direction,
      half,
    }
  }
  return [make(first, points[1]), make(last, points[points.length - 2])]
}

/** Raccords des murs visibles d'une liste d'éléments (voir `computeWallJoins`). */
export function computeWallJoinsOf(elements: readonly CanvasElement[]): Map<string, Point[][]> {
  const walls: WallJoinInput[] = []
  for (const element of elements) {
    if (element.type === 'wall' && !element.hidden) {
      walls.push({ id: element.id, points: element.points, thickness: element.thickness })
    }
  }
  return computeWallJoins(walls)
}

/** Intersection des droites `p + s·u` et `q + t·v`, ou `null` si elles sont parallèles. */
function lineIntersection(p: Point, u: Point, q: Point, v: Point): Point | null {
  const denominator = u.x * v.y - u.y * v.x
  if (Math.abs(denominator) < 1e-9) return null
  const s = ((q.x - p.x) * v.y - (q.y - p.y) * v.x) / denominator
  return { x: p.x + s * u.x, y: p.y + s * u.y }
}

/**
 * Raccords aux angles où des murs distincts se terminent au même point. Un mur est dessiné avec des
 * bouts droits : à un angle en L, le coin extérieur reste donc creux. Pour chaque creux (l'écart
 * angulaire de plus de 180° entre deux murs voisins) on renvoie un polygone qui le comble ; il a la
 * couleur du mur auquel il est attribué (clé de la table). Les jonctions en T ou en X, les murs qui
 * se prolongent et les angles intérieurs n'ont pas besoin de raccord. Un axe fermé (premier point =
 * dernier point) est déjà raccordé en onglet par `wallFaces`.
 */
export function computeWallJoins(walls: readonly WallJoinInput[]): Map<string, Point[][]> {
  const groups = new Map<string, WallEnd[]>()
  for (const wall of walls) {
    for (const end of wallEnds(wall)) {
      const key = `${Math.round(end.point.x / JOIN_TOLERANCE)},${Math.round(end.point.y / JOIN_TOLERANCE)}`
      const group = groups.get(key)
      if (group) group.push(end)
      else groups.set(key, [end])
    }
  }

  const joins = new Map<string, Point[][]>()
  for (const ends of groups.values()) {
    // Deux extrémités du même mur au même point ne se raccordent pas entre elles.
    if (ends.length < 2 || new Set(ends.map((end) => end.wallId)).size < 2) continue
    const sorted = [...ends].sort((a, b) => a.angle - b.angle)

    for (let i = 0; i < sorted.length; i++) {
      const from = sorted[i]
      const to = sorted[(i + 1) % sorted.length]
      if (from.wallId === to.wallId) continue
      // Écart tournant de `from` vers `to` (sens des angles croissants).
      let gap = to.angle - from.angle
      if (gap <= 0) gap += 2 * Math.PI
      if (gap <= Math.PI + 1e-6) continue // angle intérieur : les murs se recouvrent déjà

      const origin = from.point
      // Face de `from` côté creux (à sa gauche), face de `to` côté creux (à sa droite).
      const cornerFrom = {
        x: origin.x - from.direction.y * from.half,
        y: origin.y + from.direction.x * from.half,
      }
      const cornerTo = {
        x: origin.x + to.direction.y * to.half,
        y: origin.y - to.direction.x * to.half,
      }
      const tip = lineIntersection(cornerFrom, from.direction, cornerTo, to.direction)
      const reach = Math.max(from.half, to.half) * MAX_MITER_RATIO
      const sharp = !tip || Math.hypot(tip.x - origin.x, tip.y - origin.y) > reach
      const polygon = sharp ? [origin, cornerFrom, cornerTo] : [origin, cornerFrom, tip, cornerTo]

      const owned = joins.get(from.wallId)
      if (owned) owned.push(polygon)
      else joins.set(from.wallId, [polygon])
    }
  }
  return joins
}
