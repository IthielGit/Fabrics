import type { OpeningElement, WallElement } from '../../types/document'
import { OPENING_DEFAULTS } from '../documents/elements'
import type { PlacementProblem } from './openingPlacement'
import {
  clampOpeningOffset,
  openingFitsHeight,
  openingInterval,
  openingsOnSegment,
  wallSegment,
} from './openings'

/** Taille minimale d'une ouverture, en mm. */
export const MIN_OPENING_SIZE = 100

export type OpeningEditResult = { opening: OpeningElement } | { problem: PlacementProblem }

type SizePatch = Partial<Pick<OpeningElement, 'width' | 'height' | 'sillHeight'>>

/**
 * Change le type d'une ouverture (porte, fenêtre, baie). Une porte et une baie descendent jusqu'au
 * sol (allège 0) ; une fenêtre reçoit une allège par défaut, réduite si elle dépasserait le mur.
 */
export function changeOpeningKind(
  opening: OpeningElement,
  kind: OpeningElement['kind'],
  wallHeight: number,
): OpeningElement {
  if (opening.kind === kind) return opening
  if (kind !== 'window') return { ...opening, kind, sillHeight: 0 }
  const wanted = opening.sillHeight > 0 ? opening.sillHeight : OPENING_DEFAULTS.window.sillHeight
  const sillHeight = Math.max(0, Math.min(wanted, wallHeight - opening.height))
  return { ...opening, kind, sillHeight }
}

/**
 * Change la largeur, la hauteur ou l'allège d'une ouverture en vérifiant qu'elle tient toujours :
 * dans la hauteur du mur, sur son segment et sans chevaucher une voisine (le centre est décalé au
 * besoin). Renvoie le problème rencontré, sans rien modifier, si ce n'est pas possible.
 */
export function resizeOpening(
  opening: OpeningElement,
  patch: SizePatch,
  wall: Pick<WallElement, 'points' | 'height'>,
  openings: readonly OpeningElement[],
): OpeningEditResult {
  const next: OpeningElement = {
    ...opening,
    width: Math.max(MIN_OPENING_SIZE, patch.width ?? opening.width),
    height: Math.max(MIN_OPENING_SIZE, patch.height ?? opening.height),
    sillHeight: Math.max(0, patch.sillHeight ?? opening.sillHeight),
  }
  if (!openingFitsHeight(next, wall.height)) return { problem: 'too-tall' }

  const segment = wallSegment(wall, opening.segmentIndex)
  if (!segment) return { problem: 'no-room' }
  const occupied = openingsOnSegment(openings, opening.wallId, opening.segmentIndex, opening.id).map(
    openingInterval,
  )
  const offset = clampOpeningOffset(opening.offset, next.width, segment.length, occupied)
  if (offset === null) return { problem: 'no-room' }
  return { opening: { ...next, offset } }
}

/** Charnière de l'autre côté de la porte. */
export function flipHinge(opening: OpeningElement): OpeningElement {
  return { ...opening, hinge: opening.hinge === 'start' ? 'end' : 'start' }
}

/** La porte s'ouvre de l'autre côté du mur. */
export function flipSide(opening: OpeningElement): OpeningElement {
  return { ...opening, side: opening.side === 'left' ? 'right' : 'left' }
}
