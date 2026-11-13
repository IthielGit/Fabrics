import { Group, Line } from 'react-konva'
import { overlappingRoomIdsCached } from '../../../features/geometry/roomOverlap'
import { useEditorStore } from '../../../stores/editorStore'
import type { RoomElement } from '../../../types/document'
import type { ShapeInteraction } from './shapeTypes'

interface RoomShapeProps extends ShapeInteraction {
  element: RoomElement
}

export default function RoomShape({
  element,
  interactive,
  viewScale,
  onPointerDown,
  onDragStart,
  onDragMove,
  onDragEnd,
}: RoomShapeProps) {
  const selected = useEditorStore((state) => state.selectedIds.includes(element.id))
  // L'étiquette (nom, surface) est dessinée au-dessus de tout par `RoomLabelsLayer`.
  // Pièce qui en recouvre une autre du même niveau : contour rouge (surface comptée en double).
  const overlapping = useEditorStore((state) =>
    state.project ? overlappingRoomIdsCached(state.project.document.elements).has(element.id) : false,
  )

  return (
    // Un groupe : l'étiquette suit la pièce quand on la déplace.
    <Group
      id={element.id}
      name="element"
      x={element.x}
      y={element.y}
      opacity={element.opacity}
      visible={!element.hidden}
      listening={interactive && !element.locked}
      draggable={interactive && !element.locked}
      onMouseDown={onPointerDown}
      onTouchStart={onPointerDown}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
    >
      <Line
        points={element.points}
        closed
        fill={overlapping ? 'rgba(220, 38, 38, 0.2)' : element.fill}
        stroke={overlapping ? '#dc2626' : selected ? '#4f46e5' : '#6366f1'}
        strokeWidth={(selected || overlapping ? 3 : 1.5) / viewScale}
        lineJoin="round"
      />
    </Group>
  )
}
