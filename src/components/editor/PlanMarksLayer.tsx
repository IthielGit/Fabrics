import { useMemo } from 'react'
import { Group, Line, Text } from 'react-konva'
import { planMarks } from '../../features/dimensioning/planMarks'
import { EXECUTION_LABELS } from '../../i18n/dimensioningLabels'
import { useEditorStore } from '../../stores/editorStore'

/** Hauteur des textes de la flèche du nord et du repère de niveau (mm sur le plan), comme les cotes. */
const FONT_MM = 180
const LABEL_MIN_PX = 9
const TEXT_BOX_MM = 8000
const INK = '#111827'

/**
 * Flèche du nord et repère de niveau du niveau affiché (M11 bis), quand l'option est cochée dans les
 * réglages du plan. Calculés à chaque modification du plan, jamais enregistrés ; sans clic. Les mêmes
 * traits sont repris dans les exports PDF, PNG et DXF.
 */
export default function PlanMarksLayer({ scale }: { scale: number }) {
  const elements = useEditorStore((state) => state.project?.document.elements)
  const levels = useEditorStore((state) => state.project?.document.levels)
  const plan = useEditorStore((state) => state.project?.document.plan)
  const activeLevelId = useEditorStore((state) => state.activeLevelId)

  const font = Math.max(FONT_MM, LABEL_MIN_PX / scale)
  const marks = useMemo(() => {
    if (!elements || !levels || activeLevelId === null) return null
    return planMarks({ elements, levels, plan }, activeLevelId, EXECUTION_LABELS, font)
  }, [elements, levels, plan, activeLevelId, font])
  if (!marks) return null

  return (
    <Group name="plan-marks" listening={false}>
      {marks.lines.map((line, i) => (
        <Line
          key={i}
          points={[line.x1, line.y1, line.x2, line.y2]}
          stroke={INK}
          strokeWidth={(line.weight === 'hair' ? 1 : 1.6) / scale}
          lineCap="round"
        />
      ))}
      {marks.texts.map((text, i) => (
        <Text
          key={i}
          x={text.anchor === 'middle' ? text.x - TEXT_BOX_MM / 2 : text.x}
          y={text.y - text.size}
          width={TEXT_BOX_MM}
          align={text.anchor === 'middle' ? 'center' : 'left'}
          text={text.text}
          fontSize={text.size}
          fontStyle={text.bold ? 'bold' : 'normal'}
          fill={INK}
        />
      ))}
    </Group>
  )
}
