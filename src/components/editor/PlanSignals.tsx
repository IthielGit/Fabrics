import { AlertOctagon, AlertTriangle } from 'lucide-react'
import { useDeferredValue, useMemo, useState } from 'react'
import { computeBuildingMeasurements } from '../../features/measurements/measurements'
import { isBlockingWarning, isSurfaceWarning, metresWarnings } from '../../features/measurements/warnings'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import MetresWarningList from './MetresWarningList'

type Open = 'errors' | 'warnings' | null

/**
 * Signaux permanents en haut à droite du plan : une pastille rouge (à corriger : l'export est bloqué)
 * et une pastille orange (à vérifier), avec leur nombre. Un clic déplie la liste ; un clic sur un
 * point mène à l'élément concerné. Les confirmations restent dans l'avis du haut (`Notice`).
 */
export default function PlanSignals() {
  const isPlan = useEditorStore((state) => state.project?.kind === 'plan')
  const elements = useEditorStore((state) => state.project?.document.elements)
  const levels = useEditorStore((state) => state.project?.document.levels)
  // Le contrôle est recalculé un peu après la frappe : il ne ralentit pas le glissement d'un mur.
  const deferredElements = useDeferredValue(elements)
  const [open, setOpen] = useState<Open>(null)

  const { errors, warnings } = useMemo(() => {
    if (!isPlan || !deferredElements) return { errors: [], warnings: [] }
    const document = { elements: deferredElements, levels }
    const all = metresWarnings(document, computeBuildingMeasurements(document)).filter(isSurfaceWarning)
    return { errors: all.filter(isBlockingWarning), warnings: all.filter((w) => !isBlockingWarning(w)) }
  }, [isPlan, deferredElements, levels])

  if (!isPlan || (errors.length === 0 && warnings.length === 0)) return null

  const t = fr.signals
  const chip = 'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium shadow-sm'
  const toggle = (value: Exclude<Open, null>) => setOpen((current) => (current === value ? null : value))

  return (
    <div className="absolute right-6 top-14 z-20 flex max-w-sm flex-col items-end gap-2" aria-label={t.label}>
      <div className="flex gap-2">
        {errors.length > 0 && (
          <button
            type="button"
            aria-expanded={open === 'errors'}
            onClick={() => toggle('errors')}
            title={t.errorsHint}
            className={`${chip} border-red-300 bg-red-50 text-red-800 hover:bg-red-100`}
          >
            <AlertOctagon size={14} aria-hidden="true" />
            {t.errors(errors.length)}
          </button>
        )}
        {warnings.length > 0 && (
          <button
            type="button"
            aria-expanded={open === 'warnings'}
            onClick={() => toggle('warnings')}
            title={t.warningsHint}
            className={`${chip} border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100`}
          >
            <AlertTriangle size={14} aria-hidden="true" />
            {t.warnings(warnings.length)}
          </button>
        )}
      </div>
      {open === 'errors' && errors.length > 0 && (
        <div className="w-full bg-white shadow-lg">
          <MetresWarningList
            warnings={errors}
            title={fr.measurements.warnings.toFix}
            note={t.errorsHint}
            tone="error"
            interactive
          />
        </div>
      )}
      {open === 'warnings' && warnings.length > 0 && (
        <div className="w-full bg-white shadow-lg">
          <MetresWarningList warnings={warnings} title={fr.measurements.warnings.title} interactive />
        </div>
      )}
    </div>
  )
}
