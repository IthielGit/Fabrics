import type { Level, StairElement } from '../../types/document'
import { createStairElement } from '../documents/elements'
import type { Guide } from '../geometry/guides'
import { gridOnly, snapBox, type PlacementSnap } from '../geometry/snapLines'
import type { Point } from '../geometry/viewport'
import { defaultStairLengths, levelAboveOf, stairSize } from './stairs'

/**
 * Escalier à poser au point `point`, avec les guides d'alignement de l'aperçu. Son emprise est
 * centrée sur ce point, puis ses bords et son centre s'aimantent aux faces des murs et aux bords
 * des éléments proches ; à défaut, son coin s'aimante à la grille. Les longueurs sont calculées
 * pour la hauteur à monter entre le niveau de départ et le niveau du dessus. `null` si `levelId`
 * n'a pas de niveau au-dessus (la pose est alors refusée).
 */
export function planStairPlacementWithGuides(
  levels: readonly Level[] | undefined,
  levelId: string | null,
  shape: StairElement['shape'],
  point: Point,
  snap: PlacementSnap | number | null,
  name: string,
): { stair: StairElement; guides: Guide[] } | null {
  if (!levels || levelId === null) return null
  const start = levels.find((level) => level.id === levelId)
  const upper = levelAboveOf(levels, levelId)
  if (!start || !upper) return null

  const lengths = defaultStairLengths(shape, upper.elevation - start.elevation)
  const draft = createStairElement(name, shape, 0, 0, lengths)
  const size = stairSize(draft)
  const snapped = snapBox(
    { x: point.x - size.width / 2, y: point.y - size.height / 2, width: size.width, height: size.height },
    typeof snap === 'object' && snap !== null ? snap : gridOnly(snap),
  )
  return { stair: { ...draft, x: snapped.x, y: snapped.y }, guides: snapped.guides }
}

/** Comme `planStairPlacementWithGuides`, sans les guides. */
export function planStairPlacement(
  levels: readonly Level[] | undefined,
  levelId: string | null,
  shape: StairElement['shape'],
  point: Point,
  snap: PlacementSnap | number | null,
  name: string,
): StairElement | null {
  return planStairPlacementWithGuides(levels, levelId, shape, point, snap, name)?.stair ?? null
}
