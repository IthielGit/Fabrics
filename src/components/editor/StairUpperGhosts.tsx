import { Group, Line } from 'react-konva'
import { levelAboveOf, stairFootprint } from '../../features/stairs/stairs'
import { useEditorStore } from '../../stores/editorStore'

/**
 * Sur un niveau, contour en fantôme des escaliers qui arrivent depuis le niveau du dessous (pour
 * savoir où ils débouchent). Sans interaction ; l'escalier lui-même reste sur son niveau.
 */
export default function StairUpperGhosts({ scale }: { scale: number }) {
  const elements = useEditorStore((state) => state.project?.document.elements)
  const levels = useEditorStore((state) => state.project?.document.levels)
  const activeLevelId = useEditorStore((state) => state.activeLevelId)
  if (!elements || !levels || activeLevelId === null) return null

  const arriving = elements.filter(
    (el) =>
      el.type === 'stair' && !el.hidden && levelAboveOf(levels, el.levelId ?? levels[0]?.id)?.id === activeLevelId,
  )
  if (arriving.length === 0) return null

  return (
    <Group name="stair-ghost" listening={false}>
      {arriving.map((stair) =>
        stair.type === 'stair' ? (
          <Line
            key={stair.id}
            points={stairFootprint(stair).flatMap((p) => [p.x, p.y])}
            closed
            fill="rgba(100, 116, 139, 0.08)"
            stroke="#64748b"
            strokeWidth={1.5 / scale}
            dash={[8 / scale, 5 / scale]}
          />
        ) : null,
      )}
    </Group>
  )
}
