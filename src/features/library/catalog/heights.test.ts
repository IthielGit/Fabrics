import { describe, expect, it } from 'vitest'
import { SYMBOLS, getSymbol } from './index'
import { explicitReferenceHeight } from './heights'

describe('hauteurs de référence du catalogue', () => {
  it('des valeurs d’usage courant', () => {
    expect(getSymbol('bed-double')?.height).toBe(500)
    expect(getSymbol('kitchen-base')?.height).toBe(900)
    expect(getSymbol('fridge-freezer')?.height).toBe(1850)
    expect(getSymbol('table-tennis')?.height).toBe(760)
    expect(getSymbol('kitchen-wall')).toMatchObject({ height: 700, elevation: 1450 })
    expect(getSymbol('hood')).toMatchObject({ height: 450, elevation: 1850 })
  })

  it('toutes les hauteurs sont des mm positifs ou nuls, et un objet en hauteur a une hauteur de pose', () => {
    for (const symbol of SYMBOLS) {
      expect(symbol.height, symbol.id).toBeGreaterThanOrEqual(0)
      expect(Number.isInteger(symbol.height), symbol.id).toBe(true)
      if (symbol.elevation !== undefined) expect(symbol.elevation, symbol.id).toBeGreaterThan(0)
    }
  })

  it('une zone de référence n’a pas de volume', () => {
    for (const symbol of SYMBOLS.filter((s) => s.zone)) expect(symbol.height, symbol.id).toBe(0)
  })

  it('chaque objet du mobilier a une règle propre (pas seulement la hauteur de sa catégorie)', () => {
    const generic = new Set(['electrical', 'safety', 'stairs', 'prefabs', 'sets'])
    const missing = SYMBOLS.filter(
      (s) => !s.zone && !generic.has(s.category) && explicitReferenceHeight(s.id) === null,
    ).map((s) => s.id)
    expect(missing).toEqual([])
  })
})
