import { describe, expect, it } from 'vitest'
import { cardinalDirection, normalizeNorthAngle } from './north'

describe('normalizeNorthAngle', () => {
  it.each([
    [0, 0],
    [90, 90],
    [360, 0],
    [370, 10],
    [-90, 270],
    [-360, 0],
    [44.6, 45],
    [Number.NaN, 0],
    [Infinity, 0],
  ])('%s° → %s°', (input, expected) => {
    expect(normalizeNorthAngle(input)).toBe(expected)
  })
})

describe('cardinalDirection', () => {
  it('nord en haut : N vers le haut, E à droite, S en bas, O à gauche', () => {
    expect(cardinalDirection('N', 0)).toEqual({ x: 0, y: -1 })
    expect(cardinalDirection('E', 0)).toEqual({ x: 1, y: 0 })
    expect(cardinalDirection('S', 0)).toEqual({ x: 0, y: 1 })
    expect(cardinalDirection('O', 0)).toEqual({ x: -1, y: 0 })
  })

  it('nord à 90° : le nord pointe vers la droite du plan', () => {
    expect(cardinalDirection('N', 90)).toEqual({ x: 1, y: 0 })
    expect(cardinalDirection('E', 90)).toEqual({ x: 0, y: 1 })
  })

  it('nord à 45° : diagonale en haut à droite', () => {
    const n = cardinalDirection('N', 45)
    expect(n.x).toBeCloseTo(Math.SQRT1_2)
    expect(n.y).toBeCloseTo(-Math.SQRT1_2)
  })
})
