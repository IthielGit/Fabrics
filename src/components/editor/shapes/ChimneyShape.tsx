import { Group, Line, Rect } from 'react-konva'
import { useEditorStore } from '../../../stores/editorStore'
import type { ChimneyElement } from '../../../types/document'
import { elementNodeProps } from './elementNodeProps'
import type { ShapeInteraction } from './shapeTypes'

interface ChimneyShapeProps extends ShapeInteraction {
  element: ChimneyElement
}

/** Cheminée (conduit) vue de dessus : carré plein aux diagonales marquées (symbole de conduit). */
export default function ChimneyShape({ element, viewScale, ...interaction }: ChimneyShapeProps) {
  const selected = useEditorStore((state) => state.selectedIds.includes(element.id))
  const { width, depth } = element
  const stroke = selected ? '#4f46e5' : '#44403c'
  const lineWidth = Math.max(20, 1.5 / viewScale)

  return (
    <Group
      {...elementNodeProps(element, interaction)}
      rotation={element.rotation}
    >
      <Rect
        width={width}
        height={depth}
        fill="#d6d3d1"
        stroke={stroke}
        strokeWidth={lineWidth * (selected ? 1.6 : 1)}
      />
      <Line points={[0, 0, width, depth]} stroke={stroke} strokeWidth={lineWidth * 0.7} listening={false} />
      <Line points={[width, 0, 0, depth]} stroke={stroke} strokeWidth={lineWidth * 0.7} listening={false} />
    </Group>
  )
}
