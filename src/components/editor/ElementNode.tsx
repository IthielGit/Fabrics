import type { CanvasElement } from '../../types/document'
import EllipseShape from './shapes/EllipseShape'
import ImageShape from './shapes/ImageShape'
import LineShape from './shapes/LineShape'
import RectShape from './shapes/RectShape'
import type { ShapeInteraction } from './shapes/shapeTypes'
import TextShape from './shapes/TextShape'

interface ElementNodeProps extends ShapeInteraction {
  element: CanvasElement
  /** Vrai si cet élément (un texte) est en cours d'édition. */
  editing?: boolean
}

/** Affiche un élément du document avec le composant Konva qui correspond à son type. */
export default function ElementNode({ element, editing = false, ...interaction }: ElementNodeProps) {
  switch (element.type) {
    case 'rect':
      return <RectShape element={element} {...interaction} />
    case 'ellipse':
      return <EllipseShape element={element} {...interaction} />
    case 'line':
      return <LineShape element={element} {...interaction} />
    case 'text':
      return <TextShape element={element} editing={editing} {...interaction} />
    case 'image':
      return <ImageShape element={element} {...interaction} />
    default:
      // Éléments de plan (mur, pièce, cote) : jalon M3.
      return null
  }
}
