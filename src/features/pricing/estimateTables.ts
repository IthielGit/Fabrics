/**
 * Tableaux du DQE pour les exports XLSX et PDF (M23, 23.7). Les montants viennent tels quels du calcul
 * (`estimate.ts`) : aucun recalcul ici, donc mêmes totaux à l'écran, en XLSX et en PDF (gate G6).
 * Les tableaux réutilisent le format des métrés (`MetresTable`) et leurs exportateurs.
 */
import type { MetresCell, MetresColumn, MetresNumber, MetresTable } from '../measurements/tables'
import { formatK1, formatQuantity, type Estimate, type EstimateLine } from './estimate'
import { formatAriary, formatRate, type Tenths } from './money'

export interface EstimateTableLabels {
  summaryTitle: string
  totalsTitle: string
  /** Colonne d'un tableau qui mêle HT, TVA et TTC. */
  amountAny: string
  detailTitle: string
  breakdownTitle: string
  assumptionsTitle: string
  lot: string
  code: string
  designation: string
  unit: string
  quantity: string
  salePrice: string
  amount: string
  label: string
  value: string
  totalHt: string
  vat: (rate: string) => string
  totalTtc: string
  debours: string
  overheadMargin: string
  noPrice: string
  provisional: string
  /** Lignes « hypothèse ; détail » (K1, TVA, arrondis, prix en HT…). */
  assumptions: [string, string][]
  /** Note sous le tableau de détail. */
  detailNote: string
}

const left = (header: string): MetresColumn => ({ header, align: 'left' })
const right = (header: string): MetresColumn => ({ header, align: 'right' })

/** Montant en Ariary entiers (déjà arrondi à la centaine). */
export function moneyCell(value: Tenths): MetresNumber {
  return { text: formatAriary(value, { decimals: 0, unit: false }), value: Number(value / 10n), unit: 'ar' }
}

/** Prix unitaire à une décimale. */
export function priceCell(value: Tenths): MetresNumber {
  return { text: formatAriary(value, { unit: false }), value: Number(value) / 10, unit: 'ar1' }
}

function quantityCell(line: EstimateLine): MetresNumber {
  const value = Number(line.quantity) / 10 ** line.quantityDecimals
  const unit = line.quantityDecimals === 3 ? 'm3p' : line.quantityDecimals === 2 ? 'm2' : 'count'
  return { text: formatQuantity(line.quantity, line.quantityDecimals), value, unit }
}

export function buildEstimateTables(estimate: Estimate, labels: EstimateTableLabels): MetresTable[] {
  const summary: MetresTable = {
    id: 'dqe-summary',
    title: labels.summaryTitle,
    columns: [left(labels.lot), right(labels.amount)],
    rows: estimate.lots.map((lot) => [lot.category, moneyCell(lot.subtotalHt)]),
    total: [labels.totalHt, moneyCell(estimate.totalHt)],
  }
  const totals: MetresTable = {
    id: 'dqe-totals',
    title: labels.totalsTitle,
    columns: [left(labels.label), right(labels.amountAny)],
    rows: [
      [labels.totalHt, moneyCell(estimate.totalHt)],
      [labels.vat(formatRate(estimate.settings.vatRateBp)), moneyCell(estimate.vat)],
      [labels.totalTtc, moneyCell(estimate.totalTtc)],
    ],
  }
  const detailRows: MetresCell[][] = estimate.lots.flatMap((lot) =>
    lot.lines.map((line): MetresCell[] => [
      lot.category,
      line.code,
      line.provisional ? `${line.designation} (${labels.provisional})` : line.designation,
      line.unit,
      quantityCell(line),
      line.salePriceHt === null ? labels.noPrice : priceCell(line.salePriceHt),
      line.amountHt === null ? labels.noPrice : moneyCell(line.amountHt),
    ]),
  )
  const detail: MetresTable = {
    id: 'dqe-detail',
    title: labels.detailTitle,
    note: labels.detailNote,
    columns: [
      left(labels.lot),
      left(labels.code),
      left(labels.designation),
      left(labels.unit),
      right(labels.quantity),
      right(labels.salePrice),
      right(labels.amount),
    ],
    rows: detailRows,
    total: [labels.totalHt, '', '', '', '', '', moneyCell(estimate.totalHt)],
  }
  const breakdown: MetresTable = {
    id: 'dqe-breakdown',
    title: labels.breakdownTitle,
    columns: [left(labels.label), right(labels.amount)],
    rows: [
      [labels.debours, moneyCell(estimate.debours)],
      [`${labels.overheadMargin} (K1 = ${formatK1(estimate.k1Millionths)})`, moneyCell(estimate.overheadAndMargin)],
    ],
    total: [labels.totalHt, moneyCell(estimate.totalHt)],
  }
  const assumptions: MetresTable = {
    id: 'dqe-assumptions',
    title: labels.assumptionsTitle,
    columns: [left(labels.label), left(labels.value)],
    rows: labels.assumptions.map(([a, b]) => [a, b]),
  }
  return [summary, totals, detail, breakdown, assumptions]
}
