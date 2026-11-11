import { Group } from 'react-konva'
import type { PlacementSnap } from '../../features/geometry/snapLines'
import type { Point } from '../../features/geometry/viewport'
import { planStairPlacement } from '../../features/stairs/placement'
import { useEditorStore } from '../../stores/editorStore'
import StairShape from './shapes/StairShape'

interface StairGhostProps {
  /** Position du curseur sur le plan (mm). */
  point: Point
  /** Aimantation (murs et éléments voisins, grille). */
  snap: PlacementSnap
  /** Pixels écran par mm. */
  scale: number
}

/** Aperçu translucide de l'escalier qu'on va poser sous le curseur (rien sur le dernier niveau). */
export default function StairGhost({ point, snap, scale }: StairGhostProps) {
  const levels = useEditorStore((state) => state.project?.document.levels)
  const activeLevelId = useEditorStore((state) => state.activeLevelId)
  const shape = useEditorStore((state) => state.stairShape)
  const stair = planStairPlacement(levels, activeLevelId, shape, point, snap, '')
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
