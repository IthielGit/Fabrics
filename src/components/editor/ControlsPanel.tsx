import { useDeferredValue, useMemo, useState } from 'react'
import { CONTROL_GROUPS, countByGroup, planControls, type ControlGroup, type ControlItem, type ExtraControl } from '../../features/measurements/controls'
import { computeBuildingMeasurements } from '../../features/measurements/measurements'
import { useProjectEstimate } from '../pricing/useProjectEstimate'
import { useT, type Translate } from '../../i18n/useT'
import { useEditorStore } from '../../stores/editorStore'
import { metresWarningAdvice, metresWarningText } from './metresWarningText'
import { canFixWarning, fixWarning, focusWarning } from './warningActions'
import { fr } from '../../i18n/fr'

/** Nombre de lignes montrées par groupe avant « … autres points ». */
const MAX_SHOWN = 25

const GROUP_TONE: Record<ControlGroup, string> = {
  fix: 'border-red-500/40 bg-red-500/10',
  check: 'border-amber-500/40 bg-amber-500/10',
  info: 'border-border bg-muted/30',
}
const BUTTON =
  'rounded border border-border bg-background px-1.5 py-px text-xs font-medium text-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring'

function extraText(extra: ExtraControl, t: Translate): { text: string; advice: string } {
  switch (extra.kind) {
    case 'duplicateId':
      return { text: t('controls.duplicateId.text', { count: extra.count, id: extra.id }), advice: t('controls.duplicateId.advice') }
    case 'dqeUncovered':
      return { text: t('controls.dqeUncovered.text', { count: extra.elementIds.length }), advice: t('controls.dqeUncovered.advice') }
    case 'dqeNoPrice':
      return { text: t('controls.dqeNoPrice.text', { count: extra.count }), advice: t('controls.dqeNoPrice.advice') }
    case 'dqeProvisional':
      return { text: t('controls.dqeProvisional.text', { count: extra.count }), advice: t('controls.dqeProvisional.advice') }
    case 'dqeRules':
      return { text: t('controls.dqeRules.text', { count: extra.count }), advice: t('controls.dqeRules.advice') }
  }
}

function ControlRow({ item, t }: { item: ControlItem; t: Translate }) {
  const setSelection = useEditorStore((state) => state.setSelection)
  const text = item.source === 'plan' ? metresWarningText(item.warning) : extraText(item.extra, t).text
  const advice = item.source === 'plan' ? metresWarningAdvice(item.warning) : extraText(item.extra, t).advice
  const selectIds =
    item.source === 'extra' && item.extra.kind === 'dqeUncovered' ? item.extra.elementIds : null
  return (
    <li className={`rounded-md border p-2 text-xs ${GROUP_TONE[item.group]}`}>
      <p className="text-foreground">{text}</p>
      <p className="mt-0.5 text-muted-foreground">
        <span className="font-semibold">{t('controls.whatToDo')}</span> {advice}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {item.source === 'plan' && (
          <button type="button" className={BUTTON} onClick={() => focusWarning(item.warning)}>
            {t('controls.seeOnPlan')}
          </button>
        )}
        {item.source === 'plan' && canFixWarning(item.warning) && (
          <button
            type="button"
            className={BUTTON}
            title={item.warning.kind === 'wallGap' ? fr.measurements.warnings.fixGapHint : fr.measurements.warnings.fixOverlapHint}
            onClick={() => fixWarning(item.warning)}
          >
            {item.warning.kind === 'wallGap' ? fr.measurements.warnings.fixGap : fr.measurements.warnings.fixOverlap}
          </button>
        )}
        {selectIds && (
          <button type="button" className={BUTTON} onClick={() => setSelection(selectIds)}>
            {t('controls.select')}
          </button>
        )}
      </div>
    </li>
  )
}

/**
 * Onglet « Contrôles » (M24, 24.1) : tous les points à vérifier d'un plan en trois groupes, chacun avec
 * ce qui ne va pas, pourquoi, et un bouton « Voir sur le plan » (ou « Corriger » quand c'est sûr).
 */
export default function ControlsPanel() {
  const t = useT()
  const isPlan = useEditorStore((state) => state.project?.kind === 'plan')
  const elements = useEditorStore((state) => state.project?.document.elements)
  const levels = useEditorStore((state) => state.project?.document.levels)
  const pascalQuantities = useEditorStore((state) => state.project?.document.pascalQuantities)
  const activeLevelId = useEditorStore((state) => state.activeLevelId)
  const [scope, setScope] = useState<'all' | 'level'>('all')
  const dqe = useProjectEstimate()
  const estimate = dqe.live?.estimate ?? null

  // Recalculé un peu après la frappe : le contrôle ne ralentit pas le glissement d'un mur.
  const deferredElements = useDeferredValue(elements)
  const items = useMemo(() => {
    if (!isPlan || !deferredElements) return []
    const document = { elements: deferredElements, levels, pascalQuantities }
    return planControls({
      document,
      building: computeBuildingMeasurements(document),
      levelId: scope === 'level' ? activeLevelId : null,
      estimate,
    })
  }, [isPlan, deferredElements, levels, pascalQuantities, scope, activeLevelId, estimate])

  if (!isPlan) return null
  const counts = countByGroup(items)
  const hasLevels = (levels?.length ?? 0) > 1

  return (
    <section aria-label={t('controls.title')} className="space-y-4 p-4 text-sm">
      <div>
        <h2 className="text-base font-semibold">{t('controls.title')}</h2>
        <p className="text-xs text-muted-foreground">{t('controls.intro')}</p>
      </div>
      {hasLevels && (
        <div role="group" aria-label={t('controls.scopeLabel')} className="flex gap-1 rounded-lg bg-muted/40 p-1 text-xs">
          {(['all', 'level'] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={scope === value}
              onClick={() => setScope(value)}
              className={`flex-1 rounded-md px-2 py-1 font-medium ${scope === value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {value === 'all' ? t('controls.scopeAll') : t('controls.scopeLevel')}
            </button>
          ))}
        </div>
      )}
      {items.length === 0 && (
        <p role="status" className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-2 text-xs text-emerald-600">
          {t('controls.allGood')}
        </p>
      )}
      {CONTROL_GROUPS.map((group) => {
        const inGroup = items.filter((item) => item.group === group)
        if (inGroup.length === 0) return null
        return (
          <div key={group} className="space-y-1.5">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground">
              {t(`controls.group.${group}`)} ({counts[group]})
            </h3>
            <p className="text-xs text-muted-foreground">{t(`controls.group.${group}Hint`)}</p>
            <ul className="space-y-1.5">
              {inGroup.slice(0, MAX_SHOWN).map((item, i) => (
                <ControlRow key={i} item={item} t={t} />
              ))}
            </ul>
            {inGroup.length > MAX_SHOWN && (
              <p className="text-xs text-muted-foreground">{t('controls.more', { count: inGroup.length - MAX_SHOWN })}</p>
            )}
          </div>
        )
      })}
    </section>
  )
}
