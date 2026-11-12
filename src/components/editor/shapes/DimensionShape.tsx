import { Group, Line } from 'react-konva'
import { manualDimensionVisible } from '../../../features/dimensioning/visibility'
import { dimensionGeometry } from '../../../features/geometry/dimension'
import { useEditorStore } from '../../../stores/editorStore'
import type { DimensionElement } from '../../../types/document'
import DimensionDrawing from './DimensionDrawing'
import type { ShapeInteraction } from './shapeTypes'

interface DimensionShapeProps extends ShapeInteraction {
  element: DimensionElement
}

/** Zone de clic minimale autour de la ligne de cote, en pixels écran. */
const MIN_HIT_WIDTH_PX = 12

/** Une cote tracée à la main : son dessin (`DimensionDrawing`), sélectionnable et déplaçable. */
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
  // Une cote réservée à l'autre version de la cotation est masquée (M10 ter lot B).
  const shown = useEditorStore((state) => manualDimensionVisible(element, state.dimensioningMode))
  const geometry = dimensionGeometry(element.points, element.offset)
  if (!geometry) return null
  const { line } = geometry

  return (
    <Group
      id={element.id}
      name="element"
      x={element.x}
      y={element.y}
      opacity={element.opacity}
      visible={!element.hidden && shown}
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
      <DimensionDrawing
        points={element.points}
        offset={element.offset}
        viewScale={viewScale}
        hitWidthPx={MIN_HIT_WIDTH_PX}
      />
    </Group>
  )
}
