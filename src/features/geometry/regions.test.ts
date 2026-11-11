import { describe, expect, it } from 'vitest'
import { flattenPoints, polygonArea } from './polygon'
import { createRegionFinder, findEnclosedRegion } from './regions'
import type { WallGeometry } from './walls'

const T = 200

function wall(points: number[], thickness = T): WallGeometry {
  return { points, thickness }
}

/** Quatre murs séparés (bouts droits) autour d'une pièce d'axes 4 000 × 3 000 mm. */
const FOUR_WALLS: WallGeometry[] = [
  wall([0, 0, 4000, 0]),
  wall([4000, 0, 4000, 3000]),
  wall([4000, 3000, 0, 3000]),
  wall([0, 3000, 0, 0]),
]

const areaOf = (polygon: { x: number; y: number }[]) => polygonArea(flattenPoints(polygon))

describe('findEnclosedRegion', () => {
  it('quatre murs séparés : l’intérieur fait 3 800 × 2 800 mm = 10,64 m²', () => {
    const region = findEnclosedRegion(FOUR_WALLS, { x: 2000, y: 1500 })
    expect(region).not.toBeNull()
    expect(region).toHaveLength(4)
    expect(areaOf(region ?? [])).toBeCloseTo(10.64e6)
    // les sommets sont sur les faces intérieures
    expect(region).toEqual(
      expect.arrayContaining([
        { x: 100, y: 100 },
        { x: 3900, y: 100 },
        { x: 3900, y: 2900 },
        { x: 100, y: 2900 },
      ]),
    )
  })

  it('un seul mur fermé sur lui-même donne la même zone', () => {
    const closed = [wall([0, 0, 4000, 0, 4000, 3000, 0, 3000, 0, 0])]
    const region = findEnclosedRegion(closed, { x: 2000, y: 1500 })
    expect(areaOf(region ?? [])).toBeCloseTo(10.64e6)
  })

  it('le sens de tracé des murs n’a pas d’importance', () => {
    const reversed = FOUR_WALLS.map((w) => ({
      ...w,
      points: toReversedPoints(w.points),
    }))
    expect(areaOf(findEnclosedRegion(reversed, { x: 2000, y: 1500 }) ?? [])).toBeCloseTo(10.64e6)
  })

  it('une pièce en L : 8,64 m² (5 angles saillants, 1 rentrant)', () => {
    const l = [wall([0, 0, 4000, 0, 4000, 2000, 2000, 2000, 2000, 3000, 0, 3000, 0, 0])]
    // A − P·h + h²·(saillants − rentrants) = 10e6 − 14000·100 + 1e4·(5 − 1)
    expect(areaOf(findEnclosedRegion(l, { x: 1000, y: 1000 }) ?? [])).toBeCloseTo(8.64e6)
    // le coude du L est dans la même zone
    expect(areaOf(findEnclosedRegion(l, { x: 1000, y: 2500 }) ?? [])).toBeCloseTo(8.64e6)
  })

  it('un contour avec un angle à 45° (pentagone) donne l’intérieur des faces', () => {
    // maison : rectangle 4 000 × 2 000 surmonté d'un toit pointu fermé par des murs
    const house = [wall([0, 0, 4000, 0, 4000, 2000, 2000, 3500, 0, 2000, 0, 0])]
    const region = findEnclosedRegion(house, { x: 2000, y: 1000 })
    expect(region).not.toBeNull()
    const area = areaOf(region ?? [])
    const axisArea = 4000 * 2000 + (4000 * 1500) / 2
    expect(area).toBeGreaterThan(0)
    expect(area).toBeLessThan(axisArea)
  })

  it('un mur de refend sépare deux zones, chacune fermée de 2 800 × 2 800 mm', () => {
    const rooms = [
      wall([0, 0, 6000, 0, 6000, 3000, 0, 3000, 0, 0]),
      wall([3000, 0, 3000, 3000]),
    ]
    expect(areaOf(findEnclosedRegion(rooms, { x: 1500, y: 1500 }) ?? [])).toBeCloseTo(7.84e6)
    expect(areaOf(findEnclosedRegion(rooms, { x: 4500, y: 1500 }) ?? [])).toBeCloseTo(7.84e6)
  })

  it('un îlot fermé dans une grande pièce : on retrouve chaque zone', () => {
    const hall = wall([0, 0, 10000, 0, 10000, 8000, 0, 8000, 0, 0])
    const box = wall([4000, 3000, 6000, 3000, 6000, 5000, 4000, 5000, 4000, 3000])
    const walls = [hall, box]
    // dans l'îlot : 1 800 × 1 800
    expect(areaOf(findEnclosedRegion(walls, { x: 5000, y: 4000 }) ?? [])).toBeCloseTo(1800 * 1800)
    // dans la grande pièce : le contour du hall (9 800 × 7 800)
    expect(areaOf(findEnclosedRegion(walls, { x: 1000, y: 1000 }) ?? [])).toBeCloseTo(9800 * 7800)
  })

  it('deux murs superposés sur la même ligne ne gênent pas', () => {
    const doubled = [...FOUR_WALLS, wall([0, 0, 4000, 0])]
    expect(areaOf(findEnclosedRegion(doubled, { x: 2000, y: 1500 }) ?? [])).toBeCloseTo(10.64e6)
  })

  it('des murs d’épaisseurs différentes : l’intérieur suit chaque face', () => {
    const mixed = [
      wall([0, 0, 4000, 0], 300),
      wall([4000, 0, 4000, 3000], 200),
      wall([4000, 3000, 0, 3000], 300),
      wall([0, 3000, 0, 0], 200),
    ]
    // largeur : 4000 − 100 − 100 ; hauteur : 3000 − 150 − 150
    expect(areaOf(findEnclosedRegion(mixed, { x: 2000, y: 1500 }) ?? [])).toBeCloseTo(3800 * 2700)
  })

  it('pas de zone : dans l’épaisseur d’un mur, à l’extérieur ou dans une pièce ouverte', () => {
    expect(findEnclosedRegion(FOUR_WALLS, { x: 2000, y: 0 })).toBeNull() // sur le mur du haut
    expect(findEnclosedRegion(FOUR_WALLS, { x: 2000, y: 5000 })).toBeNull() // dehors
    expect(findEnclosedRegion(FOUR_WALLS, { x: -2000, y: 1500 })).toBeNull() // dehors
    const open = FOUR_WALLS.slice(0, 3) // le quatrième mur manque
    expect(findEnclosedRegion(open, { x: 2000, y: 1500 })).toBeNull()
    expect(findEnclosedRegion([], { x: 0, y: 0 })).toBeNull()
  })

  it('une trouée dans un mur laisse la pièce ouverte', () => {
    const gap = [
      wall([0, 0, 4000, 0]),
      wall([4000, 0, 4000, 3000]),
      wall([4000, 3000, 0, 3000]),
      wall([0, 3000, 0, 1500]), // s'arrête à mi-hauteur
    ]
    expect(findEnclosedRegion(gap, { x: 2000, y: 1500 })).toBeNull()
  })

  it('ne tient pas compte d’un bout de mur qui dépasse dans la pièce', () => {
    const stub = [...FOUR_WALLS, wall([2000, 0, 2000, 1000])]
    const region = createRegionFinder(stub).find({ x: 1000, y: 2000 })
    // le bout de mur ne ferme rien : on garde la pièce entière (moins le bout de mur)
    expect(region).not.toBeNull()
    expect(areaOf(region ?? [])).toBeGreaterThan(0)
  })

  it('un grand plan (225 pièces, 900 murs) est préparé en moins d’une seconde', () => {
    const walls: WallGeometry[] = []
    for (let row = 0; row < 15; row++) {
      for (let column = 0; column < 15; column++) {
        const x = column * 5000
        const y = row * 4000
        walls.push(
          wall([x, y, x + 4000, y]),
          wall([x + 4000, y, x + 4000, y + 3000]),
          wall([x + 4000, y + 3000, x, y + 3000]),
          wall([x, y + 3000, x, y]),
        )
      }
    }
    const started = performance.now()
    const finder = createRegionFinder(walls)
    const region = finder.find({ x: 7 * 5000 + 2000, y: 7 * 4000 + 1500 })
    expect(performance.now() - started).toBeLessThan(1000)
    expect(areaOf(region ?? [])).toBeCloseTo(10.64e6)
  })

  it('un même chercheur répond pour plusieurs points', () => {
    const finder = createRegionFinder(FOUR_WALLS)
    expect(finder.find({ x: 500, y: 500 })).not.toBeNull()
    expect(finder.find({ x: 3500, y: 2500 })).not.toBeNull()
    expect(finder.find({ x: 9000, y: 9000 })).toBeNull()
  })
})

function toReversedPoints(points: readonly number[]): number[] {
  const reversed: number[] = []
  for (let i = points.length - 2; i >= 0; i -= 2) reversed.push(points[i], points[i + 1])
  return reversed
}
