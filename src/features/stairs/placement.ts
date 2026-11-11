import type { Level, StairElement } from '../../types/document'
import { createStairElement } from '../documents/elements'
import type { Point } from '../geometry/viewport'
import { defaultStairLengths, levelAboveOf, stairSize } from './stairs'

/**
 * Escalier à poser au point `point` (son emprise est centrée sur ce point, aimanté à la grille
 * `gridSize` s'il y en a une). Les longueurs sont calculées pour la hauteur à monter entre le
 * niveau de départ et le niveau du dessus. `null` si `levelId` n'a pas de niveau au-dessus
 * (la pose est alors refusée).
 */
export function planStairPlacement(
  levels: readonly Level[] | undefined,
  levelId: string | null,
  shape: StairElement['shape'],
  point: Point,
  gridSize: number | null,
  name: string,
): StairElement | null {
  if (!levels || levelId === null) return null
  const start = levels.find((level) => level.id === levelId)
  const upper = levelAboveOf(levels, levelId)
  if (!start || !upper) return null

  const lengths = defaultStairLengths(shape, upper.elevation - start.elevation)
  const draft = createStairElement(name, shape, 0, 0, lengths)
  const size = stairSize(draft)
  const snap = (value: number) =>
    gridSize !== null && gridSize > 0 ? Math.round(value / gridSize) * gridSize : Math.round(value)
  return {
    ...draft,
    x: Math.round(snap(point.x) - size.width / 2),
    y: Math.round(snap(point.y) - size.height / 2),
  }
}
