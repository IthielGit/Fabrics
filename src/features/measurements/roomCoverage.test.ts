import { describe, expect, it } from 'vitest'
import { polygonDifference } from '../geometry/polygonPieces'
import { createCoverageChecker, roomCoverageGaps } from './roomCoverage'

// Pièce de 4000 × 3000 aux axes, murs de 200 mm : faces intérieures de 100 à 3900 et de 100 à 2900.
const wall = (id: string, points: number[]) => ({ id, points, thickness: 200, x: 0, y: 0 })
const BOX = [
  wall('nord', [0, 0, 4000, 0]),
  wall('est', [4000, 0, 4000, 3000]),
  wall('sud', [4000, 3000, 0, 3000]),
  wall('ouest', [0, 3000, 0, 0]),
]
const room = (points: number[]) => ({ points, x: 0, y: 0 })
const rect = (x0: number, y0: number, x1: number, y1: number) => [x0, y0, x1, y0, x1, y1, x0, y1]

describe('polygonDifference', () => {
  it('un carré moins un carré qui le recouvre à moitié : un morceau de la moitié', () => {
    const square = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }]
    const half = [{ x: 50, y: -10 }, { x: 200, y: -10 }, { x: 200, y: 200 }, { x: 50, y: 200 }]
    const pieces = polygonDifference(square, half)
    expect(pieces).toHaveLength(1)
    expect(pieces[0].area).toBeCloseTo(5000)
  })

  it('un carré posé au milieu sans toucher le bord laisse un anneau (un trou)', () => {
    const outer = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }]
    const inner = [{ x: 25, y: 25 }, { x: 75, y: 25 }, { x: 75, y: 75 }, { x: 25, y: 75 }]
    const pieces = polygonDifference(outer, inner)
    expect(pieces).toHaveLength(1)
    expect(pieces[0].rings).toHaveLength(2)
    expect(pieces[0].area).toBeCloseTo(7500)
  })
})

describe('roomCoverageGaps', () => {
  it('pièce exacte sur les faces intérieures : aucun écart', () => {
    expect(roomCoverageGaps(room(rect(100, 100, 3900, 2900)), BOX)).toEqual([])
  })

  it('pièce tracée aux axes des murs : ni manque ni débord', () => {
    expect(roomCoverageGaps(room(rect(0, 0, 4000, 3000)), BOX)).toEqual([])
  })

  it('pièce décalée de 100 mm du mur est : bande de 100 × 2800 signalée le long de ce mur', () => {
    const pieces = roomCoverageGaps(room(rect(100, 100, 3800, 2900)), BOX)
    expect(pieces).toHaveLength(1)
    expect(pieces[0].kind).toBe('gap')
    expect(pieces[0].area).toBeCloseTo(100 * 2800)
    expect(pieces[0].wallId).toBe('est')
  })

  it('coin oublié : pièce en L dans un rectangle, le coin de 1000 × 1000 manque', () => {
    const l = [100, 100, 3900, 100, 3900, 1900, 2900, 1900, 2900, 2900, 100, 2900]
    const pieces = roomCoverageGaps(room(l), BOX)
    expect(pieces).toHaveLength(1)
    expect(pieces[0].kind).toBe('gap')
    expect(pieces[0].area).toBeCloseTo(1000 * 1000)
  })

  it('pièce qui déborde au-delà du mur ouest (jusqu’à −300) : débord signalé', () => {
    const pieces = roomCoverageGaps(room(rect(-300, 100, 3900, 2900)), BOX)
    expect(pieces.map((p) => p.kind)).toEqual(['overflow'])
    expect(pieces[0].area).toBeCloseTo(300 * 2800)
    expect(pieces[0].wallId).toBe('ouest')
  })

  it('pièce sans murs fermés autour : aucun avertissement', () => {
    expect(roomCoverageGaps(room(rect(100, 100, 3800, 2900)), [])).toEqual([])
    expect(roomCoverageGaps(room(rect(100, 100, 3800, 2900)), BOX.slice(0, 3))).toEqual([])
  })

  it('écart sous le seuil (5 mm sur 1000 mm) : ignoré', () => {
    // Petit mur de 1000 mm : la bande fait 5 × 1000 = 0,005 m² et 5 mm de large.
    const small = [
      wall('a', [0, 0, 1200, 0]),
      wall('b', [1200, 0, 1200, 1200]),
      wall('c', [1200, 1200, 0, 1200]),
      wall('d', [0, 1200, 0, 0]),
    ]
    expect(roomCoverageGaps(room(rect(100, 100, 1095, 1100)), small)).toEqual([])
  })

  it('pièce posée au milieu sans toucher les murs : un anneau, sans mur désigné', () => {
    const pieces = roomCoverageGaps(room(rect(300, 300, 3700, 2700)), BOX)
    expect(pieces).toHaveLength(1)
    expect(pieces[0].wallId).toBeNull()
    expect(pieces[0].area).toBeCloseTo(3800 * 2800 - 3400 * 2400)
  })
})

describe('pièces qui se partagent une zone', () => {
  it('cuisine et séjour dans la même zone, sans mur entre eux : aucun manque', () => {
    const kitchen = room(rect(100, 100, 1500, 2900))
    const living = room(rect(1500, 100, 3900, 2900))
    expect(roomCoverageGaps(kitchen, BOX, [kitchen, living])).toEqual([])
    expect(roomCoverageGaps(living, BOX, [kitchen, living])).toEqual([])
  })

  it('bande oubliée entre deux pièces : signalée une seule fois', () => {
    const kitchen = room(rect(100, 100, 1500, 2900))
    const living = room(rect(1600, 100, 3900, 2900))
    const checker = createCoverageChecker(BOX)
    const all = [kitchen, living]
    const found = [...checker.check(kitchen, all), ...checker.check(living, all)]
    expect(found).toHaveLength(1)
    expect(found[0].area).toBeCloseTo(100 * 2800)
  })
})
