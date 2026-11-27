/**
 * Versions du devis (M23, 23.5).
 *
 * - Un devis figé garde une **copie** de chaque ligne (quantité, prix brut, prix de vente, montant,
 *   sources) et ses totaux : changer un prix ou le plan ensuite ne le modifie jamais.
 * - Son **empreinte** résume ce qui l'a produit (quantités du métré, prix des postes, règles,
 *   corrections, paramètres) : même révision + même bordereau = même empreinte = même DQE.
 * - Deux versions se comparent ligne à ligne (poste ajouté, retiré, quantité ou prix changé).
 * - Un devis ne peut être **définitif** que si aucun poste n'est sans prix (gate G6).
 */
import type { Estimate, EstimateLine, EstimateSettings } from './estimate'
import type { Tenths } from './money'
import type { QuantityOverride } from './rules'

export type EstimateStatus = 'draft' | 'final'

/** Ligne figée (montants en texte : JSON sans perte). */
export interface FrozenLine {
  workItemId: string
  code: string
  designation: string
  category: string
  unit: string
  quantity: string
  quantityDecimals: number
  unitPriceHt: string | null
  salePriceHt: string | null
  amountHt: string | null
  provisional: boolean
  sources: { quantityKey: string; elementIds: string[]; ruleId: string | null; overrideId: string | null; wasteBp: number }[]
}

export interface FrozenEstimate {
  lines: FrozenLine[]
  totalHt: string
  vat: string
  totalTtc: string
  debours: string
  settings: EstimateSettings
  linesWithoutPrice: number
  provisionalLines: number
}

export interface EstimateVersion {
  id: string
  number: number
  status: EstimateStatus
  /** Version de la bibliothèque de prix au moment du gel. */
  libraryVersion: number
  fingerprint: string
  snapshot: FrozenEstimate
  createdByEmail: string
  createdAt: string
  note: string
}

const text = (value: Tenths | null) => (value === null ? null : value.toString())

export function freezeEstimate(estimate: Estimate): FrozenEstimate {
  const lines = estimate.lots.flatMap((lot) => lot.lines).map(
    (line: EstimateLine): FrozenLine => ({
      workItemId: line.workItemId,
      code: line.code,
      designation: line.designation,
      category: line.category,
      unit: line.unit,
      quantity: line.quantity.toString(),
      quantityDecimals: line.quantityDecimals,
      unitPriceHt: text(line.unitPriceHt),
      salePriceHt: text(line.salePriceHt),
      amountHt: text(line.amountHt),
      provisional: line.provisional,
      sources: line.sources.map((s) => ({
        quantityKey: s.quantityKey,
        elementIds: s.elementIds,
        ruleId: s.ruleId,
        overrideId: s.overrideId,
        wasteBp: s.wasteBp,
      })),
    }),
  )
  return {
    lines,
    totalHt: estimate.totalHt.toString(),
    vat: estimate.vat.toString(),
    totalTtc: estimate.totalTtc.toString(),
    debours: estimate.debours.toString(),
    settings: estimate.settings,
    linesWithoutPrice: estimate.linesWithoutPrice,
    provisionalLines: estimate.provisionalLines,
  }
}

/** Le devis peut-il être marqué définitif ? Non s'il reste un poste sans prix (gate G6). */
export function canFinalize(estimate: Pick<FrozenEstimate, 'linesWithoutPrice' | 'lines'>): boolean {
  return estimate.lines.length > 0 && estimate.linesWithoutPrice === 0
}

/** JSON aux clés triées (empreinte stable quel que soit l'ordre des propriétés). */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return typeof value === 'bigint' ? JSON.stringify(`${value}n`) : JSON.stringify(value)
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(',')}}`
}

/** Ce qui détermine un DQE ; son empreinte SHA-256 identifie une révision du devis. */
export interface FingerprintInput {
  quantities: readonly { key: string; value: number; status?: string }[]
  workItems: readonly { id: string; unit: string; priceHt: Tenths | null }[]
  rules: readonly unknown[]
  overrides: readonly unknown[]
  settings: EstimateSettings
}

export function fingerprintSource(input: FingerprintInput): string {
  return canonicalJson({
    quantities: [...input.quantities].map((q) => [q.key, q.value, q.status ?? '']).sort((a, b) => (String(a[0]) < String(b[0]) ? -1 : 1)),
    workItems: [...input.workItems].map((w) => [w.id, w.unit, w.priceHt]).sort((a, b) => (String(a[0]) < String(b[0]) ? -1 : 1)),
    rules: input.rules,
    overrides: input.overrides,
    settings: input.settings,
  })
}

export type LineChange = 'added' | 'removed' | 'quantity' | 'price' | 'quantityAndPrice'

export interface LineDiff {
  workItemId: string
  code: string
  designation: string
  unit: string
  change: LineChange
  before: FrozenLine | null
  after: FrozenLine | null
  /** Écart de montant (après − avant), en dixièmes. */
  amountDelta: Tenths
}

export interface EstimateDiff {
  lines: LineDiff[]
  totalHtDelta: Tenths
  totalTtcDelta: Tenths
  unchanged: number
}

const amount = (line: FrozenLine | null) => (line?.amountHt ? BigInt(line.amountHt) : 0n)

/** Compare deux devis figés, poste par poste. */
export function diffEstimates(before: FrozenEstimate, after: FrozenEstimate): EstimateDiff {
  const old = new Map(before.lines.map((line) => [line.workItemId, line]))
  const next = new Map(after.lines.map((line) => [line.workItemId, line]))
  const lines: LineDiff[] = []
  let unchanged = 0
  for (const id of new Set([...old.keys(), ...next.keys()])) {
    const a = old.get(id) ?? null
    const b = next.get(id) ?? null
    let change: LineChange | null
    if (!a) change = 'added'
    else if (!b) change = 'removed'
    else {
      const quantity = a.quantity !== b.quantity || a.unit !== b.unit
      const price = a.salePriceHt !== b.salePriceHt
      change = quantity && price ? 'quantityAndPrice' : quantity ? 'quantity' : price ? 'price' : null
    }
    if (change === null) {
      unchanged++
      continue
    }
    const ref = (b ?? a)!
    lines.push({
      workItemId: id,
      code: ref.code,
      designation: ref.designation,
      unit: ref.unit,
      change,
      before: a,
      after: b,
      amountDelta: amount(b) - amount(a),
    })
  }
  lines.sort((x, y) => x.code.localeCompare(y.code, 'fr', { numeric: true }))
  return {
    lines,
    totalHtDelta: BigInt(after.totalHt) - BigInt(before.totalHt),
    totalTtcDelta: BigInt(after.totalTtc) - BigInt(before.totalTtc),
    unchanged,
  }
}

/** Devis d'un projet dans un espace : réglages de K1 (D23-13) et corrections à la main. */
export interface ProjectEstimateRecord {
  id: string
  libraryId: string
  projectId: string
  a1Bp: number
  a2Bp: number
  a3Bp: number
  overrides: QuantityOverride[]
  updatedByEmail: string
  updatedAt: string
}

export type ProjectEstimatePatch = Pick<ProjectEstimateRecord, 'a1Bp' | 'a2Bp' | 'a3Bp' | 'overrides'>

export interface FreezeInput {
  status: EstimateStatus
  libraryVersion: number
  fingerprint: string
  snapshot: FrozenEstimate
  note: string
}

/** Ce que voit une personne hors de l'espace (D23-8) : postes et quantités, aucun prix. */
export interface OutlineLine {
  code: string
  designation: string
  category: string
  unit: string
  quantity: string
  quantityDecimals: number
}

/** Erreur nommée : devis définitif refusé tant qu'un poste est sans prix. */
export class EstimateNotFinalError extends Error {
  constructor() {
    super('estimate has lines without price')
    this.name = 'EstimateNotFinalError'
  }
}
