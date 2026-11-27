/**
 * Plan d'un import (M23, 23.2) : ce qu'un import change dans la bibliothèque, calculé avant de
 * l'appliquer et montré à l'admin.
 *
 * - Une ligne est reconnue par sa clé d'import (`sourceKey`) : un réimport met à jour la même ligne,
 *   son historique garde l'ancien prix.
 * - Une ligne saisie à la main (clé vide) n'est jamais modifiée ni retirée par un import.
 * - Une ligne importée absente du nouveau fichier est retirée, seulement si elle vient de la même
 *   source (« MTX », « MTL », « MO », « TRAV » ou « CSV ») : un CSV de matériaux ne retire pas les
 *   postes du classeur, une feuille absente ne vide pas sa partie de la bibliothèque.
 */
import type { ImportedLibrary } from './importWorkbook'
import type { PriceItem, PriceItemFields, WorkItem, WorkItemFields } from './model'

export interface TablePlan<F> {
  insert: F[]
  update: { id: string; fields: F }[]
  remove: string[]
  unchanged: number
}

export interface ImportPlan {
  price: TablePlan<PriceItemFields>
  work: TablePlan<WorkItemFields>
  /** Lignes saisies à la main, gardées telles quelles. */
  keptManual: number
  /** Prix changés (ancien → nouveau), pour l'aperçu. */
  priceChanges: number
}

function family(sourceKey: string): string {
  return sourceKey.split(':', 1)[0]
}

/** Comparaison stable (les `bigint` passent en texte). */
function same(a: unknown, b: unknown): boolean {
  const text = (value: unknown) => JSON.stringify(value, (_, v: unknown) => (typeof v === 'bigint' ? `${v}n` : v))
  return text(a) === text(b)
}

const PRICE_FIELDS: readonly (keyof PriceItemFields)[] = [
  'kind',
  'code',
  'category',
  'designation',
  'unit',
  'sourceBasis',
  'sourcePrice',
  'vatExempt',
  'priceHt',
  'supplier',
  'region',
  'effectiveDate',
  'details',
  'sourceRow',
  'sourceKey',
]

const WORK_FIELDS: readonly (keyof WorkItemFields)[] = [
  'code',
  'category',
  'designation',
  'unit',
  'priceHt',
  'referencePrice',
  'sourceCoefficient',
  'output',
  'components',
  'sourceRow',
  'sourceKey',
]

function planTable<F extends { sourceKey: string; priceHt: bigint | null }, E extends F & { id: string }>(
  existing: readonly E[],
  incoming: readonly F[],
  fields: readonly (keyof F)[],
): { plan: TablePlan<F>; keptManual: number; priceChanges: number } {
  const families = new Set(incoming.map((item) => family(item.sourceKey)))
  const byKey = new Map<string, E>()
  let keptManual = 0
  for (const item of existing) {
    if (item.sourceKey === '') keptManual++
    else byKey.set(item.sourceKey, item)
  }
  const plan: TablePlan<F> = { insert: [], update: [], remove: [], unchanged: 0 }
  let priceChanges = 0
  const seen = new Set<string>()
  for (const item of incoming) {
    seen.add(item.sourceKey)
    const current = byKey.get(item.sourceKey)
    if (!current) {
      plan.insert.push(item)
      continue
    }
    if (fields.every((field) => same(current[field], item[field]))) {
      plan.unchanged++
      continue
    }
    if (current.priceHt !== item.priceHt) priceChanges++
    plan.update.push({ id: current.id, fields: item })
  }
  for (const [key, item] of byKey) {
    if (!seen.has(key) && families.has(family(key))) plan.remove.push(item.id)
  }
  return { plan, keptManual, priceChanges }
}

export function planImport(
  existing: { priceItems: readonly PriceItem[]; workItems: readonly WorkItem[] },
  incoming: Pick<ImportedLibrary, 'priceItems' | 'workItems'>,
): ImportPlan {
  const price = planTable(existing.priceItems, incoming.priceItems, PRICE_FIELDS)
  const work = planTable(existing.workItems, incoming.workItems, WORK_FIELDS)
  return {
    price: price.plan,
    work: work.plan,
    keptManual: price.keptManual + work.keptManual,
    priceChanges: price.priceChanges + work.priceChanges,
  }
}

/** Vrai si l'import ne change rien. */
export function isEmptyPlan(plan: ImportPlan): boolean {
  return [plan.price, plan.work].every((t) => t.insert.length === 0 && t.update.length === 0 && t.remove.length === 0)
}

/** Résumé chiffré gardé avec l'import (table des imports). */
export interface ImportSummary {
  added: number
  updated: number
  removed: number
  unchanged: number
  keptManual: number
  priceChanges: number
  warnings: number
}

export function summarizePlan(plan: ImportPlan, warnings: number): ImportSummary {
  return {
    added: plan.price.insert.length + plan.work.insert.length,
    updated: plan.price.update.length + plan.work.update.length,
    removed: plan.price.remove.length + plan.work.remove.length,
    unchanged: plan.price.unchanged + plan.work.unchanged,
    keptManual: plan.keptManual,
    priceChanges: plan.priceChanges,
    warnings,
  }
}
