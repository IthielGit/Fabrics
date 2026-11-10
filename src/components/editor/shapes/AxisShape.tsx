import { Circle, Group, Line, Text } from 'react-konva'
import { AXIS_BUBBLE_RADIUS_MM, axisGeometry } from '../../../features/geometry/axes'
import { useEditorStore } from '../../../stores/editorStore'
import type { AxisElement } from '../../../types/document'
import type { ShapeInteraction } from './shapeTypes'

interface AxisShapeProps extends ShapeInteraction {
  element: AxisElement
}

const COLOR = '#be123c'
/** Rayon minimal d'une bulle à l'écran (px), pour rester lisible quand on dézoome. */
const MIN_BUBBLE_RADIUS_PX = 10
/** Zone de clic minimale autour de la ligne, en pixels écran. */
const MIN_HIT_WIDTH_PX = 12

/**
 * Un axe de construction : ligne en trait mixte (tiret, point) qui s'arrête au bord de deux
 * bulles portant le repère (A, B… ou 1, 2…).
 */
export default function AxisShape({
  element,
  interactive,
  viewScale,
  onPointerDown,
  onDragStart,
  onDragMove,
  onDragEnd,
}: AxisShapeProps) {
  const selected = useEditorStore((state) => state.selectedIds.includes(element.id))
  const radius = Math.max(AXIS_BUBBLE_RADIUS_MM, MIN_BUBBLE_RADIUS_PX / viewScale)
  const geometry = axisGeometry(element.points, radius)
  if (!geometry) return null

  const { line, bubbles } = geometry
  const thin = 1.2 / viewScale
  // Plus l'étiquette est longue, plus on réduit le texte pour qu'il tienne dans la bulle.
  const fontSize = Math.min(radius * 1.05, (radius * 1.7) / Math.max(element.label.length, 1))
  const dash = [500, 120, 60, 120]

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
        strokeWidth={thin}
        dash={dash}
        hitStrokeWidth={MIN_HIT_WIDTH_PX / viewScale}
      />
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
