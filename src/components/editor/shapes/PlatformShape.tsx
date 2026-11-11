import { Group, Line, Text } from 'react-konva'
import { polygonCentroid } from '../../../features/geometry/polygon'
import { fr } from '../../../i18n/fr'
import { useEditorStore } from '../../../stores/editorStore'
import type { PlatformElement } from '../../../types/document'
import type { ShapeInteraction } from './shapeTypes'

interface PlatformShapeProps extends ShapeInteraction {
  element: PlatformElement
}

/** Taille de police de l'étiquette : 25 cm sur le plan, jamais sous 10 px à l'écran. */
const LABEL_FONT_MM = 250
const LABEL_MIN_PX = 10
const LABEL_BOX_WIDTH_MM = 4000

/** Plateforme (estrade) vue de dessus : aplat, contour renforcé et hauteur du dessus (`+450 mm`). */
export default function PlatformShape({
  element,
  interactive,
  viewScale,
  onPointerDown,
  onDragStart,
  onDragMove,
  onDragEnd,
}: PlatformShapeProps) {
  const selected = useEditorStore((state) => state.selectedIds.includes(element.id))
  const centroid = polygonCentroid(element.points)
  const fontSize = Math.max(LABEL_FONT_MM, LABEL_MIN_PX / viewScale)
  const showLabel = centroid !== null && element.points.length >= 6

  return (
    // Un groupe : l'étiquette suit la plateforme quand on la déplace.
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
        fill={element.fill}
        stroke={selected ? '#4f46e5' : '#78350f'}
        strokeWidth={(selected ? 3 : 2) / viewScale}
        lineJoin="round"
      />
      {showLabel && centroid && (
        <Text
          x={centroid.x - LABEL_BOX_WIDTH_MM / 2}
          y={centroid.y - fontSize / 2}
          width={LABEL_BOX_WIDTH_MM}
          height={fontSize}
          align="center"
          verticalAlign="middle"
          text={fr.platform.label(element.elevation)}
          fontSize={fontSize}
          fontStyle="bold"
          fill="#451a03"
          listening={false}
        />
      )}
    </Group>
  )
}
