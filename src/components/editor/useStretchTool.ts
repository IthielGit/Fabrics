import type Konva from 'konva'
import { useMemo, useState } from 'react'
import { distance, normalizeBox, type Box } from '../../features/geometry/box'
import {
  constrainStretch,
  stretchZone,
  type StretchResult,
} from '../../features/geometry/stretchZone'
import type { Point } from '../../features/geometry/viewport'
import { fr } from '../../i18n/fr'
import { selectActiveElements, useEditorStore } from '../../stores/editorStore'

type PointerEvent = Konva.KonvaEventObject<MouseEvent | TouchEvent>

/** En dessous de cette taille (px écran), le glisser du rectangle est un simple clic. */
const MIN_ZONE_PX = 6

/**
 * Étapes de l'outil Étirer :
 * - `idle` : rien en cours ;
 * - `zone` : le rectangle est tracé au glisser ;
 * - `base` : le rectangle est fixé, on attend le point de départ du déplacement ;
 * - `move` : on déplace ; le clic suivant valide.
 */
export type StretchState =
  | { phase: 'idle' }
  | { phase: 'zone'; start: Point; current: Point }
  | { phase: 'base'; zone: Box }
  | { phase: 'move'; zone: Box; base: Point; cursor: Point }

const IDLE: StretchState = { phase: 'idle' }

export interface StretchPreview {
  zone: Box
  /** Déplacement retenu (angles droits gardés, aimanté à la grille), en mm. */
  delta: Point
  /** Un côté en biais traverse la zone : aucun déplacement n'est possible. */
  blockedByDiagonal: boolean
  /** Ce qui changerait ; `null` si rien ne change. */
  result: StretchResult | null
}

/**
 * Outil Étirer : on entoure une partie du plan d'un rectangle (glisser), on clique un point de
 * départ, puis un point d'arrivée : tout ce qui est dans le rectangle se déplace de cette distance,
 * les murs qui en sortent s'allongent. `Maj` : direction horizontale ou verticale. `Échap` : annuler
 * (géré par les raccourcis : il quitte l'outil, ce qui abandonne le geste).
 *
 * `scale` = pixels écran par mm.
 */
export function useStretchTool(enabled: boolean, scale: number) {
  const [state, setState] = useState<StretchState>(IDLE)
  const elements = useEditorStore(selectActiveElements)
  const grid = useEditorStore((s) => (s.project?.document.plan?.snapToGrid ? s.project.document.plan.gridSize : null))

  // Quitter l'outil abandonne le geste en cours (ajustement pendant le rendu, sans effet).
  const [wasEnabled, setWasEnabled] = useState(enabled)
  if (wasEnabled !== enabled) {
    setWasEnabled(enabled)
    if (!enabled) setState(IDLE)
  }

  const snap = (value: number) =>
    grid !== null && grid > 0 ? Math.round(value / grid) * grid : Math.round(value)
  const snapPoint = (point: Point): Point => ({ x: snap(point.x), y: snap(point.y) })

  const preview = useMemo<StretchPreview | null>(() => {
    if (state.phase !== 'move') return null
    const { zone, base, cursor } = state
    return computePreview(elements, zone, { x: cursor.x - base.x, y: cursor.y - base.y })
  }, [state, elements])

  const pointerIn = (event: PointerEvent) => event.target.getStage()?.getRelativePointerPosition() ?? null

  /** Point du curseur ; avec Maj, on garde la direction dominante à partir de `base`. */
  const movePoint = (point: Point, base: Point, shift: boolean): Point => {
    const snapped = snapPoint(point)
    if (!shift) return snapped
    return Math.abs(snapped.x - base.x) >= Math.abs(snapped.y - base.y)
      ? { x: snapped.x, y: base.y }
      : { x: base.x, y: snapped.y }
  }

  const onPointerDown = (event: PointerEvent) => {
    const point = pointerIn(event)
    if (!point) return
    if (state.phase === 'idle') {
      setState({ phase: 'zone', start: point, current: point })
    } else if (state.phase === 'base') {
      const base = snapPoint(point)
      setState({ phase: 'move', zone: state.zone, base, cursor: base })
    } else if (state.phase === 'move') {
      const shift = event.evt.shiftKey
      const cursor = movePoint(point, state.base, shift)
      const wanted = { x: cursor.x - state.base.x, y: cursor.y - state.base.y }
      const { delta } = constrainStretch(elements, state.zone, wanted)
      setState(IDLE)
      if (delta.x === 0 && delta.y === 0) return
      const store = useEditorStore.getState()
      const removed = store.stretchZoneBy(state.zone, delta)
      if (removed !== null && removed > 0) store.setNotice(fr.stretch.removed(removed))
    }
  }

  const onPointerMove = (event: PointerEvent) => {
    const point = pointerIn(event)
    if (!point) return
    if (state.phase === 'zone') {
      setState({ ...state, current: point })
    } else if (state.phase === 'move') {
      setState({ ...state, cursor: movePoint(point, state.base, event.evt.shiftKey) })
    }
  }

  const onPointerUp = () => {
    if (state.phase !== 'zone') return
    const zone = normalizeBox(state.start, state.current)
    if (distance(state.start, state.current) * scale < MIN_ZONE_PX) {
      setState(IDLE) // simple clic : rien
      return
    }
    setState({ phase: 'base', zone })
  }

  return { state, preview, onPointerDown, onPointerMove, onPointerUp }
}

function computePreview(
  elements: Parameters<typeof constrainStretch>[0],
  zone: Box,
  wanted: Point,
): StretchPreview {
  const { delta, blockedByDiagonal } = constrainStretch(elements, zone, wanted)
  return { zone, delta, blockedByDiagonal, result: stretchZone(elements, zone, delta) }
}
