import { describe, expect, it } from 'vitest'
import {
  cmToMm,
  formatArea,
  formatDecimal,
  formatLength,
  mToMm,
  mm2ToM2,
  parseLength,
} from './format'

describe('conversions', () => {
  it('convertit m et cm en mm', () => {
    expect(mToMm(3.5)).toBe(3500)
    expect(cmToMm(20)).toBe(200)
  })

  it('convertit des mm² en m²', () => {
    expect(mm2ToM2(12_000_000)).toBe(12)
  })
})

describe('formatDecimal', () => {
  it('utilise la virgule et le nombre de décimales demandé', () => {
    expect(formatDecimal(3.5)).toBe('3,50')
    expect(formatDecimal(3.14159, 3)).toBe('3,142')
    expect(formatDecimal(7, 0)).toBe('7')
  })

  it('n’affiche jamais -0,00', () => {
    expect(formatDecimal(-0.0001)).toBe('0,00')
  })

  it('garde le signe des vrais négatifs', () => {
    expect(formatDecimal(-2.5)).toBe('-2,50')
  })
})

describe('formatLength / formatArea (Métrique architectural)', () => {
  it('affiche une longueur en millimètres entiers', () => {
    expect(formatLength(3500)).toBe('3500 mm')
    expect(formatLength(14_000)).toBe('14000 mm')
    expect(formatLength(0)).toBe('0 mm')
    expect(formatLength(200)).toBe('200 mm')
  })

  it('arrondit au millimètre', () => {
    expect(formatLength(3499.6)).toBe('3500 mm')
  })

  it('affiche une surface en m²', () => {
    expect(formatArea(12_400_000)).toBe('12,40 m²')
    expect(formatArea(10_640_000)).toBe('10,64 m²')
  })
})

describe('parseLength', () => {
  it('sans unité, lit des millimètres', () => {
    expect(parseLength('3500')).toBe(3500)
    expect(parseLength('3500mm')).toBe(3500)
    expect(parseLength('3500 mm')).toBe(3500)
  })

  it('accepte aussi explicitement des mètres et des centimètres', () => {
    expect(parseLength('3,50 m')).toBe(3500)
    expect(parseLength('3.5m')).toBe(3500)
    expect(parseLength('350 cm')).toBe(3500)
  })

  it('ignore la casse et les espaces autour', () => {
    expect(parseLength('  2 M ')).toBe(2000)
  })

  it('refuse ce qui n’est pas une longueur positive', () => {
    expect(parseLength('')).toBeNull()
    expect(parseLength('abc')).toBeNull()
    expect(parseLength('0')).toBeNull()
    expect(parseLength('-3')).toBeNull()
    expect(parseLength('3 pieds')).toBeNull()
  })
})
