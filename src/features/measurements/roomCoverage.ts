import type { RoomElement, WallElement } from '../../types/document'
import { polygonCentroid, toPoints } from '../geometry/polygon'
import { polygonDifference, pointInRing } from '../geometry/polygonPieces'
import { createRegionFinder, type RegionFinder } from '../geometry/regions'
import type { Point } from '../geometry/viewport'

/**
 * Un morceau mal couvert : `gap` = surface entre les murs que la pièce ne couvre pas ;
 * `overflow` = partie de la pièce qui passe au-delà des murs.
 */
export interface CoveragePiece {
  kind: 'gap' | 'overflow'
  /** Contour du morceau, puis ses trous éventuels (points absolus, mm). */
  rings: Point[][]
  /** Surface en mm². */
  area: number
  /** Mur le plus proche du morceau (`null` si le morceau fait le tour de la pièce). */
  wallId: string | null
}

/** Un morceau plus large que cela (mm) est signalé… */
export const COVERAGE_MIN_WIDTH = 50
/** … ou plus grand que cela (mm², soit 0,01 m²). En dessous des deux : imprécision de tracé, ignorée. */
export const COVERAGE_MIN_AREA = 10_000

type RoomShape = Pick<RoomElement, 'points' | 'x' | 'y'>
type WallShape = Pick<WallElement, 'id' | 'points' | 'thickness' | 'x' | 'y'>

function shifted(flat: readonly number[], dx: number, dy: number): number[] {
  return flat.map((value, i) => value + (i % 2 === 0 ? dx : dy))
}

function distanceToPolyline(point: Point, polyline: readonly Point[]): number {
  let best = Infinity
  for (let i = 1; i < polyline.length; i++) {
    const a = polyline[i - 1]
    const b = polyline[i]
    const dx = b.x - a.x
    const dy = b.y - a.y
    const lengthSquared = dx * dx + dy * dy
    const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared))
    best = Math.min(best, Math.hypot(point.x - (a.x + t * dx), point.y - (a.y + t * dy)))
  }
  return best
}

function boxesMeet(a: readonly Point[], b: readonly Point[]): boolean {
  const box = (ps: readonly Point[]) => ({
    minX: Math.min(...ps.map((p) => p.x)),
    maxX: Math.max(...ps.map((p) => p.x)),
    minY: Math.min(...ps.map((p) => p.y)),
    maxY: Math.max(...ps.map((p) => p.y)),
  })
  const p = box(a)
  const q = box(b)
  return p.minX <= q.maxX && q.minX <= p.maxX && p.minY <= q.maxY && q.minY <= p.maxY
}

/** Points d'essai à l'intérieur de la pièce : son centre de gravité, puis un point près de chaque côté. */
function probes(polygon: readonly Point[]): Point[] {
  const result: Point[] = []
  const centroid = polygonCentroid(polygon.flatMap((p) => [p.x, p.y]))
  if (centroid && pointInRing(centroid, polygon)) result.push(centroid)
  for (let i = 0; i < polygon.length; i++) {
    const p = polygon[i]
    const q = polygon[(i + 1) % polygon.length]
    const length = Math.hypot(q.x - p.x, q.y - p.y)
    if (length < 1) continue
    for (const side of [1, -1]) {
      const offset = Math.min(10, length / 4) * side
      const probe = { x: (p.x + q.x) / 2 - ((q.y - p.y) / length) * offset, y: (p.y + q.y) / 2 + ((q.x - p.x) / length) * offset }
      if (pointInRing(probe, polygon)) result.push(probe)
    }
  }
  return result
}

/** Vérifie la couverture de plusieurs pièces contre les mêmes murs (les graphes de zones sont préparés une fois). */
export interface CoverageChecker {
  /**
   * `others` : les autres pièces du niveau. Un espace couvert par une autre pièce (cuisine et séjour
   * dans la même zone, sans mur entre eux) n'est pas un manque. Un manque dans une zone partagée
   * n'est signalé qu'une fois, pour la première pièce contrôlée dans cette zone.
   */
  check(room: RoomShape, others?: readonly RoomShape[]): CoveragePiece[]
}

/**
 * Prépare le contrôle « la pièce remplit-elle l'espace entre ses murs ? » pour un ensemble de murs
 * (ceux du niveau de la pièce). Deux références, pour ne pas signaler une pièce tracée à l'axe des
 * murs (D49 : contour tel que dessiné) :
 * - **manque** : zone fermée par les **faces** des murs autour de la pièce, moins la pièce ;
 * - **débord** : pièce moins la zone fermée par les **axes** des murs.
 * Une pièce tracée n'importe où entre les faces et les axes n'est donc jamais signalée.
 */
export function createCoverageChecker(walls: readonly WallShape[]): CoverageChecker {
  const placed = walls
    .filter((wall) => wall.points.length >= 4)
    .map((wall) => ({ id: wall.id, points: shifted(wall.points, wall.x, wall.y), thickness: wall.thickness }))
  let faces: RegionFinder | null = null
  let axes: RegionFinder | null = null
  const axisLines = placed.map((wall) => ({ id: wall.id, line: toPoints(wall.points) }))

  const nearestWall = (piece: Point[][]): string | null => {
    if (piece.length > 1) return null // morceau en anneau : tout le tour de la pièce
    const centre = polygonCentroid(piece[0].flatMap((p) => [p.x, p.y]))
    if (!centre) return null
    let best: { id: string; distance: number } | null = null
    for (const { id, line } of axisLines) {
      const distance = distanceToPolyline(centre, line)
      if (!best || distance < best.distance) best = { id, distance }
    }
    return best?.id ?? null
  }

  const claimedZones = new Set<string>()
  const zoneKey = (zone: readonly Point[]) => zone.map((p) => `${Math.round(p.x)},${Math.round(p.y)}`).sort().join(';')

  return {
    check(room, others = []) {
      if (placed.length === 0) return []
      const polygon = toPoints(shifted(room.points, room.x, room.y))
      if (polygon.length < 3) return []
      faces ??= createRegionFinder(placed)
      // Murs réduits à leur axe : la zone qu'ils ferment est bordée par les axes.
      axes ??= createRegionFinder(placed.map((wall) => ({ points: wall.points, thickness: 0 })))
      const candidates = probes(polygon)
      const inner = candidates.map((p) => faces?.find(p) ?? null).find((r) => r !== null) ?? null
      // Pièce sans murs fermés autour : rien à contrôler.
      if (!inner) return []
      const outer = candidates.map((p) => axes?.find(p) ?? null).find((r) => r !== null) ?? inner

      const pieces: CoveragePiece[] = []
      const keep = (kind: CoveragePiece['kind'], list: ReturnType<typeof polygonDifference>): number => {
        const before = pieces.length
        for (const piece of list) {
          const width = (2 * piece.area) / piece.perimeter
          if (width < COVERAGE_MIN_WIDTH && piece.area < COVERAGE_MIN_AREA) continue
          pieces.push({ kind, rings: piece.rings, area: piece.area, wallId: nearestWall(piece.rings) })
        }
        return pieces.length - before
      }
      const key = zoneKey(inner)
      if (!claimedZones.has(key)) {
        let gaps = polygonDifference(inner, polygon)
        for (const other of others) {
          if (other === room) continue
          const otherPolygon = toPoints(shifted(other.points, other.x, other.y))
          if (otherPolygon.length < 3 || !boxesMeet(inner, otherPolygon)) continue
          gaps = gaps.flatMap((piece) => polygonDifference(piece.rings, otherPolygon))
        }
        if (keep('gap', gaps) > 0) claimedZones.add(key)
      }
      keep('overflow', polygonDifference(polygon, outer))
      return pieces
    },
  }
}

/**
 * Morceaux d'espace entre les murs que la pièce ne couvre pas, et parties de la pièce au-delà des
 * murs, au-dessus du seuil (`COVERAGE_MIN_WIDTH` ou `COVERAGE_MIN_AREA`). Rien n'est corrigé.
 * Pour plusieurs pièces sur les mêmes murs, préférer `createCoverageChecker`.
 */
export function roomCoverageGaps(
  room: RoomShape,
  walls: readonly WallShape[],
  others: readonly RoomShape[] = [],
): CoveragePiece[] {
  return createCoverageChecker(walls).check(room, others)
}
