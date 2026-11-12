import { useMemo } from 'react'
import { Group, Rect, Text } from 'react-konva'
import { LINE_HEIGHT_EM, dimensionObstacles, labelBox, placeLabels } from '../../features/dimensioning/layout'
import { levelAnnotations } from '../../features/dimensioning/levelAnnotations'
import { CLIENT_TEXT_FACTOR } from '../../features/dimensioning/planOverlay'
import { EXECUTION_LABELS } from '../../i18n/dimensioningLabels'
import { useEditorStore } from '../../stores/editorStore'
import DimensionDrawing from './shapes/DimensionDrawing'

/** Hauteur des textes (mm sur le plan) : plus grande en Client, document destiné au client. */
const FONT_MM = { client: 180 * CLIENT_TEXT_FACTOR, execution: 180 } as const
const LABEL_MIN_PX = 9
const LABEL_BOX_WIDTH_MM = 6000
const LABEL_COLOR = '#111827'

/**
 * Cotes automatiques du niveau affiché (M10 ter lot B), selon le réglage « Cotation ». Calculées à
 * chaque modification du plan, jamais enregistrées : elles suivent toujours le plan. Sans clic.
 * Les chiffres et les étiquettes ont un fond blanc et s'écartent les uns des autres pour rester lisibles.
 */
export default function AutoDimensionsLayer({ scale }: { scale: number }) {
  const mode = useEditorStore((state) => state.dimensioningMode)
  const elements = useEditorStore((state) => state.project?.document.elements)
  const levels = useEditorStore((state) => state.project?.document.levels)
  const activeLevelId = useEditorStore((state) => state.activeLevelId)

  const annotations = useMemo(() => {
    if (mode === 'none' || !elements || !levels || activeLevelId === null) return null
    return levelAnnotations({ elements, levels }, activeLevelId, mode, EXECUTION_LABELS)
  }, [mode, elements, levels, activeLevelId])
  if (!annotations || mode === 'none') return null

  const fontMm = FONT_MM[mode]
  const fontSize = Math.max(fontMm, LABEL_MIN_PX / scale)
  return (
    <Group name="auto-dimensions" listening={false}>
      {annotations.dimensions.map((dimension) => (
        <DimensionDrawing
          key={dimension.id}
          points={dimension.points}
          offset={dimension.offset}
          viewScale={scale}
          fontMm={fontMm}
          withUnit={false}
          chainIndex={dimension.chainIndex ?? 0}
          textBackground
        />
      ))}
      {placeLabels(annotations.labels, fontSize, dimensionObstacles(annotations.dimensions, fontSize)).map((label) => {
        const height = fontSize * LINE_HEIGHT_EM * label.lines.length
        const box = labelBox(label.lines, label.x, label.y, fontSize)
        return (
          <Group key={label.id}>
            <Rect
              x={box.minX}
              y={box.minY}
              width={box.maxX - box.minX}
              height={box.maxY - box.minY}
              fill="#ffffff"
              opacity={0.85}
              cornerRadius={fontSize * 0.2}
            />
            <Text
              x={label.x - LABEL_BOX_WIDTH_MM / 2}
              y={label.y - height / 2}
              width={LABEL_BOX_WIDTH_MM}
              align="center"
              text={label.lines.join('\n')}
              fontSize={fontSize}
              lineHeight={LINE_HEIGHT_EM}
              fill={LABEL_COLOR}
            />
          </Group>
        )
      })}
    </Group>
  )
}
