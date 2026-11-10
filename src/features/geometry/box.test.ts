import { describe, expect, it } from 'vitest'
import { boxesIntersect, distance, normalizeBox } from './box'

describe('normalizeBox', () => {
  it('garde le même résultat quel que soit le sens du tracé', () => {
    const expected = { x: 10, y: 20, width: 30, height: 40 }
    expect(normalizeBox({ x: 10, y: 20 }, { x: 40, y: 60 })).toEqual(expected)
    expect(normalizeBox({ x: 40, y: 60 }, { x: 10, y: 20 })).toEqual(expected)
    expect(normalizeBox({ x: 40, y: 20 }, { x: 10, y: 60 })).toEqual(expected)
  })

  it('renvoie une boîte vide pour deux points identiques', () => {
    expect(normalizeBox({ x: 5, y: 5 }, { x: 5, y: 5 })).toEqual({
      x: 5,
      y: 5,
      width: 0,
      height: 0,
    })
  })
})

describe('distance', () => {
  it('calcule la distance entre deux points (triangle 3-4-5)', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
  })
})

describe('boxesIntersect', () => {
  const a = { x: 0, y: 0, width: 10, height: 10 }

  it('détecte un chevauchement', () => {
    expect(boxesIntersect(a, { x: 5, y: 5, width: 10, height: 10 })).toBe(true)
  })

  it('détecte une boîte entièrement contenue', () => {
    expect(boxesIntersect(a, { x: 2, y: 2, width: 3, height: 3 })).toBe(true)
  })

  it('détecte deux boîtes séparées', () => {
    expect(boxesIntersect(a, { x: 20, y: 20, width: 5, height: 5 })).toBe(false)
  })
})
