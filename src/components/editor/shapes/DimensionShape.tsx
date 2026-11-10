import { Group, Line, Text } from 'react-konva'
import { dimensionGeometry } from '../../../features/geometry/dimension'
import { formatLength } from '../../../features/units/format'
import { useEditorStore } from '../../../stores/editorStore'
import type { DimensionElement } from '../../../types/document'
import type { ShapeInteraction } from './shapeTypes'

interface DimensionShapeProps extends ShapeInteraction {
  element: DimensionElement
}

const COLOR = '#334155'
/** Longueur d'un trait oblique aux extrémités de la ligne de cote (mm). */
const TICK_MM = 100
const TEXT_FONT_MM = 250
const TEXT_MIN_PX = 10
const TEXT_BOX_WIDTH_MM = 4000
/** Zone de clic minimale autour de la ligne de cote, en pixels écran. */
const MIN_HIT_WIDTH_PX = 12

/** Une cote : ligne décalée, lignes d'attache, traits obliques et longueur en mètres. */
export default function DimensionShape({
  element,
  interactive,
  viewScale,
  onPointerDown,
  onDragStart,
  onDragMove,
  onDragEnd,
}: DimensionShapeProps) {
  const selected = useEditorStore((state) => state.selectedIds.includes(element.id))
  const geometry = dimensionGeometry(element.points, element.offset)
  if (!geometry) return null

  const { line, extensions, center, textAngle, direction, normal, length } = geometry
  const thin = 1.5 / viewScale
  const fontSize = Math.max(TEXT_FONT_MM, TEXT_MIN_PX / viewScale)

  // Trait oblique à 45° à chaque extrémité de la ligne de cote.
  const tickVector = {
    x: ((direction.x + normal.x) / Math.SQRT2) * TICK_MM,
    y: ((direction.y + normal.y) / Math.SQRT2) * TICK_MM,
  }
  const ticks = line.map((p) => [
    p.x - tickVector.x,
    p.y - tickVector.y,
    p.x + tickVector.x,
    p.y + tickVector.y,
  ])

  const flat = (a: { x: number; y: number }, b: { x: number; y: number }) => [a.x, a.y, b.x, b.y]

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
          points={flat(line[0], line[1])}
          stroke="#6366f1"
          strokeWidth={8 / viewScale}
          opacity={0.35}
          listening={false}
        />
      )}
      <Line
        points={flat(line[0], line[1])}
        stroke={COLOR}
        strokeWidth={thin}
        hitStrokeWidth={MIN_HIT_WIDTH_PX / viewScale}
      />
      {extensions.map(([from, to], i) => (
        <Line key={`ext-${i}`} points={flat(from, to)} stroke={COLOR} strokeWidth={thin / 1.5} />
      ))}
      {ticks.map((points, i) => (
        <Line key={`tick-${i}`} points={points} stroke={COLOR} strokeWidth={thin * 1.4} />
      ))}
      <Group x={center.x} y={center.y} rotation={textAngle} listening={false}>
        <Text
          x={-TEXT_BOX_WIDTH_MM / 2}
          y={-fontSize * 1.3}
          width={TEXT_BOX_WIDTH_MM}
          align="center"
          text={formatLength(length)}
          fontSize={fontSize}
          fill={COLOR}
        />
      </Group>
    </Group>
  )
}
