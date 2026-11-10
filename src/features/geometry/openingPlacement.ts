import type { OpeningElement, WallElement } from '../../types/document'
import {
  clampOpeningOffset,
  findWallAt,
  openingFitsHeight,
  openingInterval,
  openingsOnSegment,
  wallSegment,
} from './openings'
import type { Point } from './viewport'

/** Pourquoi une ouverture ne peut pas être posée à cet endroit. */
export type PlacementProblem = 'no-room' | 'too-tall'

/** Résultat du survol d'un mur avec un outil Porte ou Fenêtre. */
export interface OpeningPlacement {
  wall: WallElement
  segmentIndex: number
  /** mm depuis le début du segment : position valable, ou position dessinée si `problem` est défini. */
  offset: number
  /** Côté du mur où se trouve le curseur : la porte s'y ouvre. */
  side: 'left' | 'right'
  problem: PlacementProblem | null
}

export interface OpeningSize {
  width: number
  height: number
  sillHeight: number
}

/** Les positions sont arrondies à ce pas (mm) pour obtenir des distances « rondes ». */
export const OPENING_OFFSET_STEP = 10

/**
 * Où poser une ouverture si l'utilisateur clique en `point` : mur survolé, position bornée sur
 * son segment, côté d'ouverture. `null` si le point n'est sur aucun mur (à `tolerance` mm près).
 * Le premier mur de `walls` en partant de la fin (le plus haut) l'emporte à distance égale.
 */
export function planOpeningPlacement(
  point: Point,
  walls: readonly WallElement[],
  openings: readonly OpeningElement[],
  size: OpeningSize,
  tolerance: number = 0,
): OpeningPlacement | null {
  const hit = findWallAt(point, walls, tolerance)
  if (!hit) return null
  const segment = wallSegment(hit.wall, hit.segmentIndex)
  if (!segment) return null

  const side =
    (point.x - segment.a.x) * segment.normal.x + (point.y - segment.a.y) * segment.normal.y >= 0
      ? 'left'
      : 'right'
  const desired = Math.round(hit.offset / OPENING_OFFSET_STEP) * OPENING_OFFSET_STEP
  const base = { wall: hit.wall, segmentIndex: hit.segmentIndex, side } as const

  // Position dessinée quand la pose est impossible : centre borné sur le segment.
  const half = size.width / 2
  const drawn = Math.min(Math.max(desired, half), Math.max(half, segment.length - half))

  if (!openingFitsHeight(size, hit.wall.height)) {
    return { ...base, offset: drawn, problem: 'too-tall' }
  }
  const occupied = openingsOnSegment(openings, hit.wall.id, hit.segmentIndex).map(openingInterval)
  const offset = clampOpeningOffset(desired, size.width, segment.length, occupied)
  if (offset === null) return { ...base, offset: drawn, problem: 'no-room' }
  return { ...base, offset, problem: null }
}

/**
 * Distance, le long du segment, entre son début et la projection de `point` (mm, non bornée :
 * négative avant le début, supérieure à la longueur après la fin). `null` si le segment n'existe pas.
 */
export function pointerOffset(
  point: Point,
  wall: Pick<WallElement, 'points'>,
  segmentIndex: number,
): number | null {
  const segment = wallSegment(wall, segmentIndex)
  if (!segment) return null
  return (point.x - segment.a.x) * segment.direction.x + (point.y - segment.a.y) * segment.direction.y
}

/**
 * Nouvelle position d'une ouverture que l'on glisse le long de son mur : le curseur est en `pointer`,
 * `grab` = écart (mm) entre le curseur et le centre de l'ouverture au moment de la saisie.
 * La position est arrondie à 1 cm, reste sur le segment et ne chevauche aucune autre ouverture ;
 * si aucune place n'existe, l'ouverture garde sa position.
 */
export function slideOpening(
  opening: OpeningElement,
  wall: Pick<WallElement, 'points'>,
  openings: readonly OpeningElement[],
  pointer: Point,
  grab: number,
): OpeningElement {
  const segment = wallSegment(wall, opening.segmentIndex)
  const along = pointerOffset(pointer, wall, opening.segmentIndex)
  if (!segment || along === null) return opening
  const desired = Math.round((along - grab) / OPENING_OFFSET_STEP) * OPENING_OFFSET_STEP
  const occupied = openingsOnSegment(openings, opening.wallId, opening.segmentIndex, opening.id).map(
    openingInterval,
  )
  const offset = clampOpeningOffset(desired, opening.width, segment.length, occupied)
  return offset === null || offset === opening.offset ? opening : { ...opening, offset }
}
