import { ChevronDown } from 'lucide-react'
import { RULESET_VERSION, THRESHOLD_CATEGORIES, takeoffSettingsOf } from '../../features/measurements/quantities/rules'
import { mm2ToM2 } from '../../features/units/format'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import NumberField from '../ui/NumberField'

/**
 * Règles du quantitatif (M21, 21.2) : seuils de déduction des vides par catégorie, en m², enregistrés
 * avec le plan. 0 = toute ouverture est déduite (valeur par défaut, D21-2).
 */
export default function TakeoffRulesSection() {
  const plan = useEditorStore((state) => state.project?.document.plan)
  const updatePlanSettings = useEditorStore((state) => state.updatePlanSettings)
  if (!plan) return null
  const t = fr.measurements.takeoffRules
  const { thresholds } = takeoffSettingsOf(plan.takeoff)

  return (
    <details className="group mt-4 border-t border-slate-200 pt-4">
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-slate-900">
        {t.title}
        <ChevronDown size={16} aria-hidden="true" className="transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-3 space-y-3">
        <p className="text-xs leading-relaxed text-slate-600">{t.hint}</p>
        {THRESHOLD_CATEGORIES.map((category) => (
          <NumberField
            key={category}
            label={t.categories[category]}
            suffix="m²"
            step={0.1}
            value={mm2ToM2(thresholds[category])}
            onCommit={(m2) =>
              updatePlanSettings({
                takeoff: { ...plan.takeoff, thresholds: { ...thresholds, [category]: Math.max(0, Math.round(m2 * 1e6)) } },
              })
            }
          />
        ))}
        <p className="text-xs text-slate-500">{t.version(RULESET_VERSION)}</p>
      </div>
    </details>
  )
}
