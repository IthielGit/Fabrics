import type { CanvasElement } from '../../types/document'
import {
  axisIntersections,
  collectAxisSegments,
  nearestPointOnAxes,
  type AxisSegment,
} from './axes'
import { toPoints } from './polygon'
import type { Point } from './viewport'
import { wallFaceCorners, wallFaces } from './walls'

export type SnapKind = 'vertex' | 'axis' | 'grid' | 'angle' | 'none'

export interface PointSnapResult {
  point: Point
  kind: SnapKind
}

export interface PointSnapContext {
  /** Sommets existants sur lesquels on peut s'aimanter. */
  vertices: readonly Point[]
  /** Pas de la grille en mm, ou `null` si l'aimantation sur la grille est désactivée. */
  gridSize: number | null
  /** Distance d'accroche aux sommets, dans l'unité du document (8 px écran ÷ échelle). */
  threshold: number
  /** Point précédent du tracé (pour la contrainte d'angle), ou `null`. */
  from: Point | null
  /** Maj enfoncée : contraindre la direction à un multiple de 45° depuis `from`. */
  constrain: boolean
  /** Axes de construction : le point s'aimante sur leur ligne (voir `collectSnapAxes`). */
  axes?: readonly AxisSegment[]
}

const SQRT_HALF = Math.SQRT1_2

// Les 8 directions (0°, 45°, 90°…) avec des valeurs exactes pour les axes (pas de 6e-17 parasite).
const DIRECTIONS: readonly Point[] = [
  { x: 1, y: 0 },
  { x: SQRT_HALF, y: SQRT_HALF },
  { x: 0, y: 1 },
  { x: -SQRT_HALF, y: SQRT_HALF },
  { x: -1, y: 0 },
  { x: -SQRT_HALF, y: -SQRT_HALF },
  { x: 0, y: -1 },
  { x: SQRT_HALF, y: -SQRT_HALF },
]

/**
 * Ramène `to` sur la direction (multiple de 45°) la plus proche de `from` : le point est la
 * projection du curseur sur cette direction, donc il reste aligné avec le curseur.
 */
export function constrainAngle(from: Point, to: Point): Point {
  const dx = to.x - from.x
  const dy = to.y - from.y
  if (dx === 0 && dy === 0) return { ...to }
  const step = Math.round(Math.atan2(dy, dx) / (Math.PI / 4))
  const direction = DIRECTIONS[((step % 8) + 8) % 8]
  const length = dx * direction.x + dy * direction.y
  return { x: from.x + direction.x * length, y: from.y + direction.y * length }
}

function roundToGrid(value: number, grid: number): number {
  return Math.round(value / grid) * grid
}

function nearestVertex(point: Point, vertices: readonly Point[], threshold: number): Point | null {
  let best: Point | null = null
  let bestDistance = threshold
  for (const vertex of vertices) {
    const distance = Math.hypot(vertex.x - point.x, vertex.y - point.y)
    if (distance <= bestDistance) {
      best = vertex
      bestDistance = distance
    }
  }
  return best
}

/**
 * Aimantation d'un point en cours de placement. Ordre de priorité (docs/02-ARCHITECTURE.md) :
 * 1. un sommet existant à moins de `threshold` (les croisements d'axes en font partie) ;
 * 2. la ligne d'un axe de construction à moins de `threshold` (sauf avec Maj : la direction
 *    contrainte prime) ;
 * 3. la grille, si elle est active ;
 * 4. avec Maj : la direction contrainte à un multiple de 45° depuis le point précédent
 *    (la grille s'applique alors le long de cette direction).
 */
export function snapPoint(raw: Point, context: PointSnapContext): PointSnapResult {
  const { vertices, gridSize, threshold, from, constrain, axes } = context
  const constrained = constrain && from !== null
  let candidate = constrained ? constrainAngle(from, raw) : raw

  const vertex = nearestVertex(candidate, vertices, threshold)
  if (vertex) return { point: { ...vertex }, kind: 'vertex' }

  if (!constrained && axes && axes.length > 0) {
    const onAxis = nearestPointOnAxes(candidate, axes, threshold)
    if (onAxis) return { point: onAxis, kind: 'axis' }
  }

  if (gridSize !== null && gridSize > 0) {
    if (constrained) {
      const dx = candidate.x - from.x
      const dy = candidate.y - from.y
      if (Math.abs(dy) < 1e-9) {
        candidate = { x: roundToGrid(candidate.x, gridSize), y: candidate.y }
      } else if (Math.abs(dx) < 1e-9) {
        candidate = { x: candidate.x, y: roundToGrid(candidate.y, gridSize) }
      } else {
        // Diagonale à 45° : on arrondit x, y suit pour rester à 45°.
        const x = roundToGrid(candidate.x, gridSize)
        candidate = { x, y: from.y + Math.sign(dy) * Math.abs(x - from.x) }
      }
      return { point: candidate, kind: 'angle' }
    }
    return {
      point: { x: roundToGrid(candidate.x, gridSize), y: roundToGrid(candidate.y, gridSize) },
      kind: 'grid',
    }
  }

  return { point: candidate, kind: constrained ? 'angle' : 'none' }
}

/**
 * Sommets du plan sur lesquels s'aimanter : points des murs, angles de leurs faces (et croisements
 * des faces de murs différents), sommets des pièces, extrémités des cotes, croisements des axes.
 * `excludeIds` écarte des éléments (par exemple celui dont on déplace un sommet).
 */
export function collectSnapVertices(
  elements: readonly CanvasElement[],
  excludeIds: ReadonlySet<string> = new Set(),
): Point[] {
  const vertices: Point[] = []
  const walls: { points: readonly number[]; thickness: number }[] = []

  for (const element of elements) {
    if (element.hidden || excludeIds.has(element.id)) continue
    switch (element.type) {
      case 'wall':
        vertices.push(...toPoints(element.points))
        walls.push({ points: element.points, thickness: element.thickness })
        break
      case 'room':
        vertices.push(...toPoints(element.points))
        break
      case 'dimension':
        vertices.push(...toPoints(element.points))
        break
    }
  }

  vertices.push(...wallFaceCorners(walls))
  vertices.push(...axisIntersections(collectAxisSegments(elements, excludeIds)))
  return vertices
}

/** Axes de construction visibles sur lesquels s'aimanter (voir `PointSnapContext.axes`). */
export function collectSnapAxes(
  elements: readonly CanvasElement[],
  excludeIds: ReadonlySet<string> = new Set(),
): AxisSegment[] {
  return collectAxisSegments(elements, excludeIds)
}

export { wallFaces }
