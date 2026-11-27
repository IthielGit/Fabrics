import { buildMetresPdf } from '../../features/export/metresPdf'
import { exportFileName } from '../../features/export/fileName'
import { sheetSize } from '../../features/export/pdfLayout'
import { RULESET_VERSION } from '../../features/measurements/quantities/rules'
import { formatK1, type Estimate } from '../../features/pricing/estimate'
import type { EstimateVersion } from '../../features/pricing/estimateVersions'
import { buildEstimateTables, type EstimateTableLabels } from '../../features/pricing/estimateTables'
import type { PriceLibrary } from '../../features/pricing/model'
import { formatRate } from '../../features/pricing/money'
import { fr } from '../../i18n/fr'
import type { Translate } from '../../i18n/useT'
import { formatDate, formatIsoDay } from '../../lib/date'
import { downloadBlob } from '../../lib/download'

export interface EstimateExportContext {
  projectName: string
  workspaceName: string
  library: PriceLibrary
  /** Version figée identique à l'état actuel (même empreinte), sinon `null` (« non figé »). */
  version: EstimateVersion | null
  now: Date
}

function tableLabels(estimate: Estimate, t: Translate): EstimateTableLabels {
  const { settings } = estimate
  const assumptions: [string, string][] = [
    [
      t('dqe.export.h.k1'),
      t('dqe.export.h.k1Value', {
        a1: formatRate(settings.a1Bp),
        a2: formatRate(settings.a2Bp),
        a3: formatRate(settings.a3Bp),
        k1: formatK1(estimate.k1Millionths),
      }),
    ],
    [t('dqe.export.h.vat'), t('dqe.export.h.vatValue', { rate: formatRate(settings.vatRateBp) })],
    [t('dqe.export.h.prices'), t('dqe.export.h.pricesValue')],
    [t('dqe.export.h.ht'), t('dqe.export.h.htValue')],
    [t('dqe.export.h.rounding'), t('dqe.export.h.roundingValue')],
    [t('dqe.export.h.quantities'), t('dqe.export.h.quantitiesValue', { rules: RULESET_VERSION })],
  ]
  if (estimate.provisionalLines > 0) {
    assumptions.push([t('dqe.export.h.provisional'), t('dqe.export.h.provisionalValue', { count: estimate.provisionalLines })])
  }
  if (estimate.linesWithoutPrice > 0) {
    assumptions.push([t('dqe.export.h.withoutPrice'), t('dqe.export.h.withoutPriceValue', { count: estimate.linesWithoutPrice })])
  }
  assumptions.push([t('dqe.export.h.review'), t('dqe.export.h.reviewValue')])
  return {
    summaryTitle: t('dqe.export.summary'),
    totalsTitle: t('dqe.export.totals'),
    amountAny: t('dqe.export.amountColumn'),
    detailTitle: t('dqe.export.detail'),
    breakdownTitle: t('dqe.export.breakdown'),
    assumptionsTitle: t('dqe.export.assumptions'),
    lot: t('dqe.export.lot'),
    code: t('dqe.export.code'),
    designation: t('dqe.export.designation'),
    unit: t('dqe.export.unit'),
    quantity: t('dqe.export.quantity'),
    salePrice: t('dqe.export.salePrice'),
    amount: t('dqe.export.amount'),
    label: t('dqe.export.label'),
    value: t('dqe.export.value'),
    totalHt: t('dqe.totalHt'),
    vat: (rate) => t('dqe.vat', { rate }),
    totalTtc: t('dqe.totalTtc'),
    debours: t('dqe.debours'),
    overheadMargin: t('dqe.overheadMargin'),
    noPrice: t('dqe.noPrice'),
    provisional: t('dqe.provisionalBadge'),
    assumptions,
    detailNote: t('dqe.export.detailNote'),
  }
}

/** Lignes d'en-tête : projet, espace, date des prix (D23-8), versions, date de l'export, devise. */
function infoRows(context: EstimateExportContext, t: Translate): [string, string][] {
  const { library, version } = context
  return [
    [t('dqe.export.info.project'), context.projectName],
    [t('dqe.export.info.workspace'), context.workspaceName],
    [t('dqe.export.info.priceDate'), library.priceDate ? formatIsoDay(library.priceDate) : t('pricing.noDate')],
    [t('dqe.export.info.library'), t('dqe.export.info.libraryValue', { version: library.version })],
    [
      t('dqe.export.info.estimate'),
      version
        ? t('dqe.export.info.estimateVersion', { number: version.number, status: t(`dqe.status.${version.status}`) })
        : t('dqe.export.info.estimateLive'),
    ],
    [t('dqe.export.info.date'), formatDate(context.now)],
    [t('dqe.export.info.currency'), t('dqe.export.info.currencyValue')],
  ]
}

/** Exporte le DQE affiché en XLSX ou en PDF (admins de l'espace, D23-8). Mêmes montants qu'à l'écran. */
export async function exportEstimate(format: 'xlsx' | 'pdf', estimate: Estimate, context: EstimateExportContext, t: Translate) {
  const info = infoRows(context, t)
  const labels = tableLabels(estimate, t)
  const tables = buildEstimateTables(estimate, labels)
  const name = `${t('dqe.export.fileName')}-${context.projectName}`
  if (format === 'xlsx') {
    const { buildMetresXlsx } = await import('../../features/export/metresXlsx')
    const bytes = buildMetresXlsx(tables, { title: t('dqe.export.documentTitle'), rows: info }, context.now.toISOString().replace(/\.\d+Z$/, 'Z'))
    downloadBlob(
      new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      exportFileName(name, 'xlsx', t('dqe.export.fileName')),
    )
    return
  }
  // L'en-tête du PDF reprend les informations du classeur, en tête du tableau des hypothèses.
  const withInfo = tables.map((table) =>
    table.id === 'dqe-assumptions' ? { ...table, rows: [...info.map(([a, b]) => [a, b]), ...table.rows] } : table,
  )
  const priceDate = context.library.priceDate ? formatIsoDay(context.library.priceDate) : t('pricing.noDate')
  const blob = await buildMetresPdf(withInfo, sheetSize('a4', 'portrait'), {
    title: t('dqe.export.documentTitle'),
    units: t('dqe.export.units'),
    note: t('dqe.export.note'),
    continued: fr.measurements.pdf.continued,
    cartouche: {
      projectName: context.projectName,
      subtitle: t('dqe.export.cartoucheSubtitle', { date: priceDate }),
      dateLabel: fr.measurements.pdf.dateLabel,
      date: formatDate(context.now),
      sheetLabel: fr.measurements.pdf.sheetLabel,
      sheet: 'A4',
      pageLabel: fr.measurements.pdf.pageLabel,
    },
  })
  downloadBlob(blob, exportFileName(name, 'pdf', t('dqe.export.fileName')))
}
