/**
 * Tableau « Quantitatif » (M21, 21.3) : chaque quantité de métré avec ses sources, ses dimensions, sa
 * formule, ses déductions, sa règle et sa version (D21-8). Même modèle de tableau que les autres
 * métrés (`MetresTable`) : il part dans le CSV, l'Excel et le PDF de la version Exécution.
 * Fonction pure ; les textes viennent de `src/i18n/fr.ts`.
 */
import { formatDecimal, mm2ToM2, mm3ToM3 } from '../../units/format'
import { ncount, nm2, nmm, type MetresCell, type MetresNumber, type MetresTable } from '../tables'
import type { TraceInput, TraceInputName, TracedQuantity } from './trace'
import type { QuantityCode, QuantityDimension } from './types'

export interface QuantityLabels {
  title: string
  note: string
  columns: {
    level: string
    element: string
    quantity: string
    value: string
    unit: string
    rule: string
    version: string
    sources: string
    inputs: string
    formula: string
    deductions: string
  }
  codes: Record<QuantityCode, string>
  formulas: Record<QuantityCode, string>
  inputs: Record<TraceInputName, string>
  units: Record<QuantityDimension, string>
  /** Ouverture gardée sous le seuil (non déduite). */
  belowThreshold: string
  union: string
  levelSlab: (levelName: string) => string
  thresholdText: (category: string, m2: string) => string
  thresholdCategories: Record<string, string>
}

/** Volume au millième de m³ (D21-6) ; valeur exacte gardée pour Excel. */
export const nm3p = (value: number): MetresNumber => ({ text: formatDecimal(mm3ToM3(value), 3), value: mm3ToM3(value), unit: 'm3p' })

export function quantityCell(value: number, dimension: QuantityDimension): MetresNumber {
  switch (dimension) {
    case 'length':
      return nmm(value)
    case 'area':
      return nm2(value)
    case 'volume':
      return nm3p(value)
    default:
      return ncount(value)
  }
}

/** Valeur en texte avec son unité (mm entiers, m² à 2 décimales, m³ à 3, degrés à 1). */
export function valueText(value: number, dimension: QuantityDimension | 'angle', labels: Pick<QuantityLabels, 'units'>): string {
  switch (dimension) {
    case 'length':
      return `${formatDecimal(value, 0)} mm`
    case 'area':
      return `${formatDecimal(mm2ToM2(value))} m²`
    case 'volume':
      return `${formatDecimal(mm3ToM3(value), 3)} m³`
    case 'angle':
      return `${formatDecimal(value, 1)}°`
    default:
      return `${formatDecimal(value, 0)} ${labels.units.count}`.trim()
  }
}

export function inputsText(inputs: readonly TraceInput[], labels: Pick<QuantityLabels, 'inputs' | 'units'>): string {
  return inputs.map((input) => `${labels.inputs[input.name]} ${valueText(input.value, input.dimension, labels)}`).join(' ; ')
}

export function deductionsText(q: TracedQuantity, labels: QuantityLabels): string {
  const parts = q.trace.deductions.map((d) => {
    const text = `${d.name} ${valueText(d.value, d.dimension, labels)}`
    return d.deducted ? text : `${text} (${labels.belowThreshold})`
  })
  if (q.trace.union) parts.push(labels.union)
  return parts.join(' ; ')
}

export function ruleText(q: TracedQuantity, labels: QuantityLabels): string {
  const threshold = q.rule.threshold
  return threshold
    ? `${q.rule.id} (${labels.thresholdText(labels.thresholdCategories[threshold.category] ?? threshold.category, formatDecimal(mm2ToM2(threshold.value)))})`
    : q.rule.id
}

/** Nom de l'élément d'une quantité (première source, ou « Dalle du niveau … »). */
export function elementName(q: TracedQuantity, labels: QuantityLabels, levelName: (id: string) => string): string {
  if (q.category === 'slab' && q.partId === 'levelSlab') return labels.levelSlab(levelName(q.elementIds[0]))
  const name = q.trace.sources[0]?.name ?? q.elementIds[0]
  return q.category === 'wallLayer' && q.partId ? `${name} – ${q.partId}` : name
}

/** Tableau des quantités de métré (famille `takeoff`), dans l'ordre du quantitatif. */
export function buildQuantityTable(
  list: readonly TracedQuantity[],
  labels: QuantityLabels,
  levelName: (id: string) => string,
): MetresTable {
  const c = labels.columns
  const rows: MetresCell[][] = list
    .filter((q) => q.family === 'takeoff')
    .map((q) => [
      q.levelId ? levelName(q.levelId) : '',
      elementName(q, labels, levelName),
      labels.codes[q.code],
      quantityCell(q.value, q.dimension),
      labels.units[q.dimension],
      ruleText(q, labels),
      q.rule.version,
      q.trace.sources.map((s) => s.name).join(', '),
      inputsText(q.trace.inputs, labels),
      labels.formulas[q.code],
      deductionsText(q, labels),
    ])
  return {
    id: 'quantities',
    title: labels.title,
    note: labels.note,
    columns: [
      { header: c.level, align: 'left' },
      { header: c.element, align: 'left' },
      { header: c.quantity, align: 'left' },
      { header: c.value, align: 'right' },
      { header: c.unit, align: 'left' },
      { header: c.rule, align: 'left' },
      { header: c.version, align: 'left' },
      { header: c.sources, align: 'left' },
      { header: c.inputs, align: 'left' },
      { header: c.formula, align: 'left' },
      { header: c.deductions, align: 'left' },
    ],
    rows,
  }
}
