import clsx from 'clsx'
import { ChevronRight } from 'lucide-react'
import { useDeferredValue, useMemo } from 'react'
import { liveMetresSummary } from '../../features/measurements/liveSummary'
import { computeBuildingMeasurements } from '../../features/measurements/measurements'
import { formatArea, formatLength } from '../../features/units/format'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import { SEGMENTED_BAR } from '../ui/segmented'

/**
 * Métrés en direct du niveau affiché (M15 bis, lot D), en bas à droite du plan : nombre de pièces,
 * surface des pièces, longueur des murs, et un lien vers l'onglet Métrés. Plans seulement.
 * Quand le plan est étroit, la barre passe à gauche, au-dessus de la barre d'état.
 */
export default function LiveMetresBar() {
  const isPlan = useEditorStore((state) => state.project?.kind === 'plan')
  const elements = useEditorStore((state) => state.project?.document.elements)
  const levels = useEditorStore((state) => state.project?.document.levels)
  const activeLevelId = useEditorStore((state) => state.activeLevelId)
  const setTab = useEditorStore((state) => state.setSidePanelTab)
  const setPanelOpen = useEditorStore((state) => state.setSidePanelOpen)
  // Recalcul différé : pendant un glisser, le dessin reste fluide et les chiffres suivent juste après.
  const deferredElements = useDeferredValue(elements)
  const summary = useMemo(
    () =>
      liveMetresSummary(
        computeBuildingMeasurements({ elements: deferredElements ?? [], levels }),
        activeLevelId,
      ),
    [deferredElements, levels, activeLevelId],
  )

  if (!isPlan) return null

  return (
    <div
      role="status"
      aria-label={fr.liveMetres.label}
      className={clsx(
        SEGMENTED_BAR,
        'absolute bottom-4 right-3 z-10 gap-3 pl-3 text-sm text-slate-900 tabular-nums',
        '@max-3xl:bottom-[4.25rem] @max-3xl:left-3 @max-3xl:right-auto',
      )}
    >
      <span className="whitespace-nowrap">
        <span className="text-slate-500">{fr.liveMetres.rooms}</span> {summary.rooms}
      </span>
      <span className="whitespace-nowrap">
        <span className="text-slate-500">{fr.liveMetres.area}</span>{' '}
        <span className="font-semibold">{formatArea(summary.roomArea)}</span>
      </span>
      <span className="whitespace-nowrap max-sm:hidden">
        <span className="text-slate-500">{fr.liveMetres.walls}</span> {formatLength(summary.wallLength)}
      </span>
      <button
        type="button"
        title={fr.liveMetres.openTitle}
        onClick={() => {
          setTab('measurements')
          setPanelOpen(true)
        }}
        className={clsx(
          'inline-flex h-8 items-center gap-0.5 rounded-lg pl-2 pr-1 font-medium text-indigo-700 pointer-coarse:h-11',
          'transition-colors duration-150 ease-out hover:bg-indigo-50',
          'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-600',
        )}
      >
        {fr.liveMetres.open}
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </div>
  )
}
