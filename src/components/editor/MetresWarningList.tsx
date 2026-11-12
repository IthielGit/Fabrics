import { AlertTriangle } from 'lucide-react'
import type { MetresWarning } from '../../features/measurements/warnings'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import { metresWarningTargets, metresWarningText } from './metresWarningText'

/** Au-delà, la liste est raccourcie (« … et 3 autres »). */
const MAX_SHOWN = 8

/**
 * Liste des points à vérifier dans les métrés. Avec `interactive`, un clic affiche le niveau,
 * sélectionne l'élément et surligne la zone concernée sur le plan.
 */
export default function MetresWarningList({
  warnings,
  title,
  note,
  interactive = false,
  tone = 'warning',
  onNavigate,
}: {
  warnings: readonly MetresWarning[]
  title: string
  note?: string
  interactive?: boolean
  /** `error` : problème qui bloque l'export (rouge). */
  tone?: 'warning' | 'error'
  /** Appelé après un clic (par exemple pour fermer la fenêtre Exporter et montrer le plan). */
  onNavigate?: () => void
}) {
  if (warnings.length === 0) return null
  const shown = warnings.slice(0, MAX_SHOWN)

  const handleClick = (warning: MetresWarning) => {
    const state = useEditorStore.getState()
    const elements = state.project?.document.elements
    if (!elements) return
    if ('levelId' in warning && warning.levelId !== state.activeLevelId) state.setActiveLevel(warning.levelId)
    state.setSelection(metresWarningTargets(warning))
    state.setSurfaceHighlight(
      'rings' in warning ? { levelId: warning.levelId, rings: warning.rings, elements } : null,
    )
    onNavigate?.()
  }

  return (
    <div
      role="alert"
      className={`rounded border px-2 py-1.5 text-xs ${
        tone === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-amber-200 bg-amber-50 text-amber-900'
      }`}
    >
      <p className="mb-1 flex items-center gap-1 font-semibold">
        <AlertTriangle size={12} aria-hidden="true" />
        {title}
      </p>
      <ul className="space-y-0.5">
        {shown.map((warning, i) => (
          <li key={i}>
            {interactive ? (
              <button
                type="button"
                onClick={() => handleClick(warning)}
                title={'rings' in warning ? fr.measurements.warnings.showOnPlan : undefined}
                className="text-left underline decoration-amber-300 underline-offset-2 hover:decoration-amber-700"
              >
                {metresWarningText(warning)}
              </button>
            ) : (
              metresWarningText(warning)
            )}
          </li>
        ))}
      </ul>
      {warnings.length > MAX_SHOWN && <p className="mt-1">{fr.measurements.warnings.more(warnings.length - MAX_SHOWN)}</p>}
      {note && <p className="mt-1">{note}</p>}
    </div>
  )
}
