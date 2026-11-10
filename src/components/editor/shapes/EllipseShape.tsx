import { Ellipse } from 'react-konva'
import type { EllipseElement } from '../../../types/document'
import type { ShapeInteraction } from './shapeTypes'

interface EllipseShapeProps extends ShapeInteraction {
  element: EllipseElement
}

export default function EllipseShape({
  element,
  interactive,
  onPointerDown,
  onDragStart,
  onDragMove,
  onDragEnd,
}: EllipseShapeProps) {
  return (
    <Ellipse
      id={element.id}
      name="element"
      x={element.x}
      y={element.y}
      radiusX={element.radiusX}
      radiusY={element.radiusY}
      rotation={element.rotation}
      opacity={element.opacity}
      fill={element.fill}
      stroke={element.stroke}
      strokeWidth={element.strokeWidth}
      visible={!element.hidden}
      listening={interactive && !element.locked}
      draggable={interactive && !element.locked}
      onMouseDown={onPointerDown}
      onTouchStart={onPointerDown}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
    />
  )
}
