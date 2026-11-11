import { Group, Line } from 'react-konva'
import { chimneyFootprint, chimneyRisesThrough } from '../../features/building/chimney'
import { flattenPoints } from '../../features/geometry/polygon'
import { useEditorStore } from '../../stores/editorStore'

/**
 * Sur chaque niveau au-dessus de celui d'une cheminée, son contour en fantôme (pointillé et croix
 * légère) : le conduit traverse tous les niveaux jusqu'au toit. Sans interaction.
 */
export default function ChimneyUpperGhosts({ scale }: { scale: number }) {
  const elements = useEditorStore((state) => state.project?.document.elements)
  const levels = useEditorStore((state) => state.project?.document.levels)
  const activeLevelId = useEditorStore((state) => state.activeLevelId)
  if (!elements || !levels || activeLevelId === null) return null

  const passing = elements.flatMap((el) =>
    el.type === 'chimney' && !el.hidden && chimneyRisesThrough(el, levels, activeLevelId) ? [el] : [],
  )
  if (passing.length === 0) return null

  return (
    <Group name="chimney-ghost" listening={false}>
      {passing.map((chimney) => {
        const [a, b, c, d] = chimneyFootprint(chimney)
        return (
          <Group key={chimney.id} listening={false}>
            <Line
              points={flattenPoints([a, b, c, d])}
              closed
              fill="rgba(120, 113, 108, 0.1)"
              stroke="#78716c"
              strokeWidth={1.5 / scale}
              dash={[8 / scale, 5 / scale]}
            />
            <Line points={[a.x, a.y, c.x, c.y]} stroke="#a8a29e" strokeWidth={1 / scale} />
            <Line points={[b.x, b.y, d.x, d.y]} stroke="#a8a29e" strokeWidth={1 / scale} />
          </Group>
        )
      })}
    </Group>
  )
}
