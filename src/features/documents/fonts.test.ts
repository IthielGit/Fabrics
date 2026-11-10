import { describe, expect, it } from 'vitest'
import { buildFontStyle, fontStack, isBold, isItalic } from './fonts'

describe('fontStack', () => {
  it('ajoute une famille générique adaptée', () => {
    expect(fontStack('Georgia')).toBe('"Georgia", serif')
    expect(fontStack('Courier New')).toBe('"Courier New", monospace')
    expect(fontStack('Arial')).toBe('"Arial", sans-serif')
  })

  it('retombe sur sans-serif pour une police inconnue', () => {
    expect(fontStack('Police Inconnue')).toBe('"Police Inconnue", sans-serif')
  })
})

describe('style de police', () => {
  it('lit gras et italique', () => {
    expect(isBold('bold')).toBe(true)
    expect(isBold('bold italic')).toBe(true)
    expect(isBold('italic')).toBe(false)
    expect(isItalic('italic')).toBe(true)
    expect(isItalic('bold italic')).toBe(true)
    expect(isItalic('normal')).toBe(false)
  })

  it('reconstruit le style à partir de gras et italique', () => {
    expect(buildFontStyle(false, false)).toBe('normal')
    expect(buildFontStyle(true, false)).toBe('bold')
    expect(buildFontStyle(false, true)).toBe('italic')
    expect(buildFontStyle(true, true)).toBe('bold italic')
  })
})
