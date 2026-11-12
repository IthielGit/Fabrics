import type { CanvasElement, OpeningElement, WallElement } from '../../types/document'
import type { Box } from '../geometry/box'
import { unionBoxes } from '../geometry/box'
import { elementBounds, openingBounds } from '../export/bounds'
import type { Point } from '../geometry/viewport'
import type { MetresWarning } from './warnings'

/** Marge (mm) autour de la zone entourée quand l'avertissement n'a pas de contour propre. */
const FOCUS_MARGIN = 300

function boundsOfPoints(points: readonly Point[]): Box | null {
  if (points.length === 0) return null
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const x = Math.min(...xs)
  const y = Math.min(...ys)
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y }
}

/**
 * Zone du plan à montrer pour un avertissement : le contour de la surface en cause, sinon
 * l'emprise des éléments concernés (pour une ouverture, la partie de son mur qu'elle occupe).
 * `null` si rien n'est trouvé (élément supprimé entre-temps).
 */
export function warningFocusBox(
  warning: MetresWarning,
  targetIds: readonly string[],
  elements: readonly CanvasElement[],
): Box | null {
  if ('rings' in warning) return boundsOfPoints(warning.rings.flat())
  const byId = new Map(elements.map((el) => [el.id, el]))
  const boxes: Box[] = []
  for (const id of targetIds) {
    const element = byId.get(id)
    if (!element) continue
    let box: Box | null
    if (element.type === 'opening') {
      const wall = byId.get((element as OpeningElement).wallId)
      box = wall?.type === 'wall' ? openingBounds(element, wall as WallElement) : null
    } else {
      box = elementBounds(element)
    }
    if (box) boxes.push(box)
  }
  const union = unionBoxes(boxes)
  if (!union) return null
  return {
    x: union.x - FOCUS_MARGIN,
    y: union.y - FOCUS_MARGIN,
    width: union.width + FOCUS_MARGIN * 2,
    height: union.height + FOCUS_MARGIN * 2,
  }
}

/** Contour rectangulaire d'une zone, pour la surligner sur le plan. */
export function boxRing(box: Box): Point[] {
  return [
    { x: box.x, y: box.y },
    { x: box.x + box.width, y: box.y },
    { x: box.x + box.width, y: box.y + box.height },
    { x: box.x, y: box.y + box.height },
  ]
}
