import type { CanvasElement } from '../../types/document'
import type { Box } from '../geometry/box'
import { unionBoxes } from '../geometry/box'
import { dimensionGeometry } from '../geometry/dimension'
import { toPoints } from '../geometry/polygon'
import type { Point } from '../geometry/viewport'
import { wallFaces } from '../geometry/walls'

/** Marge ajoutée de chaque côté de l'emprise d'un plan exporté, en mm réels. */
export const PLAN_EXPORT_MARGIN_MM = 500

function pointsBox(points: readonly Point[]): Box | null {
  if (points.length === 0) return null
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const x = Math.min(...xs)
  const y = Math.min(...ys)
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y }
}

/** Les points d'un élément posé en (x, y) puis tourné de `rotation` degrés autour de ce point. */
function placed(element: CanvasElement, local: readonly Point[]): Point[] {
  const angle = (element.rotation * Math.PI) / 180
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return local.map((p) => ({
    x: element.x + p.x * cos - p.y * sin,
    y: element.y + p.x * sin + p.y * cos,
  }))
}

/** Boîte englobante d'un élément dans le document (`null` s'il n'a pas d'étendue). */
export function elementBounds(element: CanvasElement): Box | null {
  switch (element.type) {
    case 'rect':
    case 'image':
      return pointsBox(
        placed(element, [
          { x: 0, y: 0 },
          { x: element.width, y: 0 },
          { x: element.width, y: element.height },
          { x: 0, y: element.height },
        ]),
      )
    case 'ellipse': {
      // Demi-largeur et demi-hauteur d'une ellipse tournée.
      const angle = (element.rotation * Math.PI) / 180
      const halfWidth = Math.hypot(element.radiusX * Math.cos(angle), element.radiusY * Math.sin(angle))
      const halfHeight = Math.hypot(element.radiusX * Math.sin(angle), element.radiusY * Math.cos(angle))
      return {
        x: element.x - halfWidth,
        y: element.y - halfHeight,
        width: halfWidth * 2,
        height: halfHeight * 2,
      }
    }
    case 'text': {
      // Hauteur estimée : une ligne par retour à la ligne (le retour automatique n'est pas mesuré).
      const lines = element.text.split('\n').length
      const height = element.fontSize * 1.2 * lines
      return pointsBox(
        placed(element, [
          { x: 0, y: 0 },
          { x: element.width, y: 0 },
          { x: element.width, y: height },
          { x: 0, y: height },
        ]),
      )
    }
    case 'line':
      return pointsBox(placed(element, toPoints(element.points)))
    case 'wall': {
      const { left, right } = wallFaces(element.points, element.thickness)
      const outline = [...left, ...right]
      return pointsBox(outline.length > 0 ? outline : toPoints(element.points))
    }
    case 'room':
      return pointsBox(toPoints(element.points))
    case 'dimension': {
      const geometry = dimensionGeometry(element.points, element.offset)
      const [ax, ay, bx, by] = element.points
      const points: Point[] = [
        { x: ax, y: ay },
        { x: bx, y: by },
      ]
      if (geometry) {
        points.push(...geometry.line, ...geometry.extensions.flat())
      }
      return pointsBox(points)
    }
  }
}

/**
 * Zone exportée d'un plan : rectangle englobant les éléments visibles, agrandi de `margin` mm de
 * chaque côté. `null` si le plan n'a aucun élément visible (rien à exporter).
 */
export function planExportExtent(
  elements: readonly CanvasElement[],
  margin: number = PLAN_EXPORT_MARGIN_MM,
): Box | null {
  const boxes = elements
    .filter((element) => !element.hidden)
    .map(elementBounds)
    .filter((box): box is Box => box !== null)
  const union = unionBoxes(boxes)
  if (!union) return null
  return {
    x: union.x - margin,
    y: union.y - margin,
    width: union.width + margin * 2,
    height: union.height + margin * 2,
  }
}
