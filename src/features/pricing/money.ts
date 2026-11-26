/**
 * Montants exacts du DQE (M23, D23-1, D23-5, D23-10).
 *
 * Tout prix et tout montant est un entier `bigint` en **dixièmes d'Ariary** : 45 000,0 Ar → 450000n.
 * Aucun nombre à virgule flottante ne sert à calculer un prix. Règles d'arrondi, en un seul endroit :
 * - prix unitaire : au dixième d'Ar le plus proche, la moitié vers le haut (`parseDecimal`, `htFromTtc`) ;
 * - montant d'une ligne : à la centaine d'Ar supérieure (`roundUpToHundredAr`) ; un total est la somme
 *   des lignes déjà arrondies.
 */

/** Prix ou montant en dixièmes d'Ariary. */
export type Tenths = bigint

/** Taux en points de base : 2000 = 20,00 %. */
export type BasisPoints = number

/** TVA de Madagascar, valeur de départ du réglage (D23-6). */
export const DEFAULT_VAT_BP: BasisPoints = 2000

const DECIMAL = /^([+-])?(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/

function pow10(n: number): bigint {
  return 10n ** BigInt(n)
}

/** Division entière arrondie à l'entier le plus proche, la moitié en s'éloignant de zéro. */
export function divRoundHalfUp(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= 0n) throw new RangeError('denominator must be positive')
  const negative = numerator < 0n
  const abs = negative ? -numerator : numerator
  const q = (2n * abs + denominator) / (2n * denominator)
  return negative ? -q : q
}

/**
 * Lit un nombre décimal écrit en texte (`"208333.33333333334"`, `"3.76E-5"`, `"-12"`) et le rend
 * en entier à `decimals` chiffres après la virgule (arrondi au plus proche, moitié vers le haut).
 * Le calcul se fait sur le texte : aucune erreur de virgule flottante. `null` si ce n'est pas un nombre.
 */
export function parseDecimal(text: string, decimals: number): bigint | null {
  const match = DECIMAL.exec(text.trim())
  if (!match) return null
  const [, sign, intPart = '', fracPart = '', expText] = match
  if (intPart === '' && fracPart === '') return null
  const digits = BigInt(`${intPart}${fracPart}` || '0')
  const exponent = expText ? Number(expText) : 0
  if (!Number.isSafeInteger(exponent) || Math.abs(exponent) > 400) return null
  // valeur = digits × 10^(exponent − fracPart.length) ; on la veut × 10^decimals.
  const shift = decimals + exponent - fracPart.length
  const scaled = shift >= 0 ? digits * pow10(shift) : divRoundHalfUp(digits, pow10(-shift))
  return sign === '-' ? -scaled : scaled
}

/**
 * Convertit un nombre JavaScript venant d'un fichier (cellule de tableur) en dixièmes, sans passer par
 * un calcul flottant : on part de son écriture décimale la plus courte (`String(n)`).
 */
export function numberToTenths(value: number): Tenths {
  if (!Number.isFinite(value)) throw new RangeError('not a finite number')
  const parsed = parseDecimal(String(value), 1)
  if (parsed === null) throw new RangeError('not a decimal number')
  return parsed
}

export type MoneyInputError = 'empty' | 'notANumber' | 'tooManyDecimals' | 'negative'

/**
 * Lit un prix saisi par l'utilisateur : « 45000 », « 45 000,5 », « 45000.5 Ar ». Au plus une décimale
 * (D23-5) : une saisie plus précise est refusée, jamais arrondie en silence.
 */
export function parseMoneyInput(text: string): { ok: true; value: Tenths } | { ok: false; error: MoneyInputError } {
  const cleaned = text
    .replace(/ar$/i, '')
    .replace(/[\s  ]/g, '')
    .replace(',', '.')
  if (cleaned === '') return { ok: false, error: 'empty' }
  if (!/^-?\d+(\.\d*)?$/.test(cleaned)) return { ok: false, error: 'notANumber' }
  const fraction = cleaned.split('.')[1] ?? ''
  if (fraction.length > 1) return { ok: false, error: 'tooManyDecimals' }
  const value = parseDecimal(cleaned, 1)
  if (value === null) return { ok: false, error: 'notANumber' }
  if (value < 0n) return { ok: false, error: 'negative' }
  return { ok: true, value }
}

const GROUP = ' '

function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, GROUP)
}

/**
 * Affiche un montant : « 45 000,0 Ar » (prix unitaire, une décimale) ou « 590 000 Ar » (`decimals: 0`,
 * pour un montant déjà arrondi à la centaine). Avec `decimals: 0`, le dixième doit être nul.
 */
export function formatAriary(value: Tenths, options: { decimals?: 0 | 1; unit?: boolean } = {}): string {
  const decimals = options.decimals ?? 1
  const negative = value < 0n
  const abs = negative ? -value : value
  const whole = groupThousands((abs / 10n).toString())
  const tenth = (abs % 10n).toString()
  if (decimals === 0 && tenth !== '0') throw new RangeError('amount has a tenth: use decimals 1')
  const text = `${negative ? '−' : ''}${whole}${decimals === 1 ? `,${tenth}` : ''}`
  return options.unit === false ? text : `${text}${GROUP}Ar`
}

/** Montant d'une ligne arrondi à la centaine d'Ariary supérieure (D23-5) : 153 555 Ar → 153 600 Ar. */
export function roundUpToHundredAr(value: Tenths): Tenths {
  if (value < 0n) throw new RangeError('amount must not be negative')
  const step = 1000n // 100 Ar = 1000 dixièmes
  const rest = value % step
  return rest === 0n ? value : value - rest + step
}

/** Prix HT tiré d'un prix TTC (D23-10) : TTC ÷ (1 + taux), au dixième le plus proche. */
export function htFromTtc(ttc: Tenths, vatBp: BasisPoints): Tenths {
  if (!Number.isInteger(vatBp) || vatBp < 0) throw new RangeError('invalid VAT rate')
  return divRoundHalfUp(ttc * 10000n, BigInt(10000 + vatBp))
}

/** Affiche un taux en points de base : 2000 → « 20 % », 525 → « 5,25 % ». */
export function formatRate(bp: BasisPoints): string {
  const whole = Math.trunc(bp / 100)
  const rest = bp % 100
  return `${whole}${rest === 0 ? '' : `,${String(rest).padStart(2, '0').replace(/0$/, '')}`}${GROUP}%`
}

/** Lit un taux saisi (« 20 », « 5,25 », « 5,25 % ») en points de base ; `null` si invalide. */
export function parseRateInput(text: string): BasisPoints | null {
  const cleaned = text.replace(/%/g, '').replace(/[\s  ]/g, '').replace(',', '.')
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null
  const value = parseDecimal(cleaned, 2)
  if (value === null || value > 100000n) return null
  return Number(value)
}

/** Sérialisation pour la base et le stockage (les `bigint` passent en texte). */
export function tenthsToText(value: Tenths | null): string | null {
  return value === null ? null : value.toString()
}

/** Relit un montant stocké (texte ou entier sûr) ; `null` reste `null`. */
export function tenthsFromStored(value: unknown): Tenths | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'bigint') return value
  if (typeof value === 'number' && Number.isSafeInteger(value)) return BigInt(value)
  if (typeof value === 'string' && /^-?\d+$/.test(value)) return BigInt(value)
  throw new RangeError(`invalid stored amount: ${String(value)}`)
}
