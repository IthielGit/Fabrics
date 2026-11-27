import { ChevronDown, ChevronRight } from 'lucide-react'
import { Fragment, useState } from 'react'
import { formatQuantity, type Estimate, type EstimateLine } from '../../features/pricing/estimate'
import { formatAriary, formatRate } from '../../features/pricing/money'
import type { PricingRule, QuantityOverride } from '../../features/pricing/rules'
import { fr } from '../../i18n/fr'
import { useT } from '../../i18n/useT'
import { LINK_BUTTON } from './styles'

interface DqeLinesProps {
  estimate: Estimate
  rules: readonly PricingRule[]
  canEdit: boolean
  onSelect: (ids: string[]) => void
  onOverride: (override: Omit<QuantityOverride, 'id'>) => void
}

const CELL = 'border-b border-border/50 px-1.5 py-1 align-top'
const NUM = `${CELL} whitespace-nowrap text-right tabular-nums`

/** Code de quantité lisible d'une source (« Surface nette (une face) »). */
function quantityLabel(quantityKey: string): string {
  const code = quantityKey.split(':')[1] as keyof typeof fr.measurements.quantities.codes
  return fr.measurements.quantities.codes[code] ?? code
}

/** Lignes du DQE par lot : poste, quantité dans l'unité du poste (D23-17), prix de vente, montant, origine. */
export default function DqeLines({ estimate, rules, canEdit, onSelect, onOverride }: DqeLinesProps) {
  const t = useT()
  const [open, setOpen] = useState<string | null>(null)
  const ruleName = new Map(rules.map((rule) => [rule.id, rule.name]))

  if (estimate.lots.length === 0) return <p className="text-xs text-muted-foreground">{t('dqe.empty')}</p>

  const lineRow = (line: EstimateLine) => {
    const expanded = open === line.workItemId
    return (
      <Fragment key={line.workItemId}>
        <tr>
          <td className={CELL}>
            <button
              type="button"
              aria-expanded={expanded}
              aria-label={t('dqe.showOrigin', { code: line.code })}
              className="flex items-start gap-1 text-left hover:underline"
              onClick={() => setOpen(expanded ? null : line.workItemId)}
            >
              {expanded ? <ChevronDown size={12} className="mt-0.5 shrink-0" aria-hidden="true" /> : <ChevronRight size={12} className="mt-0.5 shrink-0" aria-hidden="true" />}
              <span>
                <span className="tabular-nums text-muted-foreground">{line.code}</span> {line.designation}
                {line.provisional && <span className="ml-1 text-amber-600">({t('dqe.provisionalBadge')})</span>}
              </span>
            </button>
          </td>
          <td className={NUM}>
            {formatQuantity(line.quantity, line.quantityDecimals)} {line.unit}
          </td>
          <td className={NUM}>
            {line.salePriceHt === null ? <span className="text-red-600">{t('dqe.noPrice')}</span> : formatAriary(line.salePriceHt, { unit: false })}
          </td>
          <td className={NUM}>{line.amountHt === null ? '—' : formatAriary(line.amountHt, { decimals: 0, unit: false })}</td>
        </tr>
        {expanded && (
          <tr>
            <td colSpan={4} className="border-b border-border/50 bg-muted/30 px-3 py-2">
              <p className="mb-1 text-[11px] font-semibold uppercase text-muted-foreground">{t('dqe.origin')}</p>
              <ul className="space-y-1">
                {line.sources.map((source) => (
                  <li key={`${source.quantityKey}|${source.ruleId}`} className="flex flex-wrap items-center gap-x-2">
                    <span>{quantityLabel(source.quantityKey)}</span>
                    <span className="text-muted-foreground">
                      {source.overrideId
                        ? t('dqe.sourceOverride')
                        : t('dqe.sourceRule', { name: ruleName.get(source.ruleId ?? '') ?? '—' })}
                      {source.wasteBp > 0 && ` · ${t('dqe.waste', { rate: formatRate(source.wasteBp) })}`}
                    </span>
                    <button type="button" className={LINK_BUTTON} onClick={() => onSelect(source.elementIds)}>
                      {t('dqe.selectSource')}
                    </button>
                    {canEdit && source.ruleId && !source.overrideId && (
                      <button
                        type="button"
                        className={LINK_BUTTON}
                        onClick={() => onOverride({ quantityKey: source.quantityKey, ruleId: source.ruleId, workItemId: null, note: line.code })}
                      >
                        {t('dqe.removeSource')}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </td>
          </tr>
        )}
      </Fragment>
    )
  }

  return (
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr className="text-left text-[11px] text-muted-foreground">
          <th className="px-1.5 py-1 font-medium">{t('dqe.col.code')}</th>
          <th className="px-1.5 py-1 text-right font-medium">{t('dqe.col.quantity')}</th>
          <th className="px-1.5 py-1 text-right font-medium">{t('dqe.col.price')}</th>
          <th className="px-1.5 py-1 text-right font-medium">{t('dqe.col.amount')}</th>
        </tr>
      </thead>
      <tbody>
        {estimate.lots.map((lot) => (
          <Fragment key={lot.category}>
            <tr>
              <td colSpan={4} className="pt-3 pb-1 font-semibold">
                {lot.category}
              </td>
            </tr>
            {lot.lines.map(lineRow)}
            <tr>
              <td colSpan={3} className={`${CELL} text-right text-muted-foreground`}>
                {t('dqe.lot', { lot: lot.category })}
              </td>
              <td className={`${NUM} font-medium`}>{formatAriary(lot.subtotalHt, { decimals: 0, unit: false })}</td>
            </tr>
          </Fragment>
        ))}
      </tbody>
    </table>
  )
}
