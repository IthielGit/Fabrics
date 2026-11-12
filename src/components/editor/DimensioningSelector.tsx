import clsx from 'clsx'
import { Ruler } from 'lucide-react'
import type { DimensioningMode } from '../../features/dimensioning/types'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import { SEGMENT_DIVIDER, SEGMENTED_BAR, segmentClass } from '../ui/segmented'

const MODES: readonly DimensioningMode[] = ['none', 'client', 'execution']

/**
 * Réglage « Cotation » d'un plan (M10 ter lot B) : aucune cote automatique, version Client ou
 * version Exécution. État d'interface : changer de version ne modifie pas le document.
 */
export default function DimensioningSelector() {
  const isPlan = useEditorStore((state) => state.project?.kind === 'plan')
  const mode = useEditorStore((state) => state.dimensioningMode)
  const setMode = useEditorStore((state) => state.setDimensioningMode)
  if (!isPlan) return null

  return (
    <div
      role="group"
      aria-label={fr.dimensioning.label}
      title={fr.dimensioning.title}
      className={clsx('pointer-events-auto shrink-0', SEGMENTED_BAR)}
    >
      {/* Légende, pas un bouton : pas de fond, séparée des choix par un filet. */}
      <span className="flex items-center gap-1.5 pl-2 pr-1 text-sm text-slate-500">
        <Ruler size={16} aria-hidden />
        {fr.dimensioning.label}
      </span>
      <span className={SEGMENT_DIVIDER} aria-hidden />
      {MODES.map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={mode === value}
          onClick={() => setMode(value)}
          className={segmentClass(mode === value)}
        >
          {fr.dimensioning.modes[value]}
        </button>
      ))}
    </div>
  )
}
