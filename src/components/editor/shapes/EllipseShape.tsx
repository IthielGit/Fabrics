import { Ellipse } from 'react-konva'
import type { EllipseElement } from '../../../types/document'
import { elementNodeProps } from './elementNodeProps'
import type { ShapeInteraction } from './shapeTypes'

interface EllipseShapeProps extends ShapeInteraction {
  element: EllipseElement
}

export default function EllipseShape({ element, ...interaction }: EllipseShapeProps) {
  return (
    <Ellipse
      {...elementNodeProps(element, interaction)}
      radiusX={element.radiusX}
      radiusY={element.radiusY}
      rotation={element.rotation}
      fill={element.fill}
      stroke={element.stroke}
      strokeWidth={element.strokeWidth}
    />
  )
}
