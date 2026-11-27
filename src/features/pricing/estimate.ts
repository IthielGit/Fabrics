/**
 * Calcul du DQE (M23, 23.4). Décisions D23-3, D23-5, D23-10, D23-13, D23-17 et D23-19
 * (`docs/phases/M23-decisions.md`). Tout est exact : entiers (`bigint`), aucun nombre à virgule
 * flottante dans un prix ou un montant. Ordre des arrondis :
 *
 * 1. quantité d'un poste = somme des quantités du métré (perte comprise), convertie dans l'unité du
 *    poste, arrondie au plus proche : 2 décimales (m², ml, m), 3 (m³), entier (U, FFT…) ;
 * 2. prix de vente = prix brut × (1 + A1)(1 + A2)(1 + A3), au dixième d'Ar le plus proche ;
 * 3. montant = quantité arrondie × prix de vente, à la centaine d'Ar supérieure ;
 * 4. total HT = somme des montants ; TVA = total HT × taux, à la centaine supérieure ; TTC = HT + TVA.
 */
import type { QuantityDimension } from '../measurements/quantities/types'
import type { QuantityStatus } from '../measurements/quantities/status'
import type { WorkItem } from './model'
import { divRoundHalfUp, parseDecimal, type BasisPoints, type Tenths } from './money'
import type { MatchedLine, MatchWarning } from './rules'
import { normalizeUnit } from './units'

/** Paramètres de chiffrage d'un devis (D23-13 : réglés dans chaque devis). */
export interface EstimateSettings {
  /** Frais généraux (A1), bénéfice et aléas (A2), frais proportionnels (A3), en points de base. */
  a1Bp: BasisPoints
  a2Bp: BasisPoints
  a3Bp: BasisPoints
  vatRateBp: BasisPoints
}

/** Valeurs du classeur, proposées comme exemple (D23-3). */
export const EXAMPLE_SETTINGS: Omit<EstimateSettings, 'vatRateBp'> = { a1Bp: 500, a2Bp: 500, a3Bp: 0 }

/** Une source d'une ligne : quantité du métré, règle ou correction, perte. */
export interface EstimateSource {
  quantityKey: string
  elementIds: string[]
  ruleId: string | null
  overrideId: string | null
  wasteBp: number
  /** Valeur du métré dans l'unité de base (mm, mm², mm³, nombre), arrondie à l'unité de base. */
  baseValue: bigint
  status: QuantityStatus
}

export interface EstimateLine {
  workItemId: string
  code: string
  designation: string
  category: string
  unit: string
  /** Quantité dans l'unité du poste, en entier × 10^quantityDecimals. */
  quantity: bigint
  quantityDecimals: number
  /** Prix brut (débours sec HT) ; `null` : poste sans prix. */
  unitPriceHt: Tenths | null
  /** Prix unitaire de vente HT (brut × K1). */
  salePriceHt: Tenths | null
  /** Montant HT, arrondi à la centaine d'Ar supérieure ; `null` : sans prix. */
  amountHt: Tenths | null
  /** Débours sec de la ligne (quantité × prix brut, à la centaine supérieure). */
  debours: Tenths | null
  /** Vrai si une quantité source n'est pas validée (montant provisoire). */
  provisional: boolean
  sources: EstimateSource[]
}

export interface EstimateLot {
  /** Catégorie du poste dans la bibliothèque (ex. « Maçonnerie »). */
  category: string
  lines: EstimateLine[]
  subtotalHt: Tenths
}

export interface Estimate {
  lots: EstimateLot[]
  totalHt: Tenths
  vat: Tenths
  totalTtc: Tenths
  debours: Tenths
  /** Frais généraux, bénéfice et aléas = total HT − débours sec. */
  overheadAndMargin: Tenths
  /** K1 en millionièmes (1102500 = 1,1025). */
  k1Millionths: bigint
  settings: EstimateSettings
  /** Lignes sans prix : le devis ne peut pas être marqué définitif (gate G6). */
  linesWithoutPrice: number
  provisionalLines: number
  uncoveredElementIds: string[]
  warnings: MatchWarning[]
}

const BASE_FACTOR: Record<QuantityDimension, bigint> = {
  area: 1_000_000n, // mm² → m²
  volume: 1_000_000_000n, // mm³ → m³
  length: 1_000n, // mm → ml ou m
  count: 1n,
}

/** Décimales de la quantité d'un poste, selon son unité (D23-19). */
export function quantityDecimals(unit: string): number {
  const u = normalizeUnit(unit).unit
  if (u === 'm³') return 3
  if (u === 'm²' || u === 'ml' || u === 'm') return 2
  return 0
}

/** Valeur du métré (nombre JavaScript, unité de base) en entier, sans calcul flottant. */
function toBaseInteger(value: number): bigint {
  const parsed = parseDecimal(String(value), 0)
  if (parsed === null || parsed < 0n) return 0n
  return parsed
}

function ceilDiv(numerator: bigint, denominator: bigint): bigint {
  if (numerator <= 0n) return 0n
  return (numerator + denominator - 1n) / denominator
}

/** Montant arrondi à la centaine d'Ar supérieure de (quantité × 10^-d) × prix, sans arrondi intermédiaire. */
export function lineAmount(quantity: bigint, decimals: number, price: Tenths): Tenths {
  return ceilDiv(quantity * price, 10n ** BigInt(decimals) * 1000n) * 1000n
}

/** K1 = (1 + A1)(1 + A2)(1 + A3), en millionièmes exacts arrondis (affichage). */
export function k1Millionths(settings: Pick<EstimateSettings, 'a1Bp' | 'a2Bp' | 'a3Bp'>): bigint {
  const product = BigInt(10000 + settings.a1Bp) * BigInt(10000 + settings.a2Bp) * BigInt(10000 + settings.a3Bp)
  return divRoundHalfUp(product, 1_000_000n)
}

/** Prix de vente = prix brut × K1, au dixième d'Ar le plus proche. */
export function salePrice(priceHt: Tenths, settings: Pick<EstimateSettings, 'a1Bp' | 'a2Bp' | 'a3Bp'>): Tenths {
  const product = BigInt(10000 + settings.a1Bp) * BigInt(10000 + settings.a2Bp) * BigInt(10000 + settings.a3Bp)
  return divRoundHalfUp(priceHt * product, 1_000_000_000_000n)
}

/** TVA d'un total HT, à la centaine d'Ar supérieure. */
export function vatOf(totalHt: Tenths, vatRateBp: BasisPoints): Tenths {
  return ceilDiv(totalHt * BigInt(vatRateBp), 10000n * 1000n) * 1000n
}

export function computeEstimate(input: {
  lines: readonly MatchedLine[]
  workItems: ReadonlyMap<string, WorkItem>
  settings: EstimateSettings
  uncoveredElementIds?: readonly string[]
  warnings?: readonly MatchWarning[]
}): Estimate {
  const { settings } = input
  // Regroupement par poste, dans l'ordre de première apparition.
  const byWork = new Map<string, MatchedLine[]>()
  for (const line of input.lines) {
    const list = byWork.get(line.workItemId)
    if (list) list.push(line)
    else byWork.set(line.workItemId, [line])
  }
  const estimateLines: EstimateLine[] = []
  for (const [workItemId, lines] of byWork) {
    const work = input.workItems.get(workItemId)
    if (!work) continue
    const decimals = quantityDecimals(work.unit)
    const dimension = lines[0].dimension
    // Somme exacte : chaque valeur de base × (10000 + perte), puis une seule conversion arrondie.
    let scaled = 0n
    const sources: EstimateSource[] = lines.map((line) => {
      const baseValue = toBaseInteger(line.value)
      scaled += baseValue * BigInt(10000 + line.wasteBp)
      return {
        quantityKey: line.quantityKey,
        elementIds: line.elementIds,
        ruleId: line.ruleId,
        overrideId: line.overrideId,
        wasteBp: line.wasteBp,
        baseValue,
        status: line.status,
      }
    })
    const quantity = divRoundHalfUp(scaled * 10n ** BigInt(decimals), BASE_FACTOR[dimension] * 10000n)
    const price = work.priceHt
    const sale = price === null ? null : salePrice(price, settings)
    estimateLines.push({
      workItemId,
      code: work.code,
      designation: work.designation,
      category: work.category,
      unit: normalizeUnit(work.unit).unit,
      quantity,
      quantityDecimals: decimals,
      unitPriceHt: price,
      salePriceHt: sale,
      amountHt: sale === null ? null : lineAmount(quantity, decimals, sale),
      debours: price === null ? null : lineAmount(quantity, decimals, price),
      provisional: lines.some((line) => line.status !== 'validated'),
      sources,
    })
  }
  estimateLines.sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true }) || a.designation.localeCompare(b.designation, 'fr'))

  const lots = new Map<string, EstimateLot>()
  for (const line of estimateLines) {
    const key = line.category || '—'
    let lot = lots.get(key)
    if (!lot) lots.set(key, (lot = { category: key, lines: [], subtotalHt: 0n }))
    lot.lines.push(line)
    lot.subtotalHt += line.amountHt ?? 0n
  }
  const totalHt = estimateLines.reduce((sum, line) => sum + (line.amountHt ?? 0n), 0n)
  const debours = estimateLines.reduce((sum, line) => sum + (line.debours ?? 0n), 0n)
  const vat = vatOf(totalHt, settings.vatRateBp)
  return {
    lots: [...lots.values()],
    totalHt,
    vat,
    totalTtc: totalHt + vat,
    debours,
    overheadAndMargin: totalHt - debours,
    k1Millionths: k1Millionths(settings),
    settings,
    linesWithoutPrice: estimateLines.filter((line) => line.unitPriceHt === null).length,
    provisionalLines: estimateLines.filter((line) => line.provisional).length,
    uncoveredElementIds: [...(input.uncoveredElementIds ?? [])],
    warnings: [...(input.warnings ?? [])],
  }
}

/** Quantité affichée : « 13,11 », « 2,500 », « 3 ». */
export function formatQuantity(quantity: bigint, decimals: number): string {
  if (decimals === 0) return quantity.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  const text = quantity.toString().padStart(decimals + 1, '0')
  const whole = text.slice(0, -decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${whole},${text.slice(-decimals)}`
}

/** K1 affiché : 1102500n → « 1,1025 ». */
export function formatK1(millionths: bigint): string {
  const text = millionths.toString().padStart(7, '0')
  const fraction = text.slice(-6).replace(/0+$/, '')
  return fraction ? `${text.slice(0, -6)},${fraction}` : text.slice(0, -6)
}
