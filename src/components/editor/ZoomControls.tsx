import clsx from 'clsx'
import { Map as MapIcon, Maximize, Minus, Navigation2, Plus } from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'
import { zoomStepAtCenter } from '../../features/geometry/navigation'
import { pxPerUnit } from '../../features/units/scale'
import { fr } from '../../i18n/fr'
import { useCompassStore } from '../../stores/compassStore'
import { useEditorStore } from '../../stores/editorStore'
import { useMinimapStore } from '../../stores/minimapStore'
import { SEGMENT_DIVIDER, SEGMENTED_BAR } from '../ui/segmented'
import CompassWidget from './CompassWidget'
import { useDismiss } from './useDismiss'

const ICON_BUTTON =
  'inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-600 pointer-coarse:size-11 ' +
  'transition-colors duration-150 ease-out hover:bg-slate-100 hover:text-slate-900 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-600 ' +
  'disabled:cursor-not-allowed disabled:opacity-40'

interface ZoomControlsProps {
  /** Page en lecture seule : le nord est affiché mais ne se règle pas. */
  readOnly?: boolean
}

/**
 * Barre d'état en bas à gauche (M15 bis, lot C) : zoom − / + / ajuster, échelle d'impression d'un
 * plan (jamais une « échelle écran », qui dépend du moniteur — voir docs/02-ARCHITECTURE.md),
 * direction du nord (un clic ouvre la boussole) et mini-carte.
 */
export default function ZoomControls({ readOnly = false }: ZoomControlsProps) {
  const zoom = useEditorStore((state) => state.zoom)
  const stagePosition = useEditorStore((state) => state.stagePosition)
  const viewportSize = useEditorStore((state) => state.viewportSize)
  const unit = useEditorStore((state) => state.project?.document.unit ?? 'px')
  const printScale = useEditorStore((state) => state.project?.document.plan?.scale)
  const northAngle = useEditorStore((state) => state.project?.document.plan?.northAngle)
  const fitView = useEditorStore((state) => state.fitView)
  const setView = useEditorStore((state) => state.setView)

  const minimapVisible = useMinimapStore((state) => state.visible)
  const toggleMinimap = useMinimapStore((state) => state.toggle)

  const compassVisible = useCompassStore((state) => state.visible)
  const toggleCompass = useCompassStore((state) => state.toggle)
  const setCompassVisible = useCompassStore((state) => state.setVisible)
  const northRef = useRef<HTMLDivElement>(null)
  const closeCompass = useCallback(() => setCompassVisible(false), [setCompassVisible])
  useDismiss(northRef, compassVisible, closeCompass)
  // On ferme la boussole en quittant l'éditeur, pour la retrouver fermée au prochain projet.
  useEffect(() => closeCompass, [closeCompass])

  const percent = Math.round(zoom * 100)

  const step = (direction: 1 | -1) => {
    const next = zoomStepAtCenter({ zoom, ...stagePosition }, viewportSize, direction, pxPerUnit(unit))
    setView({ zoom: next.zoom, stagePosition: { x: next.x, y: next.y } })
  }

  return (
    <div
      className={clsx(
        SEGMENTED_BAR,
        'absolute bottom-4 left-3 z-10 max-w-[calc(100%-1.5rem)] text-sm text-slate-700 tabular-nums',
      )}
    >
      <button type="button" onClick={() => step(-1)} title={fr.editor.zoomOut} aria-label={fr.editor.zoomOut} className={ICON_BUTTON}>
        <Minus size={16} aria-hidden="true" />
      </button>
      <span aria-label={fr.editor.zoomLabel} className="min-w-12 text-center">
        {fr.editor.zoomPercent(percent)}
      </span>
      <button type="button" onClick={() => step(1)} title={fr.editor.zoomIn} aria-label={fr.editor.zoomIn} className={ICON_BUTTON}>
        <Plus size={16} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={fitView}
        title={`${fr.editor.fitToScreen} (Ctrl+0)`}
        aria-label={fr.editor.fitToScreen}
        className={ICON_BUTTON}
      >
        <Maximize size={16} aria-hidden="true" />
      </button>

      {printScale !== undefined && (
        <>
          <span className={SEGMENT_DIVIDER} aria-hidden="true" />
          <span className="whitespace-nowrap px-1.5 max-sm:hidden">
            <span className="text-slate-500">{fr.editor.printScaleLabel}</span> 1:{printScale}
          </span>
        </>
      )}

      {/* Nord du plan : la flèche pointe vers le nord ; un clic ouvre la boussole pour le régler. */}
      {northAngle !== undefined && (
        <>
          <span className={SEGMENT_DIVIDER} aria-hidden="true" />
          <div ref={northRef} className="relative">
            <button
              type="button"
              disabled={readOnly}
              onClick={toggleCompass}
              aria-expanded={compassVisible}
              title={readOnly ? fr.compass.value(northAngle) : fr.compass.open}
              aria-label={`${fr.compass.value(northAngle)}${readOnly ? '' : ` · ${fr.compass.open}`}`}
              className={clsx(
                'inline-flex h-8 items-center gap-1 rounded-lg px-2 pointer-coarse:h-11',
                'transition-colors duration-150 ease-out',
                'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-600',
                compassVisible ? 'bg-indigo-50 text-indigo-700' : 'enabled:hover:bg-slate-100',
                'disabled:cursor-default',
              )}
            >
              <Navigation2
                size={14}
                aria-hidden="true"
                className="fill-red-600 text-red-600"
                style={{ transform: `rotate(${northAngle}deg)` }}
              />
              <span className="font-bold text-red-600">{fr.viewer3d.cardinal.north}</span>
              <span>{northAngle}°</span>
            </button>
            {!readOnly && <CompassWidget />}
          </div>
        </>
      )}

      <span className={SEGMENT_DIVIDER} aria-hidden="true" />
      <button
        type="button"
        onClick={toggleMinimap}
        title={minimapVisible ? fr.editor.hideMinimap : fr.editor.showMinimap}
        aria-label={minimapVisible ? fr.editor.hideMinimap : fr.editor.showMinimap}
        aria-pressed={minimapVisible}
        className={clsx(ICON_BUTTON, minimapVisible && 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100')}
      >
        <MapIcon size={16} aria-hidden="true" />
      </button>
    </div>
  )
}
