import type Konva from 'konva'
import { useCallback, useMemo, useState } from 'react'
import { createOpeningElement, OPENING_DEFAULTS } from '../../features/documents/elements'
import { planOpeningPlacement, type PlacementProblem } from '../../features/geometry/openingPlacement'
import { openingClearances, wallSegment } from '../../features/geometry/openings'
import type { Point } from '../../features/geometry/viewport'
import { fr } from '../../i18n/fr'
import { selectActiveElements, useEditorStore } from '../../stores/editorStore'
import type { OpeningElement, WallElement } from '../../types/document'

type PointerEvent = Konva.KonvaEventObject<MouseEvent | TouchEvent>

export type OpeningToolKind = 'door' | 'window'

/** Distance de survol d'un mur, en pixels écran : on n'a pas à viser le trait au pixel près. */
const HOVER_TOLERANCE_PX = 14

/** Aperçu d'une ouverture au survol d'un mur. */
export interface OpeningPreview {
  /** Ouverture telle qu'elle serait posée (identifiant provisoire). */
  opening: OpeningElement
  wall: WallElement
  problem: PlacementProblem | null
  /** Cotes jusqu'aux extrémités du segment, avec l'endroit où les écrire (absentes si 0). */
  clearances: { length: number; at: Point }[]
}

const NOTICES: Record<PlacementProblem, string> = {
  'no-room': fr.notices.openingNoRoom,
  'too-tall': fr.notices.openingTooTall,
}

/**
 * Outils Porte et Fenêtre : survol d'un mur = aperçu avec les distances libres, clic = pose.
 * Les murs masqués ou verrouillés sont ignorés. L'outil reste actif pour poser plusieurs ouvertures.
 */
export function useOpeningTool(kind: OpeningToolKind | null, scale: number) {
  const elements = useEditorStore(selectActiveElements)
  const addElement = useEditorStore((state) => state.addElement)
  const setNotice = useEditorStore((state) => state.setNotice)

  // Quitter ou changer d'outil efface le curseur (réglage d'état pendant le rendu, sans effet).
  const [stored, setStored] = useState<{ kind: OpeningToolKind | null; cursor: Point | null }>({
    kind,
    cursor: null,
  })
  if (stored.kind !== kind) setStored({ kind, cursor: null })
  const cursor = stored.kind === kind ? stored.cursor : null

  const compute = useCallback(
    (point: Point) => {
      if (!kind || !elements) return null
      const walls = elements.filter(
        (el): el is WallElement => el.type === 'wall' && !el.hidden && !el.locked,
      )
      const openings = elements.filter((el): el is OpeningElement => el.type === 'opening')
      const placement = planOpeningPlacement(
        point,
        walls,
        openings,
        OPENING_DEFAULTS[kind],
        HOVER_TOLERANCE_PX / scale,
      )
      if (!placement) return null

      const count = openings.filter((o) => o.kind === kind).length
      const opening = createOpeningElement(kind, `${fr.elements[kind]} ${count + 1}`, {
        wallId: placement.wall.id,
        segmentIndex: placement.segmentIndex,
        offset: placement.offset,
        side: placement.side,
      })
      return { placement, opening }
    },
    [kind, elements, scale],
  )

  const preview = useMemo<OpeningPreview | null>(() => {
    const result = cursor ? compute(cursor) : null
    if (!result) return null
    const { placement, opening } = result
    const segment = wallSegment(placement.wall, placement.segmentIndex)
    const clearances: OpeningPreview['clearances'] = []
    if (segment && !placement.problem) {
      const { before, after } = openingClearances(opening.offset, opening.width, segment.length)
      const at = (distance: number) => ({
        x: segment.a.x + segment.direction.x * distance,
        y: segment.a.y + segment.direction.y * distance,
      })
      if (before > 0) clearances.push({ length: before, at: at(before / 2) })
      if (after > 0) {
        clearances.push({ length: after, at: at(opening.offset + opening.width / 2 + after / 2) })
      }
    }
    return { opening, wall: placement.wall, problem: placement.problem, clearances }
  }, [cursor, compute])

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      if (!kind) return
      const point = event.target.getStage()?.getRelativePointerPosition()
      if (point) setStored({ kind, cursor: point })
    },
    [kind],
  )

  const onPointerDown = useCallback(
    (event: PointerEvent) => {
      if (!kind) return
      const point = event.target.getStage()?.getRelativePointerPosition()
      if (!point) return
      const result = compute(point)
      if (!result) {
        setNotice(fr.notices.openingNoWall)
        return
      }
      if (result.placement.problem) {
        setNotice(NOTICES[result.placement.problem])
        return
      }
      setNotice(null)
      addElement(result.opening) // l'ouverture posée devient la sélection
    },
    [kind, compute, addElement, setNotice],
  )

  return useMemo(
    () => ({ preview, onPointerDown, onPointerMove }),
    [preview, onPointerDown, onPointerMove],
  )
}
