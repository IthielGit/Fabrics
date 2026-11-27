import { Text } from 'react-konva'
import { fontStack } from '../../../features/documents/fonts'
import type { TextElement } from '../../../types/document'
import { elementNodeProps } from './elementNodeProps'
import type { ShapeInteraction } from './shapeTypes'

export const TEXT_LINE_HEIGHT = 1.2

interface TextShapeProps extends ShapeInteraction {
  element: TextElement
  /** Vrai pendant l'édition : la zone de saisie prend la place du texte dessiné. */
  editing: boolean
}

export default function TextShape({ element, editing, onDoubleClick, ...interaction }: TextShapeProps) {
  return (
    <Text
      {...elementNodeProps(element, interaction)}
      width={element.width}
      text={element.text}
      fontFamily={fontStack(element.fontFamily)}
      fontSize={element.fontSize}
      fontStyle={element.fontStyle}
      align={element.align}
      fill={element.fill}
      lineHeight={TEXT_LINE_HEIGHT}
      rotation={element.rotation}
      visible={!element.hidden && !editing}
      onDblClick={onDoubleClick}
      onDblTap={onDoubleClick}
    />
  )
}
