import { useMemo } from 'react'
import { Group, Text } from 'react-konva'
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
        />
      ))}
      {annotations.labels.map((label) => {
        const height = fontSize * 1.25 * label.lines.length
        return (
          <Text
            key={label.id}
            x={label.x - LABEL_BOX_WIDTH_MM / 2}
            y={label.y - height / 2}
            width={LABEL_BOX_WIDTH_MM}
            align="center"
            text={label.lines.join('\n')}
            fontSize={fontSize}
            lineHeight={1.25}
            fill={LABEL_COLOR}
          />
        )
      })}
    </Group>
  )
}
