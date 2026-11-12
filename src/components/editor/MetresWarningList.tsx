import { AlertTriangle } from 'lucide-react'
import type { MetresWarning } from '../../features/measurements/warnings'
import { applyWallFix } from '../../features/geometry/wallContacts'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import { fitBoxView } from '../../features/geometry/navigation'
import { pxPerUnit } from '../../features/units/scale'
import { boxRing, warningFocusBox } from '../../features/measurements/warningFocus'
import { metresWarningAdvice, metresWarningTargets, metresWarningText } from './metresWarningText'

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

  /** Affiche le niveau, sélectionne l'élément, entoure la zone et centre le plan dessus. */
  const handleClick = (warning: MetresWarning) => {
    const state = useEditorStore.getState()
    const elements = state.project?.document.elements
    if (!elements || !state.project) return
    if ('levelId' in warning && warning.levelId !== state.activeLevelId) state.setActiveLevel(warning.levelId)
    const targets = metresWarningTargets(warning)
    state.setSelection(targets)
    const box = warningFocusBox(warning, targets, elements)
    const levelId = 'levelId' in warning ? warning.levelId : state.activeLevelId
    if (box && levelId) {
      state.setSurfaceHighlight({
        levelId,
        rings: 'rings' in warning ? warning.rings : [boxRing(box)],
        elements,
      })
      if (state.viewportSize.width > 0) {
        const view = fitBoxView(box, state.viewportSize, pxPerUnit(state.project.document.unit))
        state.setView({ zoom: view.zoom, stagePosition: { x: view.x, y: view.y } })
      }
    } else {
      state.setSurfaceHighlight(null)
    }
    onNavigate?.()
  }

  /** Applique la correction proposée (annulable avec Ctrl+Z) ; le contrôle se recalcule tout seul. */
  const handleFix = (warning: MetresWarning) => {
    if (!('fix' in warning) || !warning.fix) return
    const { fix } = warning
    const state = useEditorStore.getState()
    state.updateElements([fix.wallId], (el) => (el.type === 'wall' ? applyWallFix(el, fix) : el))
    state.setNotice(fr.measurements.warnings.fixed)
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
                    onClick={() => handleFix(warning)}
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
