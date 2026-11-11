import { useMemo } from 'react'
import { Group, Line } from 'react-konva'
import { flattenPoints } from '../../features/geometry/polygon'
import { stairFootprint } from '../../features/stairs/stairs'
import { collectStairVoids, overflowingStairIds } from '../../features/stairs/voids'
import { useEditorStore } from '../../stores/editorStore'

const NORMAL = '#475569'
const WARNING = '#dc2626'

/**
 * Sur un niveau, ce qui arrive des escaliers du niveau du dessous : le contour de l'escalier en
 * fantôme, et la **trémie** (contour pointillé avec une croix sur chacun de ses rectangles ; en
 * rouge si elle déborde de la pièce). Sans interaction : l'escalier lui-même reste sur son niveau.
 */
export default function StairUpperGhosts({ scale }: { scale: number }) {
  const elements = useEditorStore((state) => state.project?.document.elements)
  const levels = useEditorStore((state) => state.project?.document.levels)
  const activeLevelId = useEditorStore((state) => state.activeLevelId)

  const arriving = useMemo(() => {
    if (!elements || !levels || activeLevelId === null) return []
    const voids = collectStairVoids(elements, levels).filter((v) => v.levelId === activeLevelId)
    if (voids.length === 0) return []
    const overflowing = overflowingStairIds(elements, levels)
    return voids.flatMap((hole) => {
      const stair = elements.find((el) => el.id === hole.stairId)
      return stair && stair.type === 'stair' ? [{ stair, hole, overflow: overflowing.has(stair.id) }] : []
    })
  }, [elements, levels, activeLevelId])

  if (arriving.length === 0) return null

  return (
    <Group name="stair-ghost" listening={false}>
      {arriving.map(({ stair, hole, overflow }) => {
        const color = overflow ? WARNING : NORMAL
        return (
          <Group key={stair.id} listening={false}>
            <Line
              points={flattenPoints(stairFootprint(stair))}
              closed
              fill="rgba(100, 116, 139, 0.08)"
              stroke="#64748b"
              strokeWidth={1.5 / scale}
              dash={[8 / scale, 5 / scale]}
            />
            <Line
              points={flattenPoints(hole.polygon)}
              closed
              stroke={color}
              strokeWidth={2 / scale}
              dash={[4 / scale, 4 / scale]}
            />
            {hole.rects.flatMap((rect, i) => [
              <Line
                key={`${i}-a`}
                points={[rect[0].x, rect[0].y, rect[2].x, rect[2].y]}
                stroke={color}
                strokeWidth={1.5 / scale}
              />,
              <Line
                key={`${i}-b`}
                points={[rect[1].x, rect[1].y, rect[3].x, rect[3].y]}
                stroke={color}
                strokeWidth={1.5 / scale}
              />,
            ])}
          </Group>
        )
      })}
    </Group>
  )
}
