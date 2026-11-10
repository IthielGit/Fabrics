import { describe, expect, it } from 'vitest'
import { formatNumber, parseNumber } from './numberFormat'

describe('formatNumber', () => {
  it('utilise la virgule et au plus 2 décimales', () => {
    expect(formatNumber(12.5)).toBe('12,5')
    expect(formatNumber(3.14159)).toBe('3,14')
    expect(formatNumber(100)).toBe('100')
    expect(formatNumber(-4)).toBe('-4')
  })
})

describe('parseNumber', () => {
  it('accepte la virgule et le point', () => {
    expect(parseNumber('12,5')).toBe(12.5)
    expect(parseNumber('12.5')).toBe(12.5)
    expect(parseNumber('  7 ')).toBe(7)
    expect(parseNumber('-3,25')).toBe(-3.25)
  })

  it('refuse ce qui n’est pas un nombre', () => {
    expect(parseNumber('')).toBeNull()
    expect(parseNumber('abc')).toBeNull()
    expect(parseNumber('12abc')).toBeNull()
  })
})
