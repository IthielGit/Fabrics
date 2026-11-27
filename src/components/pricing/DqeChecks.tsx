import type { Estimate } from '../../features/pricing/estimate'
import { useT } from '../../i18n/useT'
import { LINK_BUTTON } from './styles'

/** Points à vérifier du DQE : couverture, postes sans prix, lignes provisoires, remarques sur les règles. */
export default function DqeChecks({ estimate, onSelect }: { estimate: Estimate; onSelect: (ids: string[]) => void }) {
  const t = useT()
  const items: { key: string; text: string; tone: string; ids?: string[] }[] = []
  if (estimate.uncoveredElementIds.length > 0) {
    items.push({ key: 'uncovered', text: t('dqe.uncovered', { count: estimate.uncoveredElementIds.length }), tone: 'text-amber-600', ids: estimate.uncoveredElementIds })
  }
  if (estimate.linesWithoutPrice > 0) items.push({ key: 'price', text: t('dqe.withoutPrice', { count: estimate.linesWithoutPrice }), tone: 'text-red-600' })
  if (estimate.provisionalLines > 0) items.push({ key: 'prov', text: t('dqe.provisional', { count: estimate.provisionalLines }), tone: 'text-amber-600' })
  if (estimate.warnings.length > 0) items.push({ key: 'rules', text: t('dqe.ruleWarnings', { count: estimate.warnings.length }), tone: 'text-amber-600' })
  return (
    <section className="space-y-1">
      <h3 className="text-xs font-semibold uppercase text-muted-foreground">{t('dqe.checks')}</h3>
      {items.length === 0 && <p className="text-xs text-emerald-600">{t('dqe.allGood')}</p>}
      <ul className="space-y-1 text-xs">
        {items.map((item) => (
          <li key={item.key} className={item.tone}>
            {item.text}
            {item.ids && (
              <button type="button" className={`${LINK_BUTTON} ml-1`} onClick={() => onSelect(item.ids!)}>
                {t('dqe.select')}
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
