import { Rect } from 'react-konva'
import type { RectElement } from '../../../types/document'
import { elementNodeProps } from './elementNodeProps'
import type { ShapeInteraction } from './shapeTypes'

interface RectShapeProps extends ShapeInteraction {
  element: RectElement
}

export default function RectShape({ element, ...interaction }: RectShapeProps) {
  return (
    <Rect
      {...elementNodeProps(element, interaction)}
      width={element.width}
      height={element.height}
      rotation={element.rotation}
      fill={element.fill}
      stroke={element.stroke}
      strokeWidth={element.strokeWidth}
      cornerRadius={element.cornerRadius}
    />
  )
}
