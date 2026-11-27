import { Group, Line } from 'react-konva'
import { AXIS_BUBBLE_RADIUS_MM, axisGeometry } from '../../../features/geometry/axes'
import { useEditorStore } from '../../../stores/editorStore'
import type { AxisElement } from '../../../types/document'
import { elementNodeProps } from './elementNodeProps'
import type { ShapeInteraction } from './shapeTypes'
import LabelBubble from './LabelBubble'
import SelectionHalo from './SelectionHalo'

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
export default function AxisShape({ element, viewScale, ...interaction }: AxisShapeProps) {
  const selected = useEditorStore((state) => state.selectedIds.includes(element.id))
  const radius = Math.max(AXIS_BUBBLE_RADIUS_MM, MIN_BUBBLE_RADIUS_PX / viewScale)
  const geometry = axisGeometry(element.points, radius)
  if (!geometry) return null

  const { line, bubbles } = geometry
  const thin = 1.2 / viewScale
  const dash = [500, 120, 60, 120]

  return (
    <Group {...elementNodeProps(element, interaction)}>
      {selected && <SelectionHalo line={line} viewScale={viewScale} />}
      <Line
        points={[line[0].x, line[0].y, line[1].x, line[1].y]}
        stroke={COLOR}
        strokeWidth={thin}
        dash={dash}
        hitStrokeWidth={MIN_HIT_WIDTH_PX / viewScale}
      />
      {bubbles.map((center, i) => (
        <LabelBubble
          key={i}
          center={center}
          radius={radius}
          label={element.label}
          color={COLOR}
          selected={selected}
          thin={thin}
        />
      ))}
    </Group>
  )
}
