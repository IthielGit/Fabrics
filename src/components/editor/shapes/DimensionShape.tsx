import { Group } from 'react-konva'
import { manualDimensionVisible } from '../../../features/dimensioning/visibility'
import { dimensionGeometry } from '../../../features/geometry/dimension'
import { useEditorStore } from '../../../stores/editorStore'
import type { DimensionElement } from '../../../types/document'
import DimensionDrawing from './DimensionDrawing'
import { elementNodeProps } from './elementNodeProps'
import type { ShapeInteraction } from './shapeTypes'
import SelectionHalo from './SelectionHalo'

interface DimensionShapeProps extends ShapeInteraction {
  element: DimensionElement
}

/** Zone de clic minimale autour de la ligne de cote, en pixels écran. */
const MIN_HIT_WIDTH_PX = 12

/** Une cote tracée à la main : son dessin (`DimensionDrawing`), sélectionnable et déplaçable. */
export default function DimensionShape({ element, viewScale, ...interaction }: DimensionShapeProps) {
  const selected = useEditorStore((state) => state.selectedIds.includes(element.id))
  // Une cote réservée à l'autre version de la cotation est masquée (M10 ter lot B).
  const shown = useEditorStore((state) => manualDimensionVisible(element, state.dimensioningMode))
  const geometry = dimensionGeometry(element.points, element.offset)
  if (!geometry) return null
  const { line } = geometry

  return (
    <Group
      {...elementNodeProps(element, interaction)}
      visible={!element.hidden && shown}
    >
      {selected && <SelectionHalo line={line} viewScale={viewScale} />}
      <DimensionDrawing
        points={element.points}
        offset={element.offset}
        viewScale={viewScale}
        hitWidthPx={MIN_HIT_WIDTH_PX}
      />
    </Group>
  )
}
