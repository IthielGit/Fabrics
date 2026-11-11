import type { CanvasElement, OpeningElement, WallElement } from '../../types/document'
import { axisBubblePoints } from '../geometry/axes'
import type { Box } from '../geometry/box'
import { unionBoxes } from '../geometry/box'
import { dimensionGeometry } from '../geometry/dimension'
import { openingGeometry } from '../geometry/openings'
import { openingSymbol } from '../geometry/openingSymbol'
import { stairFootprint } from '../stairs/stairs'
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
    case 'furniture':
      return pointsBox(
        placed(element, [
          { x: 0, y: 0 },
          { x: element.width, y: 0 },
          { x: element.width, y: element.depth },
          { x: 0, y: element.depth },
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
    case 'platform':
      return pointsBox(toPoints(element.points))
    case 'stair':
      return pointsBox(stairFootprint(element))
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
    case 'axis': {
      // La ligne et ses deux bulles (qui dépassent des extrémités).
      const [ax, ay, bx, by] = element.points
      return pointsBox([{ x: ax, y: ay }, { x: bx, y: by }, ...axisBubblePoints(element.points)])
    }
    case 'opening':
      // Son emprise dépend du mur porteur (le battant d'une porte dépasse de l'épaisseur du mur) :
      // voir `openingBounds`, utilisé par `planExportExtent`.
      return null
  }
}

/**
 * Boîte englobante d'une ouverture sur son mur : la découpe dans le mur et le dessin complet
 * (battant et arc d'une porte compris). `null` si le segment du mur n'existe plus.
 */
export function openingBounds(opening: OpeningElement, wall: WallElement): Box | null {
  const geometry = openingGeometry(opening, wall)
  if (!geometry) return null
  const { cut, lines } = openingSymbol(opening, wall.thickness)

  const local: Point[] = [
    { x: cut.x, y: cut.y },
    { x: cut.x + cut.width, y: cut.y + cut.height },
  ]
  for (const line of lines) local.push(...toPoints(line))

  // Repère local (x le long du mur, y vers la normale) → document.
  const { center, direction, normal } = geometry
  return pointsBox(
    local.map((p) => ({
      x: center.x + p.x * direction.x + p.y * normal.x,
      y: center.y + p.x * direction.y + p.y * normal.y,
    })),
  )
}

/**
 * Zone exportée d'un plan : rectangle englobant les éléments visibles, agrandi de `margin` mm de
 * chaque côté. `null` si le plan n'a aucun élément visible (rien à exporter).
 */
export function planExportExtent(
  elements: readonly CanvasElement[],
  margin: number = PLAN_EXPORT_MARGIN_MM,
): Box | null {
  const walls = new Map(
    elements
      .filter((el): el is WallElement => el.type === 'wall' && !el.hidden)
      .map((wall) => [wall.id, wall]),
  )
  const boxes = elements
    .filter((element) => !element.hidden)
    .map((element) => {
      if (element.type !== 'opening') return elementBounds(element)
      // Une ouverture suit son mur : masqué ou absent, elle ne compte pas.
      const wall = walls.get(element.wallId)
      return wall ? openingBounds(element, wall) : null
    })
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
