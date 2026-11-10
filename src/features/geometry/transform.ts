import type {
  CanvasElement,
  DimensionElement,
  RoomElement,
  WallElement,
} from '../../types/document'
import { toPoints } from './polygon'
import type { Point } from './viewport'

/** Vrai pour les éléments de plan : leurs points sont absolus et leur position `x, y` reste à 0. */
export function hasAbsolutePoints(
  element: CanvasElement,
): element is WallElement | RoomElement | DimensionElement {
  return element.type === 'wall' || element.type === 'room' || element.type === 'dimension'
}

/**
 * Déplace un élément de (dx, dy). Un mur, une pièce ou une cote déplace ses points (leur position
 * `x, y` reste à 0, voir docs/02-ARCHITECTURE.md) ; les autres éléments déplacent `x, y`.
 */
export function translateElement(element: CanvasElement, dx: number, dy: number): CanvasElement {
  switch (element.type) {
    case 'wall':
    case 'room':
      return { ...element, points: element.points.map((v, i) => v + (i % 2 === 0 ? dx : dy)) }
    case 'dimension': {
      const [x1, y1, x2, y2] = element.points
      return { ...element, points: [x1 + dx, y1 + dy, x2 + dx, y2 + dy] }
    }
    default:
      return { ...element, x: element.x + dx, y: element.y + dy }
  }
}

/** Sommets modifiables d'un mur, d'une pièce ou d'une cote (liste vide pour les autres éléments). */
export function getVertices(element: CanvasElement): Point[] {
  return hasAbsolutePoints(element) ? toPoints(element.points) : []
}

/** Déplace un sommet (indice `index`) d'un mur, d'une pièce ou d'une cote. */
export function moveVertex(element: CanvasElement, index: number, to: Point): CanvasElement {
  if (!hasAbsolutePoints(element)) return element
  const count = element.points.length / 2
  if (!Number.isInteger(index) || index < 0 || index >= count) return element

  if (element.type === 'dimension') {
    const points: [number, number, number, number] = [...element.points]
    points[index * 2] = to.x
    points[index * 2 + 1] = to.y
    return { ...element, points }
  }
  if (element.type === 'wall' || element.type === 'room') {
    const points = [...element.points]
    points[index * 2] = to.x
    points[index * 2 + 1] = to.y
    return { ...element, points }
  }
  return element
}

/** État d'un nœud Konva à la fin d'un déplacement, d'un redimensionnement ou d'une rotation. */
export interface NodeTransform {
  x: number
  y: number
  rotation: number
  scaleX: number
  scaleY: number
}

/**
 * Applique la transformation d'un nœud à un élément du document.
 * Konva exprime le redimensionnement par un facteur d'échelle ; on le « cuit » dans les
 * dimensions de l'élément (le nœud est ensuite remis à l'échelle 1).
 */
export function applyNodeTransform(element: CanvasElement, node: NodeTransform): CanvasElement {
  const base = { x: node.x, y: node.y, rotation: node.rotation }
  const scaleX = Math.abs(node.scaleX)
  const scaleY = Math.abs(node.scaleY)

  switch (element.type) {
    case 'rect':
    case 'image':
      return {
        ...element,
        ...base,
        width: element.width * scaleX,
        height: element.height * scaleY,
      }
    case 'ellipse':
      return {
        ...element,
        ...base,
        radiusX: element.radiusX * scaleX,
        radiusY: element.radiusY * scaleY,
      }
    case 'text':
      return { ...element, ...base, width: element.width * scaleX }
    case 'line':
      // Les points sont relatifs à (x, y) : on les étire dans les axes du nœud.
      return {
        ...element,
        ...base,
        points: element.points.map((value, index) => value * (index % 2 === 0 ? scaleX : scaleY)),
      }
    default:
      // Éléments de plan : pas de redimensionnement par le transformateur (voir M3).
      return { ...element, ...base }
  }
}
