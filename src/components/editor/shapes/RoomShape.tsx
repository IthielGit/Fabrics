import { Group, Line, Text } from 'react-konva'
import { polygonArea, polygonCentroid } from '../../../features/geometry/polygon'
import { overlappingRoomIdsCached } from '../../../features/geometry/roomOverlap'
import { formatArea } from '../../../features/units/format'
import { useEditorStore } from '../../../stores/editorStore'
import type { RoomElement } from '../../../types/document'
import type { ShapeInteraction } from './shapeTypes'

interface RoomShapeProps extends ShapeInteraction {
  element: RoomElement
}

/** Taille de police de l'étiquette : 25 cm sur le plan, jamais sous 10 px à l'écran. */
const LABEL_FONT_MM = 250
const LABEL_MIN_PX = 10
const LABEL_BOX_WIDTH_MM = 6000

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
  // Pièce qui en recouvre une autre du même niveau : contour rouge (surface comptée en double).
  const overlapping = useEditorStore((state) =>
    state.project ? overlappingRoomIdsCached(state.project.document.elements).has(element.id) : false,
  )
  const centroid = polygonCentroid(element.points)

  const fontSize = Math.max(LABEL_FONT_MM, LABEL_MIN_PX / viewScale)
  const labelHeight = fontSize * 1.3 * 2 // deux lignes : nom, puis surface
  const showLabel = element.showLabel && centroid !== null && element.points.length >= 6

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
      {showLabel && centroid && (
        <Text
          x={centroid.x - LABEL_BOX_WIDTH_MM / 2}
          y={centroid.y - labelHeight / 2}
          width={LABEL_BOX_WIDTH_MM}
          height={labelHeight}
          align="center"
          verticalAlign="middle"
          text={`${element.name}\n${formatArea(polygonArea(element.points))}`}
          fontSize={fontSize}
          lineHeight={1.3}
          fontStyle="bold"
          fill="#312e81"
          listening={false}
        />
      )}
    </Group>
  )
}
