import { Arrow, Group, Line } from 'react-konva'
import {
  SECTION_ARROW_MM,
  SECTION_BUBBLE_RADIUS_MM,
  sectionGeometry,
} from '../../../features/geometry/sections'
import { useEditorStore } from '../../../stores/editorStore'
import type { SectionLineElement } from '../../../types/document'
import { elementNodeProps } from './elementNodeProps'
import type { ShapeInteraction } from './shapeTypes'
import LabelBubble from './LabelBubble'
import SelectionHalo from './SelectionHalo'

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
export default function SectionShape({ element, viewScale, ...interaction }: SectionShapeProps) {
  const selected = useEditorStore((state) => state.selectedIds.includes(element.id))
  const radius = Math.max(SECTION_BUBBLE_RADIUS_MM, MIN_BUBBLE_RADIUS_PX / viewScale)
  const arrow = Math.max(SECTION_ARROW_MM, (MIN_BUBBLE_RADIUS_PX * 2.4) / viewScale)
  const geometry = sectionGeometry(element.points, element.lookLeft, arrow, radius)
  if (!geometry) return null

  const { line, arrows, bubbles } = geometry
  const thin = 1.2 / viewScale
  const dash = [600, 150, 80, 150]

  return (
    <Group {...elementNodeProps(element, interaction)}>
      {selected && <SelectionHalo line={line} viewScale={viewScale} />}
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
