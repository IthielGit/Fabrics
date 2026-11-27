import { isEmptyPlan, summarizePlan, type ImportPlan } from '../../features/pricing/importPlan'
import { hasBlocking } from '../../features/pricing/importReport'
import type { ImportedLibrary } from '../../features/pricing/importWorkbook'
import { useT } from '../../i18n/useT'
import { formatIsoDay } from '../../lib/date'
import Button from '../ui/Button'
import ImportReportList from './ImportReportList'

interface ImportPreviewProps {
  fileName: string
  result: ImportedLibrary
  plan: ImportPlan
  /** Version actuelle de la bibliothèque ; l'import donnera la suivante. */
  version: number
  onApply: () => void
  onCancel: () => void
}

/** Aperçu d'un import : ce qui a été lu, ce qui va changer, le rapport de lecture. */
export default function ImportPreview({ fileName, result, plan, version, onApply, onCancel }: ImportPreviewProps) {
  const t = useT()
  const blocked = hasBlocking(result.issues)
  const empty = isEmptyPlan(plan)
  const summary = summarizePlan(plan, 0)
  const count = (kind: string) => result.priceItems.filter((item) => item.kind === kind).length
  const rows: [string, number][] = [
    [t('pricing.import.added'), summary.added],
    [t('pricing.import.updated'), summary.updated],
    [t('pricing.import.priceChanges'), summary.priceChanges],
    [t('pricing.import.removed'), summary.removed],
    [t('pricing.import.unchanged'), summary.unchanged],
    [t('pricing.import.keptManual'), summary.keptManual],
  ]
  return (
    <div className="space-y-5 text-sm">
      <div className="space-y-1">
        <p className="break-all">{t('pricing.import.file', { name: fileName })}</p>
        {result.priceDate && (
          <p className="text-muted-foreground">{t('pricing.import.priceDate', { date: formatIsoDay(result.priceDate) })}</p>
        )}
      </div>
      {!blocked && (
        <>
          <section>
            <h3 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">{t('pricing.import.read')}</h3>
            <p>
              {t('pricing.import.readCounts', {
                material: count('material'),
                equipment: count('equipment'),
                labour: count('labour'),
                work: result.workItems.length,
              })}
            </p>
          </section>
          <section>
            <h3 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">{t('pricing.import.changes')}</h3>
            <dl className="grid max-w-md grid-cols-[1fr_auto] gap-x-6 gap-y-0.5">
              {rows.map(([label, value]) => (
                <div key={label} className="contents">
                  <dt>{label}</dt>
                  <dd className="text-right tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </>
      )}
      <section>
        <h3 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">{t('pricing.import.report')}</h3>
        <ImportReportList issues={result.issues} />
      </section>
      {blocked && <p className="text-red-600">{t('pricing.import.blocked')}</p>}
      {!blocked && empty && <p>{t('pricing.import.nothing')}</p>}
      <div className="flex justify-end gap-2">
        <Button onClick={onCancel}>{t('common.cancel')}</Button>
        <Button variant="primary" disabled={blocked || empty} onClick={onApply}>
          {t('pricing.import.apply', { version: version + 1 })}
        </Button>
      </div>
    </div>
  )
}
