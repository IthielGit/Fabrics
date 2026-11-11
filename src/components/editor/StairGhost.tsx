import { Group } from 'react-konva'
import type { Point } from '../../features/geometry/viewport'
import { planStairPlacement } from '../../features/stairs/placement'
import { useEditorStore } from '../../stores/editorStore'
import StairShape from './shapes/StairShape'

interface StairGhostProps {
  /** Position du curseur sur le plan (mm). */
  point: Point
  /** Pas de la grille d'aimantation (mm), ou `null`. */
  grid: number | null
  /** Pixels écran par mm. */
  scale: number
}

/** Aperçu translucide de l'escalier qu'on va poser sous le curseur (rien sur le dernier niveau). */
export default function StairGhost({ point, grid, scale }: StairGhostProps) {
  const levels = useEditorStore((state) => state.project?.document.levels)
  const activeLevelId = useEditorStore((state) => state.activeLevelId)
  const shape = useEditorStore((state) => state.stairShape)
  const stair = planStairPlacement(levels, activeLevelId, shape, point, grid, '')
  if (!stair) return null
  // Le groupe « ghost » est masqué pendant les exports et la capture des miniatures.
  return (
    <Group name="ghost" listening={false}>
      <StairShape
        element={{ ...stair, id: 'stair-ghost', levelId: activeLevelId ?? undefined, opacity: 0.55 }}
        interactive={false}
        viewScale={scale}
      />
    </Group>
  )
}
