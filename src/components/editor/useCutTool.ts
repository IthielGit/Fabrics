import type Konva from 'konva'
import { useCallback, useMemo, useState } from 'react'
import { findWallAt, wallSegment } from '../../features/geometry/openings'
import {
  cutWallProblem,
  snapCutOffset,
  type CutWallProblem,
} from '../../features/geometry/splitWall'
import type { Point } from '../../features/geometry/viewport'
import { fr } from '../../i18n/fr'
import { selectActiveElements, useEditorStore } from '../../stores/editorStore'
import type { OpeningElement, WallElement } from '../../types/document'

type PointerEvent = Konva.KonvaEventObject<MouseEvent | TouchEvent>

/** Distance de survol d'un mur, en pixels écran : on n'a pas à viser le trait au pixel près. */
const HOVER_TOLERANCE_PX = 14

/** Où la coupe tomberait au survol d'un mur. */
export interface CutPreview {
  wall: WallElement
  segmentIndex: number
  /** Distance (mm) du début du côté au point de coupe, arrondie. */
  offset: number
  /** Point de coupe sur l'axe du mur. */
  at: Point
  /** Direction du côté (vecteur unitaire) : la marque de coupe lui est perpendiculaire. */
  direction: Point
  problem: CutWallProblem | null
}

const NOTICES: Record<CutWallProblem, string> = {
  'too-close': fr.notices.cutTooClose,
  'on-opening': fr.notices.cutOnOpening,
}

/**
 * Outil « Couper ici » : survol d'un mur = repère de coupe, clic = le mur est coupé en deux à cet
 * endroit. Les murs masqués ou verrouillés sont ignorés. L'outil reste actif pour couper plusieurs murs.
 */
export function useCutTool(active: boolean, scale: number) {
  const elements = useEditorStore(selectActiveElements)
  const cutWall = useEditorStore((state) => state.cutWall)
  const setNotice = useEditorStore((state) => state.setNotice)

  // Quitter ou changer d'outil efface le curseur (réglage d'état pendant le rendu, sans effet).
  const [stored, setStored] = useState<{ active: boolean; cursor: Point | null }>({
    active,
    cursor: null,
  })
  if (stored.active !== active) setStored({ active, cursor: null })
  const cursor = stored.active === active ? stored.cursor : null

  const compute = useCallback(
    (point: Point): CutPreview | null => {
      if (!active || !elements) return null
      const walls = elements.filter(
        (el): el is WallElement => el.type === 'wall' && !el.hidden && !el.locked,
      )
      const hit = findWallAt(point, walls, HOVER_TOLERANCE_PX / scale)
      if (!hit) return null
      const segment = wallSegment(hit.wall, hit.segmentIndex)
      if (!segment) return null
      const offset = snapCutOffset(hit.offset)
      const openings = elements.filter((el): el is OpeningElement => el.type === 'opening')
      return {
        wall: hit.wall,
        segmentIndex: hit.segmentIndex,
        offset,
        at: {
          x: segment.a.x + segment.direction.x * offset,
          y: segment.a.y + segment.direction.y * offset,
        },
        direction: segment.direction,
        problem: cutWallProblem(hit.wall, openings, hit.segmentIndex, offset),
      }
    },
    [active, elements, scale],
  )

  const preview = useMemo(() => (cursor ? compute(cursor) : null), [cursor, compute])

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      if (!active) return
      const point = event.target.getStage()?.getRelativePointerPosition()
      if (point) setStored({ active, cursor: point })
    },
    [active],
  )

  const onPointerDown = useCallback(
    (event: PointerEvent) => {
      if (!active) return
      const point = event.target.getStage()?.getRelativePointerPosition()
      if (!point) return
      const result = compute(point)
      if (!result) {
        setNotice(fr.notices.cutNoWall)
        return
      }
      if (result.problem) {
        setNotice(NOTICES[result.problem])
        return
      }
      const done = cutWall(result.wall.id, result.segmentIndex, result.offset)
      setNotice(done.ok ? null : NOTICES[done.problem])
    },
    [active, compute, cutWall, setNotice],
  )

  return useMemo(
    () => ({ preview, onPointerDown, onPointerMove }),
    [preview, onPointerDown, onPointerMove],
  )
}
