import { Text } from 'react-konva'
import { fontStack } from '../../../features/documents/fonts'
import type { TextElement } from '../../../types/document'
import type { ShapeInteraction } from './shapeTypes'

export const TEXT_LINE_HEIGHT = 1.2

interface TextShapeProps extends ShapeInteraction {
  element: TextElement
  /** Vrai pendant l'édition : la zone de saisie prend la place du texte dessiné. */
  editing: boolean
}

export default function TextShape({
  element,
  editing,
  interactive,
  onPointerDown,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDoubleClick,
}: TextShapeProps) {
  return (
    <Text
      id={element.id}
      name="element"
      x={element.x}
      y={element.y}
      width={element.width}
      text={element.text}
      fontFamily={fontStack(element.fontFamily)}
      fontSize={element.fontSize}
      fontStyle={element.fontStyle}
      align={element.align}
      fill={element.fill}
      lineHeight={TEXT_LINE_HEIGHT}
      rotation={element.rotation}
      opacity={element.opacity}
      visible={!element.hidden && !editing}
      listening={interactive && !element.locked}
      draggable={interactive && !element.locked}
      onMouseDown={onPointerDown}
      onTouchStart={onPointerDown}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onDblClick={onDoubleClick}
      onDblTap={onDoubleClick}
    />
  )
}
