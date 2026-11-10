import { Rect } from 'react-konva'
import type { RectElement } from '../../../types/document'
import type { ShapeInteraction } from './shapeTypes'

interface RectShapeProps extends ShapeInteraction {
  element: RectElement
}

export default function RectShape({
  element,
  interactive,
  onPointerDown,
  onDragStart,
  onDragMove,
  onDragEnd,
}: RectShapeProps) {
  return (
    <Rect
      id={element.id}
      name="element"
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      rotation={element.rotation}
      opacity={element.opacity}
      fill={element.fill}
      stroke={element.stroke}
      strokeWidth={element.strokeWidth}
      cornerRadius={element.cornerRadius}
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
