import type { CanvasElement } from '../../types/document'
import EllipseShape from './shapes/EllipseShape'
import RectShape from './shapes/RectShape'
import type { ShapeInteraction } from './shapes/shapeTypes'

interface ElementNodeProps extends ShapeInteraction {
  element: CanvasElement
}

/** Affiche un élément du document avec le composant Konva qui correspond à son type. */
export default function ElementNode({ element, ...interaction }: ElementNodeProps) {
  switch (element.type) {
    case 'rect':
      return <RectShape element={element} {...interaction} />
    case 'ellipse':
      return <EllipseShape element={element} {...interaction} />
    default:
      // Texte, ligne, image (M2) et éléments de plan (M3) : pas encore affichés.
      return null
  }
}
