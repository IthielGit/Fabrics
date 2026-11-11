import type { OpeningElement, OpeningStyle, WallElement } from '../../types/document'
import { OPENING_DEFAULTS } from '../documents/elements'
import {
  hasPocketRoom,
  isStyleAllowed,
  openingStyle,
  QUICK_SIZES,
  styleSize,
  supportsTiltTurn,
  type QuickSize,
} from '../openings/styles'
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

/** Problème d'une modification : ceux de la pose, plus « pas de place dans le mur pour le galandage ». */
export type EditProblem = PlacementProblem | 'no-pocket'

export type OpeningEditResult = { opening: OpeningElement } | { problem: EditProblem }

type SizePatch = Partial<Pick<OpeningElement, 'width' | 'height' | 'sillHeight'>>

/** Retire le style et l'option oscillo-battant (le style d'un autre type n'a plus de sens). */
function withoutStyle(opening: OpeningElement): OpeningElement {
  const rest: OpeningElement = { ...opening }
  delete rest.style
  delete rest.tiltTurn
  return rest
}

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
  const plain = withoutStyle(opening)
  if (kind !== 'window') return { ...plain, kind, sillHeight: 0 }
  const wanted = opening.sillHeight > 0 ? opening.sillHeight : OPENING_DEFAULTS.window.sillHeight
  const sillHeight = Math.max(0, Math.min(wanted, wallHeight - opening.height))
  return { ...plain, kind, sillHeight }
}

/**
 * Change le type d'une ouverture et, si elle avait encore la taille par défaut de son ancien type
 * (elle n'a pas été redimensionnée à la main), lui donne la taille par défaut du nouveau : une
 * fenêtre de 1200 × 1000 devenue porte passe à 900 × 2100. Une taille personnalisée est gardée,
 * de même que l'ancienne taille si la nouvelle ne tient pas (mur trop bas, pas assez de place).
 */
export function changeOpeningKindAndSize(
  opening: OpeningElement,
  kind: OpeningElement['kind'],
  wall: Pick<WallElement, 'points' | 'height'>,
  openings: readonly OpeningElement[],
): OpeningElement {
  const retyped = changeOpeningKind(opening, kind, wall.height)
  if (retyped === opening) return opening
  const previous = styleSize(opening.kind, openingStyle(opening)) ?? OPENING_DEFAULTS[opening.kind]
  const untouched = opening.width === previous.width && opening.height === previous.height
  if (!untouched) return retyped
  const wanted = OPENING_DEFAULTS[kind]
  const resized = resizeOpening(retyped, wanted, wall, openings)
  return 'opening' in resized ? resized.opening : retyped
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
  if (
    openingStyle(next) === 'slidingPocket' &&
    !hasPocketRoom(offset, next.width, segment.length, occupied)
  ) {
    return { problem: 'no-pocket' }
  }
  return { opening: { ...next, offset } }
}

/**
 * Change le style d'une ouverture. Si elle avait encore la taille par défaut de son ancien style
 * (non modifiée à la main), elle prend celle du nouveau ; une taille modifiée est gardée, ainsi que
 * l'ancienne taille si la nouvelle ne tient pas. L'option oscillo-battant est retirée si le nouveau
 * style n'a pas de vantaux. Une porte à galandage sans longueur de mur libre à côté est refusée
 * (`no-pocket`).
 */
export function changeOpeningStyle(
  opening: OpeningElement,
  style: OpeningStyle,
  wall: Pick<WallElement, 'points' | 'height'>,
  openings: readonly OpeningElement[],
): OpeningEditResult {
  if (!isStyleAllowed(opening.kind, style) || openingStyle(opening) === style) return { opening }
  const current = styleSize(opening.kind, openingStyle(opening))
  const wanted = styleSize(opening.kind, style)
  const untouched =
    current !== null &&
    opening.width === current.width &&
    opening.height === current.height &&
    opening.sillHeight === current.sillHeight
  const restyled = restyle(opening, style)
  if (untouched && wanted) {
    const resized = resizeOpening(restyled, wanted, wall, openings)
    if ('opening' in resized) return resized
    if (resized.problem === 'no-pocket') return resized
  }
  return validatePocket(restyled, wall, openings)
}

/**
 * Applique une taille rapide : son style et sa taille d'un seul coup (porte d'entrée, porte-fenêtre,
 * vitrine, passe-plat…). Refusé comme un redimensionnement s'il ne tient pas.
 */
export function applyQuickSize(
  opening: OpeningElement,
  quickId: QuickSize['id'],
  wall: Pick<WallElement, 'points' | 'height'>,
  openings: readonly OpeningElement[],
): OpeningEditResult {
  const quick = QUICK_SIZES.find((item) => item.id === quickId)
  if (!quick || quick.kind !== opening.kind) return { opening }
  return resizeOpening(restyle(opening, quick.style), quick, wall, openings)
}

function restyle(opening: OpeningElement, style: OpeningStyle): OpeningElement {
  const next: OpeningElement = { ...opening, style }
  if (!supportsTiltTurn(style) && next.tiltTurn !== undefined) delete next.tiltTurn
  return next
}

/** Vérifie la place du galandage sans changer la taille. */
function validatePocket(
  opening: OpeningElement,
  wall: Pick<WallElement, 'points' | 'height'>,
  openings: readonly OpeningElement[],
): OpeningEditResult {
  if (openingStyle(opening) !== 'slidingPocket') return { opening }
  const segment = wallSegment(wall, opening.segmentIndex)
  if (!segment) return { problem: 'no-room' }
  const occupied = openingsOnSegment(openings, opening.wallId, opening.segmentIndex, opening.id).map(
    openingInterval,
  )
  return hasPocketRoom(opening.offset, opening.width, segment.length, occupied)
    ? { opening }
    : { problem: 'no-pocket' }
}

/** Active ou retire l'option oscillo-battant (fenêtres à vantaux seulement). */
export function setTiltTurn(opening: OpeningElement, tiltTurn: boolean): OpeningElement {
  if (!supportsTiltTurn(openingStyle(opening))) return opening
  const next: OpeningElement = { ...opening }
  if (tiltTurn) next.tiltTurn = true
  else delete next.tiltTurn
  return next
}

/** Charnière de l'autre côté de la porte. */
export function flipHinge(opening: OpeningElement): OpeningElement {
  return { ...opening, hinge: opening.hinge === 'start' ? 'end' : 'start' }
}

/** La porte s'ouvre de l'autre côté du mur. */
export function flipSide(opening: OpeningElement): OpeningElement {
  return { ...opening, side: opening.side === 'left' ? 'right' : 'left' }
}
