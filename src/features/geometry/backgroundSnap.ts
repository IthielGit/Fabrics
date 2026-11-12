import type { CanvasElement } from '../../types/document'
import type { Point } from './viewport'

/** Segment du fond importé, en coordonnées du document (mm). */
export interface BackgroundSegment {
  a: Point
  b: Point
}

/** Nature du point d'accroche : extrémité, croisement de deux traits, milieu, ou point d'un trait. */
export type BackgroundSnapKind = 'endpoint' | 'intersection' | 'midpoint' | 'edge'

export interface BackgroundSnapResult {
  point: Point
  kind: BackgroundSnapKind
}

/**
 * Segments des fonds importés (lignes avec `groupId`, voir D62), visibles, passés en coordonnées
 * du document (la position de l'élément s'ajoute aux points, qui lui sont relatifs). Le choix du
 * niveau est fait par l'appelant (éléments du niveau actif).
 */
export function collectBackgroundSegments(
  elements: readonly CanvasElement[],
): BackgroundSegment[] {
  const segments: BackgroundSegment[] = []
  for (const element of elements) {
    if (element.type !== 'line' || element.groupId === undefined || element.hidden) continue
    const p = element.points
    for (let i = 0; i + 3 < p.length; i += 2) {
      segments.push({
        a: { x: element.x + p[i], y: element.y + p[i + 1] },
        b: { x: element.x + p[i + 2], y: element.y + p[i + 3] },
      })
    }
  }
  return segments
}

/** Point du segment le plus proche de `point`, et sa distance. */
function closestOnSegment(point: Point, segment: BackgroundSegment): { point: Point; distance: number } {
  const dx = segment.b.x - segment.a.x
  const dy = segment.b.y - segment.a.y
  const lengthSquared = dx * dx + dy * dy
  const t =
    lengthSquared === 0
      ? 0
      : Math.max(
          0,
          Math.min(1, ((point.x - segment.a.x) * dx + (point.y - segment.a.y) * dy) / lengthSquared),
        )
  const x = segment.a.x + dx * t
  const y = segment.a.y + dy * t
  return { point: { x, y }, distance: Math.hypot(point.x - x, point.y - y) }
}

/** Croisement de deux segments (à l'intérieur des deux), ou `null` s'ils sont parallèles ou ne se touchent pas. */
export function segmentIntersection(s: BackgroundSegment, t: BackgroundSegment): Point | null {
  const r = { x: s.b.x - s.a.x, y: s.b.y - s.a.y }
  const q = { x: t.b.x - t.a.x, y: t.b.y - t.a.y }
  const denominator = r.x * q.y - r.y * q.x
  if (Math.abs(denominator) < 1e-9) return null
  const wx = t.a.x - s.a.x
  const wy = t.a.y - s.a.y
  const u = (wx * q.y - wy * q.x) / denominator
  const v = (wx * r.y - wy * r.x) / denominator
  if (u < 0 || u > 1 || v < 0 || v > 1) return null
  return { x: s.a.x + r.x * u, y: s.a.y + r.y * u }
}

/**
 * Point d'accroche du fond le plus proche de `point`, à moins de `threshold` (mm). Priorité :
 * extrémité d'un trait, croisement de deux traits, milieu d'un trait, puis point quelconque d'un
 * trait (`edge`, ignoré si `allowEdge` est faux, par exemple avec la direction contrainte).
 * Seuls les traits proches du curseur sont regardés : pas de calcul sur tous les croisements.
 */
export function nearestBackgroundSnap(
  point: Point,
  segments: readonly BackgroundSegment[],
  threshold: number,
  allowEdge = true,
): BackgroundSnapResult | null {
  if (segments.length === 0 || threshold <= 0) return null

  const near: { segment: BackgroundSegment; closest: Point; distance: number }[] = []
  let endpoint: Point | null = null
  let endpointDistance = threshold
  let midpoint: Point | null = null
  let midpointDistance = threshold

  for (const segment of segments) {
    // Rejet rapide par la boîte du segment.
    if (
      Math.max(segment.a.x, segment.b.x) < point.x - threshold ||
      Math.min(segment.a.x, segment.b.x) > point.x + threshold ||
      Math.max(segment.a.y, segment.b.y) < point.y - threshold ||
      Math.min(segment.a.y, segment.b.y) > point.y + threshold
    ) {
      continue
    }
    const closest = closestOnSegment(point, segment)
    if (closest.distance > threshold) continue
    near.push({ segment, closest: closest.point, distance: closest.distance })

    for (const end of [segment.a, segment.b]) {
      const distance = Math.hypot(end.x - point.x, end.y - point.y)
      if (distance <= endpointDistance) {
        endpoint = end
        endpointDistance = distance
      }
    }
    const middle = { x: (segment.a.x + segment.b.x) / 2, y: (segment.a.y + segment.b.y) / 2 }
    const middleDistance = Math.hypot(middle.x - point.x, middle.y - point.y)
    if (middleDistance <= midpointDistance) {
      midpoint = middle
      midpointDistance = middleDistance
    }
  }

  if (near.length === 0) return null
  if (endpoint) return { point: { ...endpoint }, kind: 'endpoint' }

  let crossing: Point | null = null
  let crossingDistance = threshold
  for (let i = 0; i < near.length; i++) {
    for (let j = i + 1; j < near.length; j++) {
      const cross = segmentIntersection(near[i].segment, near[j].segment)
      if (!cross) continue
      const distance = Math.hypot(cross.x - point.x, cross.y - point.y)
      if (distance <= crossingDistance) {
        crossing = cross
        crossingDistance = distance
      }
    }
  }
  if (crossing) return { point: crossing, kind: 'intersection' }
  if (midpoint) return { point: { ...midpoint }, kind: 'midpoint' }

  if (!allowEdge) return null
  let best = near[0]
  for (const candidate of near) if (candidate.distance < best.distance) best = candidate
  return { point: { ...best.closest }, kind: 'edge' }
}
