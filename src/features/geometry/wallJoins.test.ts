import { describe, expect, it } from 'vitest'
import { computeWallJoins, type WallJoinInput } from './wallJoins'

function wall(id: string, points: number[], thickness = 200): WallJoinInput {
  return { id, points, thickness }
}

function area(polygon: { x: number; y: number }[]): number {
  let sum = 0
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i]
    const b = polygon[(i + 1) % polygon.length]
    sum += a.x * b.y - b.x * a.y
  }
  return Math.abs(sum) / 2
}

function allPolygons(joins: Map<string, { x: number; y: number }[][]>) {
  return [...joins.values()].flat()
}

describe('computeWallJoins', () => {
  it('comble le coin extérieur d’un angle en L (carré de 100 × 100 mm pour 2 murs de 200 mm)', () => {
    const joins = computeWallJoins([wall('a', [0, -1000, 0, 0]), wall('b', [0, 0, 1000, 0])])
    const polygons = allPolygons(joins)
    expect(polygons).toHaveLength(1)
    expect(area(polygons[0])).toBeCloseTo(100 * 100)
    // le raccord touche le coin extérieur (-100, 100)
    expect(polygons[0]).toContainEqual({ x: -100, y: 100 })
  })

  it('tient compte de l’épaisseur de chaque mur', () => {
    const joins = computeWallJoins([
      wall('a', [0, -1000, 0, 0], 300),
      wall('b', [0, 0, 1000, 0], 100),
    ])
    const polygons = allPolygons(joins)
    expect(polygons).toHaveLength(1)
    expect(area(polygons[0])).toBeCloseTo(150 * 50)
  })

  it('ne dépend pas du sens de tracé des murs', () => {
    const joins = computeWallJoins([wall('a', [0, 0, 0, -1000]), wall('b', [1000, 0, 0, 0])])
    const polygons = allPolygons(joins)
    expect(polygons).toHaveLength(1)
    expect(area(polygons[0])).toBeCloseTo(100 * 100)
  })

  it('traite les quatre coins d’une pièce faite de quatre murs séparés', () => {
    const joins = computeWallJoins([
      wall('n', [0, 0, 4000, 0]),
      wall('e', [4000, 0, 4000, 3000]),
      wall('s', [4000, 3000, 0, 3000]),
      wall('w', [0, 3000, 0, 0]),
    ])
    const polygons = allPolygons(joins)
    expect(polygons).toHaveLength(4)
    for (const polygon of polygons) expect(area(polygon)).toBeCloseTo(100 * 100)
  })

  it('comble aussi un angle non droit (135°)', () => {
    const joins = computeWallJoins([
      wall('a', [-1000, 0, 0, 0]),
      wall('b', [0, 0, 707.1, 707.1]),
    ])
    const polygons = allPolygons(joins)
    expect(polygons).toHaveLength(1)
    expect(area(polygons[0])).toBeGreaterThan(0)
  })

  it('n’ajoute rien à une jonction en T, à un prolongement ou à une extrémité libre', () => {
    // T : trois murs qui se terminent au même point
    expect(
      computeWallJoins([
        wall('a', [-1000, 0, 0, 0]),
        wall('b', [0, 0, 1000, 0]),
        wall('c', [0, 0, 0, 1000]),
      ]).size,
    ).toBe(0)
    // prolongement : deux murs alignés
    expect(computeWallJoins([wall('a', [-1000, 0, 0, 0]), wall('b', [0, 0, 1000, 0])]).size).toBe(0)
    // extrémité libre
    expect(computeWallJoins([wall('a', [0, 0, 1000, 0])]).size).toBe(0)
  })

  it('ignore un mur qui se referme sur lui-même et deux bouts du même mur au même point', () => {
    expect(computeWallJoins([wall('a', [0, 0, 1000, 0, 1000, 1000, 0, 0])]).size).toBe(0)
    expect(computeWallJoins([wall('a', [0, 0, 1000, 0, 1000, 1000, 0, 1000, 0, 0])]).size).toBe(0)
  })

  it('ne raccorde pas des extrémités éloignées', () => {
    expect(
      computeWallJoins([wall('a', [0, -1000, 0, 0]), wall('b', [50, 0, 1000, 0])]).size,
    ).toBe(0)
  })

  it('coupe en biseau un angle très aigu au lieu de le prolonger en pointe', () => {
    // 10° entre les deux murs : la pointe de l’onglet serait très longue
    const angle = (10 * Math.PI) / 180
    const joins = computeWallJoins([
      wall('a', [1000, 0, 0, 0]),
      wall('b', [0, 0, 1000 * Math.cos(angle), 1000 * Math.sin(angle)]),
    ])
    const polygons = allPolygons(joins)
    expect(polygons).toHaveLength(1)
    expect(polygons[0]).toHaveLength(3)
  })
})
