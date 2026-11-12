import clsx from 'clsx'
import { Ruler } from 'lucide-react'
import type { DimensioningMode } from '../../features/dimensioning/types'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'

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
      className="pointer-events-auto flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow"
    >
      <span className="flex items-center gap-1 pl-1.5 pr-1 text-sm text-slate-600">
        <Ruler size={16} aria-hidden />
        {fr.dimensioning.label}
      </span>
      {MODES.map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={mode === value}
          onClick={() => setMode(value)}
          className={clsx(
            'rounded-md px-3 py-1 text-sm font-medium',
            mode === value ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100',
          )}
        >
          {fr.dimensioning.modes[value]}
        </button>
      ))}
    </div>
  )
}
