import type { CanvasElement } from '../../types/document'

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
