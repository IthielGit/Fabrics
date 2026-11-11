import { useRef, type PointerEvent as ReactPointerEvent } from 'react'
import {
  positionAfterThumbDrag,
  scrollMetrics,
  type ScrollMetrics,
} from '../../features/geometry/navigation'
import { pxPerUnit } from '../../features/units/scale'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'

interface ScrollBarProps {
  axis: 'horizontal' | 'vertical'
  metrics: ScrollMetrics
  /** Position actuelle du canevas sur cet axe (px écran). */
  position: number
  /** Demande une nouvelle position du canevas sur cet axe. */
  onPosition: (position: number) => void
  label: string
}

function ScrollBar({ axis, metrics, position, onPosition, label }: ScrollBarProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ pointer: number; position: number; metrics: ScrollMetrics } | null>(null)
  const horizontal = axis === 'horizontal'

  const trackLength = () => {
    const rect = trackRef.current?.getBoundingClientRect()
    return (horizontal ? rect?.width : rect?.height) ?? 0
  }
  const coordinate = (event: ReactPointerEvent) => (horizontal ? event.clientX : event.clientY)

  const onThumbDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { pointer: coordinate(event), position, metrics }
  }
  const onThumbMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = drag.current
    if (!start) return
    // Les métriques du début du geste restent figées : le curseur suit la souris sans dériver.
    onPosition(
      positionAfterThumbDrag(
        start.position,
        coordinate(event) - start.pointer,
        trackLength(),
        start.metrics,
      ),
    )
  }
  const onThumbUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    drag.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  // Un clic sur la piste, hors du curseur, y amène le curseur.
  const onTrackDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect) return
    const length = horizontal ? rect.width : rect.height
    const click = (horizontal ? event.clientX - rect.left : event.clientY - rect.top) / length
    const thumbCentre = metrics.thumbStart + metrics.thumbSize / 2
    onPosition(positionAfterThumbDrag(position, (click - thumbCentre) * length, length, metrics))
  }

  const thumbStyle = horizontal
    ? { left: `${metrics.thumbStart * 100}%`, width: `${metrics.thumbSize * 100}%` }
    : { top: `${metrics.thumbStart * 100}%`, height: `${metrics.thumbSize * 100}%` }

  return (
    <div
      ref={trackRef}
      role="scrollbar"
      aria-label={label}
      aria-orientation={axis}
      aria-valuenow={Math.round(metrics.thumbStart * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      onPointerDown={onTrackDown}
      className={
        horizontal
          ? 'absolute bottom-0 left-0 right-3 h-3 bg-slate-200/30 hover:bg-slate-200/70'
          : 'absolute right-0 top-0 bottom-3 w-3 bg-slate-200/30 hover:bg-slate-200/70'
      }
    >
      <div
        onPointerDown={onThumbDown}
        onPointerMove={onThumbMove}
        onPointerUp={onThumbUp}
        onPointerCancel={onThumbUp}
        style={{ ...thumbStyle, touchAction: 'none' }}
        className={
          horizontal
            ? 'absolute top-0.5 bottom-0.5 min-w-6 rounded-full bg-slate-400/70 hover:bg-slate-500/80'
            : 'absolute left-0.5 right-0.5 min-h-6 rounded-full bg-slate-400/70 hover:bg-slate-500/80'
        }
      />
    </div>
  )
}

/**
 * Barres de défilement du plan de travail : horizontale en bas, verticale à droite. La plage
 * couvre la page avec une marge d'une demi-fenêtre de chaque côté ; le curseur montre où l'on est
 * et se glisse pour déplacer la vue.
 */
export default function ScrollBars() {
  const project = useEditorStore((state) => state.project)
  const zoom = useEditorStore((state) => state.zoom)
  const stagePosition = useEditorStore((state) => state.stagePosition)
  const viewportSize = useEditorStore((state) => state.viewportSize)
  const setView = useEditorStore((state) => state.setView)

  if (!project || viewportSize.width === 0 || viewportSize.height === 0) return null
  const { page, unit } = project.document
  const scale = zoom * pxPerUnit(unit)
  const horizontal = scrollMetrics(stagePosition.x, page.width * scale, viewportSize.width)
  const vertical = scrollMetrics(stagePosition.y, page.height * scale, viewportSize.height)

  return (
    <>
      <ScrollBar
        axis="horizontal"
        metrics={horizontal}
        position={stagePosition.x}
        onPosition={(x) => setView({ zoom, stagePosition: { x, y: stagePosition.y } })}
        label={fr.editor.scrollHorizontal}
      />
      <ScrollBar
        axis="vertical"
        metrics={vertical}
        position={stagePosition.y}
        onPosition={(y) => setView({ zoom, stagePosition: { x: stagePosition.x, y } })}
        label={fr.editor.scrollVertical}
      />
    </>
  )
}
