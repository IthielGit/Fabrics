import type { Estimate } from '../../features/pricing/estimate'
import { formatAriary, formatRate } from '../../features/pricing/money'
import { useT } from '../../i18n/useT'

/** Totaux HT, TVA, TTC, puis décomposition débours sec / frais, bénéfice et aléas (D23-19). */
export default function DqeTotals({ estimate }: { estimate: Estimate }) {
  const t = useT()
  const money = (value: bigint) => formatAriary(value, { decimals: 0 })
  const row = (label: string, value: bigint, strong = false) => (
    <div className={`flex justify-between gap-4 ${strong ? 'font-semibold' : ''}`}>
      <dt>{label}</dt>
      <dd className="tabular-nums">{money(value)}</dd>
    </div>
  )
  return (
    <section className="space-y-3 text-sm">
      <dl className="space-y-0.5">
        {row(t('dqe.totalHt'), estimate.totalHt, true)}
        {row(t('dqe.vat', { rate: formatRate(estimate.settings.vatRateBp) }), estimate.vat)}
        {row(t('dqe.totalTtc'), estimate.totalTtc, true)}
      </dl>
      <div>
        <h3 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">{t('dqe.breakdown')}</h3>
        <dl className="space-y-0.5 text-xs">
          {row(t('dqe.debours'), estimate.debours)}
          {row(t('dqe.overheadMargin'), estimate.overheadAndMargin)}
        </dl>
      </div>
    </section>
  )
}
