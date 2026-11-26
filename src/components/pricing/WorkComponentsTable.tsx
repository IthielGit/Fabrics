import type { WorkItem } from '../../features/pricing/model'
import { formatAriary } from '../../features/pricing/money'
import { useT } from '../../i18n/useT'
import { TABLE_CELL, TABLE_HEAD } from './styles'

/** Sous-détail d'un poste (feuille SDP), en lecture seule. */
export default function WorkComponentsTable({ item }: { item: WorkItem }) {
  const t = useT()
  if (item.components.length === 0) {
    return <p className="text-xs text-muted-foreground">{t('pricing.work.noComponents')}</p>
  }
  const total = item.components.reduce((sum, component) => sum + component.amountHt, 0n)
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-x-4 text-xs text-muted-foreground">
        {item.output && <span>{t('pricing.work.output', { output: item.output })}</span>}
        {item.referencePrice !== null && (
          <span>
            {t('pricing.work.reference', {
              k: item.sourceCoefficient || '—',
              price: formatAriary(item.referencePrice),
            })}
          </span>
        )}
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={TABLE_HEAD}>{t('pricing.work.components')}</th>
            <th className={TABLE_HEAD}>{t('pricing.col.unit')}</th>
            <th className={`${TABLE_HEAD} text-right`}>{t('pricing.col.quantity')}</th>
            <th className={`${TABLE_HEAD} text-right`}>{t('pricing.col.unitPrice')}</th>
            <th className={`${TABLE_HEAD} text-right`}>{t('pricing.col.amount')}</th>
          </tr>
        </thead>
        <tbody>
          {item.components.map((component, index) => (
            <tr key={index}>
              <td className={TABLE_CELL}>
                <span className="mr-2 text-xs text-muted-foreground">{t(`pricing.group.${component.group}`)}</span>
                {component.designation}
              </td>
              <td className={TABLE_CELL}>{component.unit}</td>
              <td className={`${TABLE_CELL} text-right tabular-nums`}>{component.quantity.replace('.', ',')}</td>
              <td className={`${TABLE_CELL} whitespace-nowrap text-right tabular-nums`}>
                {formatAriary(component.unitPriceHt)}
              </td>
              <td className={`${TABLE_CELL} whitespace-nowrap text-right tabular-nums`}>
                {formatAriary(component.amountHt)}
              </td>
            </tr>
          ))}
          <tr>
            <td colSpan={4} className={`${TABLE_CELL} font-medium`}>
              {t('pricing.work.componentsTotal')}
            </td>
            <td className={`${TABLE_CELL} whitespace-nowrap text-right font-medium tabular-nums`}>{formatAriary(total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
