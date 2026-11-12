import type { CanvasElement, WallElement } from '../../types/document'
import type { Box } from './box'
import { toPoints } from './polygon'
import { constrainStretch, stretchZone, type StretchResult } from './stretchZone'
import type { Point } from './viewport'

const EPSILON = 1e-6

/**
 * Zone d'étirement réduite à un côté droit (horizontal ou vertical) d'un mur : une boîte plate qui
 * contient les deux extrémités du côté, et `normal`, la direction du déplacement (perpendiculaire).
 * `null` pour un côté en biais ou de longueur nulle (rien à glisser en gardant les angles droits).
 */
export function wallSideZone(
  wall: Pick<WallElement, 'points'>,
  sideIndex: number,
): { zone: Box; normal: Point } | null {
  const points = toPoints(wall.points)
  const a = points[sideIndex]
  const b = points[sideIndex + 1]
  if (!a || !b) return null
  if (Math.abs(a.y - b.y) < EPSILON && Math.abs(a.x - b.x) >= EPSILON) {
    return {
      zone: { x: Math.min(a.x, b.x), y: a.y, width: Math.abs(a.x - b.x), height: 0 },
      normal: { x: 0, y: 1 },
    }
  }
  if (Math.abs(a.x - b.x) < EPSILON && Math.abs(a.y - b.y) >= EPSILON) {
    return {
      zone: { x: a.x, y: Math.min(a.y, b.y), width: 0, height: Math.abs(a.y - b.y) },
      normal: { x: 1, y: 0 },
    }
  }
  return null
}

export interface WallSideMove {
  /** Déplacement retenu (mm entiers) ; nul si les angles droits l'empêchent. */
  delta: Point
  /** Un déplacement était demandé mais un mur aligné ou en biais l'empêche. */
  blocked: boolean
  /** Ce qui change (murs voisins allongés, pièces, ouvertures) ; `null` si rien ne change. */
  result: StretchResult | null
}

/**
 * Glisse un seul côté d'un mur de `distance` mm perpendiculairement : les murs voisins s'allongent
 * ou se raccourcissent, les pièces dont un sommet est sur ce côté le suivent, les ouvertures
 * gardent leur place réelle (même calcul que l'outil Étirer). `elements` : ceux du niveau.
 * Un mur aligné dans le prolongement du côté, ou un côté voisin en biais, bloque le déplacement.
 */
export function moveWallSide(
  elements: readonly CanvasElement[],
  wallId: string,
  sideIndex: number,
  distance: number,
): WallSideMove | null {
  const wall = elements.find((el): el is WallElement => el.id === wallId && el.type === 'wall')
  if (!wall || wall.locked) return null
  const side = wallSideZone(wall, sideIndex)
  if (!side) return null
  const wanted = Math.round(distance)
  const desired = { x: side.normal.x * wanted, y: side.normal.y * wanted }
  const { delta, blockedByDiagonal } = constrainStretch(elements, side.zone, desired)
  const blocked = wanted !== 0 && (blockedByDiagonal || (delta.x === 0 && delta.y === 0))
  return { delta, blocked, result: stretchZone(elements, side.zone, delta) }
}
