import { AlertTriangle } from 'lucide-react'
import type { MetresWarning } from '../../features/measurements/warnings'
import { fr } from '../../i18n/fr'
import { metresWarningAdvice, metresWarningText } from './metresWarningText'
import { focusWarning, fixWarning } from './warningActions'

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
    focusWarning(warning)
    onNavigate?.()
  }
  const t = fr.measurements.warnings

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
          <li key={i} className={interactive ? 'rounded bg-white/60 p-1.5' : undefined}>
            {metresWarningText(warning)}
            {interactive && (
              <p className="mt-0.5 opacity-90">
                <span className="font-semibold">{t.whatToDo}</span> {metresWarningAdvice(warning)}
              </p>
            )}
            {interactive && (
              <div className="mt-1 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleClick(warning)}
                  className="rounded border border-slate-400 bg-white px-1.5 py-px font-medium text-slate-800 hover:bg-slate-100"
                >
                  {t.seeOnPlan}
                </button>
                {'fix' in warning && warning.fix && (
                  <button
                    type="button"
                    onClick={() => fixWarning(warning)}
                    title={warning.kind === 'wallGap' ? t.fixGapHint : t.fixOverlapHint}
                    className="rounded border border-amber-500 bg-white px-1.5 py-px font-medium text-amber-900 hover:bg-amber-100"
                  >
                    {warning.kind === 'wallGap' ? t.fixGap : t.fixOverlap}
                  </button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
      {warnings.length > MAX_SHOWN && <p className="mt-1">{fr.measurements.warnings.more(warnings.length - MAX_SHOWN)}</p>}
      {note && <p className="mt-1">{note}</p>}
    </div>
  )
}
