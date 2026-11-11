import type { CanvasElement } from '../../types/document'
import AxisShape from './shapes/AxisShape'
import ChimneyShape from './shapes/ChimneyShape'
import DimensionShape from './shapes/DimensionShape'
import EllipseShape from './shapes/EllipseShape'
import FurnitureShape from './shapes/FurnitureShape'
import ImageShape from './shapes/ImageShape'
import LineShape from './shapes/LineShape'
import OpeningShape from './shapes/OpeningShape'
import PlatformShape from './shapes/PlatformShape'
import RoofShape from './shapes/RoofShape'
import RectShape from './shapes/RectShape'
import RoomShape from './shapes/RoomShape'
import SectionShape from './shapes/SectionShape'
import StairShape from './shapes/StairShape'
import type { ShapeInteraction } from './shapes/shapeTypes'
import TextShape from './shapes/TextShape'
import WallShape from './shapes/WallShape'

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
    case 'wall':
      return <WallShape element={element} {...interaction} />
    case 'room':
      return <RoomShape element={element} {...interaction} />
    case 'dimension':
      return <DimensionShape element={element} {...interaction} />
    case 'opening':
      return <OpeningShape element={element} {...interaction} />
    case 'axis':
      return <AxisShape element={element} {...interaction} />
    case 'furniture':
      return <FurnitureShape element={element} {...interaction} />
    case 'platform':
      return <PlatformShape element={element} {...interaction} />
    case 'roof':
      return <RoofShape element={element} {...interaction} />
    case 'stair':
      return <StairShape element={element} {...interaction} />
    case 'chimney':
      return <ChimneyShape element={element} {...interaction} />
    case 'section':
      return <SectionShape element={element} {...interaction} />
  }
}
