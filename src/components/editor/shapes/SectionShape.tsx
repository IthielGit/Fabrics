import { Arrow, Circle, Group, Line, Text } from 'react-konva'
import {
  SECTION_ARROW_MM,
  SECTION_BUBBLE_RADIUS_MM,
  sectionGeometry,
} from '../../../features/geometry/sections'
import { useEditorStore } from '../../../stores/editorStore'
import type { SectionLineElement } from '../../../types/document'
import type { ShapeInteraction } from './shapeTypes'

interface SectionShapeProps extends ShapeInteraction {
  element: SectionLineElement
}

const COLOR = '#0f172a'
/** Rayon minimal d'une bulle à l'écran (px), pour rester lisible quand on dézoome. */
const MIN_BUBBLE_RADIUS_PX = 10
/** Zone de clic minimale autour de la ligne, en pixels écran. */
const MIN_HIT_WIDTH_PX = 12

/**
 * Une ligne de coupe : trait mixte épais, une flèche à chaque bout vers le sens de vue, et une
 * bulle portant le repère (A, B…) au bout de chaque flèche.
 */
export default function SectionShape({
  element,
  interactive,
  viewScale,
  onPointerDown,
  onDragStart,
  onDragMove,
  onDragEnd,
}: SectionShapeProps) {
  const selected = useEditorStore((state) => state.selectedIds.includes(element.id))
  const radius = Math.max(SECTION_BUBBLE_RADIUS_MM, MIN_BUBBLE_RADIUS_PX / viewScale)
  const arrow = Math.max(SECTION_ARROW_MM, (MIN_BUBBLE_RADIUS_PX * 2.4) / viewScale)
  const geometry = sectionGeometry(element.points, element.lookLeft, arrow, radius)
  if (!geometry) return null

  const { line, arrows, bubbles } = geometry
  const thin = 1.2 / viewScale
  const fontSize = Math.min(radius * 1.05, (radius * 1.7) / Math.max(element.label.length, 1))
  const dash = [600, 150, 80, 150]

  return (
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
      {selected && (
        <Line
          points={[line[0].x, line[0].y, line[1].x, line[1].y]}
          stroke="#6366f1"
          strokeWidth={8 / viewScale}
          opacity={0.35}
          listening={false}
        />
      )}
      <Line
        points={[line[0].x, line[0].y, line[1].x, line[1].y]}
        stroke={COLOR}
        strokeWidth={thin * 1.6}
        dash={dash}
        hitStrokeWidth={MIN_HIT_WIDTH_PX / viewScale}
      />
      {arrows.map(([from, to], i) => (
        <Arrow
          key={i}
          points={[from.x, from.y, to.x, to.y]}
          stroke={COLOR}
          fill={COLOR}
          strokeWidth={thin * 1.6}
          pointerLength={radius * 0.9}
          pointerWidth={radius * 0.7}
          listening={false}
        />
      ))}
      {bubbles.map((center, i) => (
        <Group key={i} x={center.x} y={center.y}>
          <Circle
            radius={radius}
            fill="#ffffff"
            stroke={selected ? '#4f46e5' : COLOR}
            strokeWidth={selected ? thin * 2 : thin * 1.4}
          />
          <Text
            x={-radius}
            y={-radius}
            width={radius * 2}
            height={radius * 2}
            align="center"
            verticalAlign="middle"
            text={element.label}
            fontSize={fontSize}
            fontStyle="bold"
            fill={COLOR}
            listening={false}
          />
        </Group>
      ))}
    </Group>
  )
}
