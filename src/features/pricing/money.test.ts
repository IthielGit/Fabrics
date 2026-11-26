import { describe, expect, it } from 'vitest'
import {
  divRoundHalfUp,
  formatAriary,
  formatRate,
  htFromTtc,
  numberToTenths,
  parseDecimal,
  parseMoneyInput,
  parseRateInput,
  roundUpToHundredAr,
  tenthsFromStored,
} from './money'

describe('parseDecimal', () => {
  it('lit les écritures décimales et scientifiques sans erreur flottante', () => {
    expect(parseDecimal('208333.33333333334', 1)).toBe(2083333n)
    expect(parseDecimal('30416.666666666668', 1)).toBe(304167n)
    expect(parseDecimal('3.763520702415367e-05', 6)).toBe(38n)
    expect(parseDecimal('1.25', 1)).toBe(13n)
    expect(parseDecimal('-1.25', 1)).toBe(-13n)
    expect(parseDecimal('42000', 1)).toBe(420000n)
    expect(parseDecimal('.5', 1)).toBe(5n)
    expect(parseDecimal('1E3', 0)).toBe(1000n)
  })

  it('refuse ce qui n’est pas un nombre', () => {
    expect(parseDecimal('', 1)).toBeNull()
    expect(parseDecimal('abc', 1)).toBeNull()
    expect(parseDecimal('1,5', 1)).toBeNull()
    expect(parseDecimal('.', 1)).toBeNull()
  })
})

describe('numberToTenths', () => {
  it('part de l’écriture la plus courte du nombre', () => {
    expect(numberToTenths(0.1 + 0.2)).toBe(3n)
    expect(numberToTenths(7844766.666666667)).toBe(78447667n)
    expect(() => numberToTenths(Number.NaN)).toThrow()
  })
})

describe('parseMoneyInput', () => {
  it('accepte espaces, virgule et « Ar »', () => {
    expect(parseMoneyInput('45 000,5 Ar')).toEqual({ ok: true, value: 450005n })
    expect(parseMoneyInput('45000')).toEqual({ ok: true, value: 450000n })
    expect(parseMoneyInput('45 000.0')).toEqual({ ok: true, value: 450000n })
  })

  it('refuse plus d’une décimale au lieu d’arrondir en silence', () => {
    expect(parseMoneyInput('12,34')).toEqual({ ok: false, error: 'tooManyDecimals' })
    expect(parseMoneyInput('')).toEqual({ ok: false, error: 'empty' })
    expect(parseMoneyInput('douze')).toEqual({ ok: false, error: 'notANumber' })
    expect(parseMoneyInput('-5')).toEqual({ ok: false, error: 'negative' })
  })
})

describe('formatAriary', () => {
  it('affiche une décimale pour un prix unitaire', () => {
    expect(formatAriary(450000n)).toBe('45 000,0 Ar')
    expect(formatAriary(78447667n)).toBe('7 844 766,7 Ar')
    expect(formatAriary(5n, { unit: false })).toBe('0,5')
  })

  it('affiche un montant arrondi sans décimale', () => {
    expect(formatAriary(5900000n, { decimals: 0 })).toBe('590 000 Ar')
    expect(() => formatAriary(5n, { decimals: 0 })).toThrow()
  })
})

describe('roundUpToHundredAr (D23-5)', () => {
  it('arrondit à la centaine supérieure', () => {
    expect(roundUpToHundredAr(1535550n)).toBe(1536000n) // 153 555 Ar → 153 600 Ar
    expect(roundUpToHundredAr(5899500n)).toBe(5900000n) // 589 950 Ar → 590 000 Ar (gate G6)
    expect(roundUpToHundredAr(1536000n)).toBe(1536000n) // déjà multiple de 100 Ar
    expect(roundUpToHundredAr(1n)).toBe(1000n)
    expect(roundUpToHundredAr(0n)).toBe(0n)
    expect(() => roundUpToHundredAr(-1n)).toThrow()
  })
})

describe('htFromTtc (D23-10)', () => {
  it('divise par 1,20 au dixième le plus proche', () => {
    expect(htFromTtc(420000n, 2000)).toBe(350000n) // 42 000 TTC → 35 000 HT
    expect(htFromTtc(365000n, 2000)).toBe(304167n) // 36 500 → 30 416,7
    expect(htFromTtc(100n, 0)).toBe(100n)
  })
})

describe('divRoundHalfUp', () => {
  it('arrondit la moitié en s’éloignant de zéro', () => {
    expect(divRoundHalfUp(5n, 10n)).toBe(1n)
    expect(divRoundHalfUp(4n, 10n)).toBe(0n)
    expect(divRoundHalfUp(-5n, 10n)).toBe(-1n)
  })
})

describe('taux', () => {
  it('lit et affiche un taux en points de base', () => {
    expect(parseRateInput('20')).toBe(2000)
    expect(parseRateInput('5,25 %')).toBe(525)
    expect(parseRateInput('5,255')).toBeNull()
    expect(parseRateInput('-1')).toBeNull()
    expect(formatRate(2000)).toBe('20 %')
    expect(formatRate(525)).toBe('5,25 %')
    expect(formatRate(550)).toBe('5,5 %')
  })
})

describe('tenthsFromStored', () => {
  it('relit texte, entier et null', () => {
    expect(tenthsFromStored('450000')).toBe(450000n)
    expect(tenthsFromStored(450000)).toBe(450000n)
    expect(tenthsFromStored(null)).toBeNull()
    expect(() => tenthsFromStored(1.5)).toThrow()
  })
})
