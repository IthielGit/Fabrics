import type { OpeningElement, WallElement } from '../../types/document'
import { toPoints } from './polygon'
import type { Point } from './viewport'

/** Un segment de l'axe d'un mur, avec sa direction et sa normale unitaires. */
export interface WallSegmentInfo {
  a: Point
  b: Point
  length: number
  /** Direction unitaire de a vers b. */
  direction: Point
  /** Normale unitaire à gauche de la direction (même convention que `wallFaces`). */
  normal: Point
}

/** Position d'une ouverture dans le document, déduite de son mur. */
export interface OpeningGeometry {
  center: Point
  /** Extrémité côté début du segment. */
  start: Point
  /** Extrémité côté fin du segment. */
  end: Point
  direction: Point
  normal: Point
  /** Épaisseur du mur porteur, mm. */
  thickness: number
  /** Angle du segment, en degrés (pour orienter un dessin). */
  angle: number
}

/** Intervalle occupé le long d'un segment, de `from` à `to` (mm depuis le début du segment). */
export interface Interval {
  from: number
  to: number
}

/** Emplacement trouvé sur un mur : segment et distance depuis son début. */
export interface WallHit {
  wall: WallElement
  segmentIndex: number
  /** mm, du début du segment au point projeté. */
  offset: number
  /** Distance du point cherché à l'axe du mur, mm. */
  distance: number
}

const EPSILON = 1e-6

/** Segment n° `index` de l'axe du mur, ou `null` s'il n'existe pas ou a une longueur nulle. */
export function wallSegment(wall: Pick<WallElement, 'points'>, index: number): WallSegmentInfo | null {
  const points = toPoints(wall.points)
  if (!Number.isInteger(index) || index < 0 || index + 1 >= points.length) return null
  const a = points[index]
  const b = points[index + 1]
  const length = Math.hypot(b.x - a.x, b.y - a.y)
  if (length < EPSILON) return null
  const direction = { x: (b.x - a.x) / length, y: (b.y - a.y) / length }
  return { a, b, length, direction, normal: { x: -direction.y, y: direction.x } }
}

/** Nombre de segments de l'axe d'un mur. */
export function wallSegmentCount(wall: Pick<WallElement, 'points'>): number {
  return Math.max(0, toPoints(wall.points).length - 1)
}

function along(segment: WallSegmentInfo, distance: number): Point {
  return {
    x: segment.a.x + segment.direction.x * distance,
    y: segment.a.y + segment.direction.y * distance,
  }
}

/** Géométrie d'une ouverture sur son mur, ou `null` si le segment n'existe plus. */
export function openingGeometry(
  opening: Pick<OpeningElement, 'segmentIndex' | 'offset' | 'width'>,
  wall: Pick<WallElement, 'points' | 'thickness'>,
): OpeningGeometry | null {
  const segment = wallSegment(wall, opening.segmentIndex)
  if (!segment) return null
  const half = opening.width / 2
  return {
    center: along(segment, opening.offset),
    start: along(segment, opening.offset - half),
    end: along(segment, opening.offset + half),
    direction: segment.direction,
    normal: segment.normal,
    thickness: wall.thickness,
    angle: (Math.atan2(segment.direction.y, segment.direction.x) * 180) / Math.PI,
  }
}

/** Intervalle occupé par une ouverture le long de son segment. */
export function openingInterval(opening: Pick<OpeningElement, 'offset' | 'width'>): Interval {
  return { from: opening.offset - opening.width / 2, to: opening.offset + opening.width / 2 }
}

/** Ouvertures posées sur un segment donné d'un mur (en excluant éventuellement l'une d'elles). */
export function openingsOnSegment(
  openings: readonly OpeningElement[],
  wallId: string,
  segmentIndex: number,
  excludeId?: string,
): OpeningElement[] {
  return openings.filter(
    (o) => o.wallId === wallId && o.segmentIndex === segmentIndex && o.id !== excludeId,
  )
}

/**
 * Position du centre la plus proche de `desired` pour une ouverture de largeur `width` :
 * elle reste entièrement sur le segment et ne chevauche aucun intervalle `occupied`
 * (se toucher est permis). `null` si aucune place ne convient.
 */
export function clampOpeningOffset(
  desired: number,
  width: number,
  segmentLength: number,
  occupied: readonly Interval[] = [],
): number | null {
  const half = width / 2
  if (width <= 0 || width > segmentLength + EPSILON) return null

  // Positions permises du centre : [half, L − half] moins les zones interdites autour des voisines.
  let free: Interval[] = [{ from: half, to: segmentLength - half }]
  for (const other of occupied) {
    const forbiddenFrom = other.from - half
    const forbiddenTo = other.to + half
    free = free.flatMap((range) => {
      if (forbiddenTo <= range.from + EPSILON || forbiddenFrom >= range.to - EPSILON) return [range]
      const pieces: Interval[] = []
      if (forbiddenFrom >= range.from - EPSILON) pieces.push({ from: range.from, to: forbiddenFrom })
      if (forbiddenTo <= range.to + EPSILON) pieces.push({ from: forbiddenTo, to: range.to })
      return pieces
    })
  }

  let best: number | null = null
  for (const range of free) {
    if (range.to < range.from - EPSILON) continue
    const candidate = Math.min(Math.max(desired, range.from), Math.max(range.from, range.to))
    if (best === null || Math.abs(candidate - desired) < Math.abs(best - desired)) best = candidate
  }
  return best
}

/** Distances libres entre l'ouverture et chaque extrémité de son segment, mm. */
export function openingClearances(
  offset: number,
  width: number,
  segmentLength: number,
): { before: number; after: number } {
  return { before: offset - width / 2, after: segmentLength - offset - width / 2 }
}

/** Vrai si l'ouverture tient en hauteur dans le mur (allège + hauteur ≤ hauteur du mur). */
export function openingFitsHeight(
  opening: Pick<OpeningElement, 'height' | 'sillHeight'>,
  wallHeight: number,
): boolean {
  return opening.height > 0 && opening.sillHeight >= 0 && opening.sillHeight + opening.height <= wallHeight + EPSILON
}

/** Surface d'une ouverture, mm². */
export function openingArea(opening: Pick<OpeningElement, 'width' | 'height'>): number {
  return opening.width * opening.height
}

/** Projection d'un point sur un segment : distance depuis le début (bornée) et écart à l'axe. */
function projectOnSegment(point: Point, segment: WallSegmentInfo): { offset: number; distance: number } {
  const t = (point.x - segment.a.x) * segment.direction.x + (point.y - segment.a.y) * segment.direction.y
  const offset = Math.min(Math.max(t, 0), segment.length)
  const projected = along(segment, offset)
  return { offset, distance: Math.hypot(point.x - projected.x, point.y - projected.y) }
}

/**
 * Mur le plus proche d'un point : le point doit être dans l'épaisseur du mur, plus `tolerance` mm.
 * Les murs sont parcourus du dernier (au-dessus) au premier ; à distance égale, le plus haut gagne.
 */
export function findWallAt(
  point: Point,
  walls: readonly WallElement[],
  tolerance: number = 0,
): WallHit | null {
  let best: WallHit | null = null
  for (let w = walls.length - 1; w >= 0; w--) {
    const wall = walls[w]
    const count = wallSegmentCount(wall)
    for (let i = 0; i < count; i++) {
      const segment = wallSegment(wall, i)
      if (!segment) continue
      const { offset, distance } = projectOnSegment(point, segment)
      if (distance > wall.thickness / 2 + tolerance) continue
      if (!best || distance < best.distance - EPSILON) {
        best = { wall, segmentIndex: i, offset, distance }
      }
    }
  }
  return best
}

/**
 * Replace une ouverture après une modification de son mur (sommet déplacé, ajouté ou retiré) :
 * on garde le centre là où il était dans le document et on le projette sur le segment le plus
 * proche du nouveau mur, puis on le borne. `null` si l'ouverture ne tient plus nulle part :
 * l'appelant la supprime.
 */
export function relocateOpening(
  opening: OpeningElement,
  previousWall: Pick<WallElement, 'points' | 'thickness'>,
  nextWall: Pick<WallElement, 'points'>,
  siblings: readonly OpeningElement[],
): OpeningElement | null {
  const before = openingGeometry(opening, previousWall)
  const target = before?.center
  const count = wallSegmentCount(nextWall)

  // Segments candidats, du plus proche au plus lointain du centre d'origine.
  const candidates: { index: number; offset: number; distance: number }[] = []
  for (let i = 0; i < count; i++) {
    const segment = wallSegment(nextWall, i)
    if (!segment) continue
    if (target) {
      candidates.push({ index: i, ...projectOnSegment(target, segment) })
    } else if (i === opening.segmentIndex) {
      candidates.push({ index: i, offset: opening.offset, distance: 0 })
    }
  }
  candidates.sort((p, q) => p.distance - q.distance)

  for (const candidate of candidates) {
    const segment = wallSegment(nextWall, candidate.index)
    if (!segment) continue
    const occupied = openingsOnSegment(siblings, opening.wallId, candidate.index, opening.id).map(
      openingInterval,
    )
    const offset = clampOpeningOffset(candidate.offset, opening.width, segment.length, occupied)
    if (offset !== null) return { ...opening, segmentIndex: candidate.index, offset }
  }
  return null
}
