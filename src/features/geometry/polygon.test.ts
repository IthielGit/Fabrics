import { describe, expect, it } from 'vitest'
import {
  flattenPoints,
  pointDistance,
  polygonArea,
  polygonCentroid,
  polygonPerimeter,
  polylineLength,
  toPoints,
} from './polygon'

// Pièce de 4 m × 3 m (en mm)
const RECT = [0, 0, 4000, 0, 4000, 3000, 0, 3000]

// Pièce en L : rectangle 4 m × 2 m + rectangle 2 m × 1 m
const L_SHAPE = [0, 0, 4000, 0, 4000, 2000, 2000, 2000, 2000, 3000, 0, 3000]

const reversed = (flat: number[]) => flattenPoints(toPoints(flat).reverse())

describe('toPoints / flattenPoints', () => {
  it('convertit dans les deux sens', () => {
    const points = toPoints([1, 2, 3, 4])
    expect(points).toEqual([
      { x: 1, y: 2 },
      { x: 3, y: 4 },
    ])
    expect(flattenPoints(points)).toEqual([1, 2, 3, 4])
  })

  it('ignore une coordonnée en trop', () => {
    expect(toPoints([1, 2, 3])).toHaveLength(1)
  })
})

describe('pointDistance', () => {
  it('calcule la distance (triangle 3-4-5)', () => {
    expect(pointDistance({ x: 0, y: 0 }, { x: 3000, y: 4000 })).toBe(5000)
  })
})

describe('polylineLength', () => {
  it('additionne exactement les segments d’un mur en 3 segments', () => {
    // 3 000 + 4 000 + 3 000 = 10 000
    expect(polylineLength([0, 0, 3000, 0, 3000, 4000, 0, 4000])).toBe(10_000)
  })

  it('compte une diagonale', () => {
    expect(polylineLength([0, 0, 3000, 4000])).toBe(5000)
  })

  it('vaut 0 pour moins de 2 points', () => {
    expect(polylineLength([])).toBe(0)
    expect(polylineLength([5, 5])).toBe(0)
  })
})

describe('polygonArea', () => {
  it('rectangle 4 m × 3 m = 12 m²', () => {
    expect(polygonArea(RECT)).toBe(12_000_000)
  })

  it('polygone en L = 10 m²', () => {
    expect(polygonArea(L_SHAPE)).toBe(10_000_000)
  })

  it('donne la même surface dans les deux sens de parcours', () => {
    expect(polygonArea(reversed(RECT))).toBe(polygonArea(RECT))
    expect(polygonArea(reversed(L_SHAPE))).toBe(polygonArea(L_SHAPE))
  })

  it('ne dépend pas de la position du polygone', () => {
    const moved = RECT.map((v, i) => v + (i % 2 === 0 ? 12_345 : -6_789))
    expect(polygonArea(moved)).toBe(12_000_000)
  })

  it('vaut 0 pour moins de 3 points', () => {
    expect(polygonArea([0, 0, 1000, 1000])).toBe(0)
  })

  it('triangle rectangle 3 m × 4 m = 6 m²', () => {
    expect(polygonArea([0, 0, 3000, 0, 0, 4000])).toBe(6_000_000)
  })
})

describe('polygonPerimeter', () => {
  it('rectangle 4 m × 3 m = 14 m', () => {
    expect(polygonPerimeter(RECT)).toBe(14_000)
  })

  it('polygone en L = 14 m', () => {
    expect(polygonPerimeter(L_SHAPE)).toBe(14_000)
  })

  it('ferme le polygone : le dernier côté rejoint le premier point', () => {
    expect(polygonPerimeter([0, 0, 3000, 0, 0, 4000])).toBe(12_000) // 3 + 5 + 4 m
  })

  it('vaut 0 pour moins de 2 points', () => {
    expect(polygonPerimeter([0, 0])).toBe(0)
  })
})

describe('polygonCentroid', () => {
  it('rectangle : le centre', () => {
    const c = polygonCentroid(RECT)!
    expect(c.x).toBeCloseTo(2000)
    expect(c.y).toBeCloseTo(1500)
  })

  it('est indépendant du sens de parcours', () => {
    const a = polygonCentroid(L_SHAPE)!
    const b = polygonCentroid(reversed(L_SHAPE))!
    expect(b.x).toBeCloseTo(a.x)
    expect(b.y).toBeCloseTo(a.y)
  })

  it('polygone en L : pondéré par les aires (8 m² + 2 m²)', () => {
    // 8 m² centré en (2000, 1000) ; 2 m² centré en (1000, 2500)
    const c = polygonCentroid(L_SHAPE)!
    expect(c.x).toBeCloseTo((8 * 2000 + 2 * 1000) / 10)
    expect(c.y).toBeCloseTo((8 * 1000 + 2 * 2500) / 10)
  })

  it('polygone aplati : moyenne des points', () => {
    const c = polygonCentroid([0, 0, 1000, 0, 2000, 0])!
    expect(c).toEqual({ x: 1000, y: 0 })
  })

  it('renvoie null sans point', () => {
    expect(polygonCentroid([])).toBeNull()
  })
})
