import { describe, expect, it } from 'vitest'
import type { RoofElement } from '../../types/document'
import { createRoofElement } from '../documents/elements'
import {
  computeRoof,
  defaultRidgeEdge,
  isRoofRectangle,
  offsetPolygon,
  pivotRidge,
  type RoofGeometry,
} from './roof'

const BASE = 2500 // dessus des murs, mm
const RECT_8000_6000 = [0, 0, 8000, 0, 8000, 6000, 0, 6000]

type RoofInput = Pick<RoofElement, 'points' | 'shape' | 'pitch' | 'overhang' | 'ridgeEdge'>

function roof(partial: Partial<RoofInput> = {}): RoofInput {
  return { points: RECT_8000_6000, shape: 'gable', pitch: 35, overhang: 500, ridgeEdge: 0, ...partial }
}

function geometry(input: RoofInput, base = BASE): RoofGeometry {
  const result = computeRoof(input, base)
  if ('problem' in result) throw new Error(`problème inattendu : ${result.problem}`)
  return result.geometry
}

const m2 = (mm2: number) => Math.round(mm2 / 10_000) / 100 // m², 2 décimales

describe('critères d\'acceptation de la roadmap', () => {
  it('deux pans 8000 × 6000, 35°, débord 500 : faîtage + 2101, 76,91 m², faîtage 9000, égouts 2 × 9000, 2 pignons', () => {
    const g = geometry(roof())
    expect(Math.round(g.ridgeHeight)).toBe(2101)
    expect(m2(g.realArea)).toBe(76.91)
    expect(g.ridgeLength).toBe(9000)
    expect(g.eaveLength).toBe(18000)
    expect(g.gableCount).toBe(2)
  })

  it('la même toiture en croupe : 76,91 m², faîtage 2000, égout 32000, aucun pignon', () => {
    const g = geometry(roof({ shape: 'hip' }))
    expect(m2(g.realArea)).toBe(76.91)
    expect(g.ridgeLength).toBe(2000)
    expect(g.eaveLength).toBe(32000)
    expect(g.gableCount).toBe(0)
    expect(g.gables).toEqual([])
  })

  it('croupe sur 6000 × 6000 : faîtage de 0 mm (pavillon)', () => {
    const g = geometry(roof({ shape: 'hip', points: [0, 0, 6000, 0, 6000, 6000, 0, 6000] }))
    expect(g.ridgeLength).toBe(0)
    // les deux grands versants deviennent des triangles
    expect(g.slopes.map((s) => s.polygon.length)).toEqual([3, 3, 3, 3])
  })

  it('un pan de 6000 mm de portée à 35° : point haut à + 4201 mm', () => {
    const g = geometry(roof({ shape: 'shed' }))
    expect(Math.round(g.ridgeHeight)).toBe(4201)
    expect(Math.round(g.ridgeY)).toBe(BASE + 4201)
  })
})

describe('deux pans', () => {
  it('égout sous le dessus des murs de d × tan α, faîtage au-dessus', () => {
    const g = geometry(roof())
    expect(g.eaveY).toBeCloseTo(BASE - 500 * Math.tan((35 * Math.PI) / 180))
    expect(g.ridgeY).toBeCloseTo(BASE + 3000 * Math.tan((35 * Math.PI) / 180))
  })

  it('le faîtage suit le grand côté et dépasse du débord aux deux bouts', () => {
    const g = geometry(roof())
    expect(g.ridge).toEqual([
      { x: -500, y: 3000 },
      { x: 8500, y: 3000 },
    ])
  })

  it('deux versants : égouts à l\'altitude de l\'égout, faîtage à celle du faîtage, pentes opposées', () => {
    const g = geometry(roof())
    expect(g.slopes).toHaveLength(2)
    for (const slope of g.slopes) {
      const heights = slope.polygon.map((p) => p.y)
      expect(Math.min(...heights)).toBeCloseTo(g.eaveY)
      expect(Math.max(...heights)).toBeCloseTo(g.ridgeY)
    }
    expect(g.slopes[0].downhill).toEqual({ x: -0, y: -1 })
    expect(g.slopes[1].downhill).toEqual({ x: 0, y: 1 })
  })

  it('deux pignons triangulaires dans le plan des petits côtés, du dessus des murs au faîtage', () => {
    const g = geometry(roof())
    expect(g.gables).toHaveLength(2)
    for (const [x, gable] of [0, 8000].map((x, i) => [x, g.gables[i]] as const)) {
      expect(gable.every((p) => p.x === x)).toBe(true)
      expect(gable.map((p) => p.y)).toEqual([BASE, BASE, g.ridgeY])
      expect(gable[2].z).toBe(3000)
    }
  })

  it('pivoter le faîtage le met le long du petit côté : portée 8000, faîtage 7000', () => {
    const g = geometry(roof({ ridgeEdge: 1 }))
    expect(g.ridgeHeight).toBeCloseTo(4000 * Math.tan((35 * Math.PI) / 180))
    expect(g.ridgeLength).toBe(7000)
    expect(m2(g.realArea)).toBe(76.91) // la surface ne dépend pas du sens du faîtage
  })

  it('sans débord : surface = 48 m² ÷ cos 35°, faîtage = grand côté', () => {
    const g = geometry(roof({ overhang: 0 }))
    expect(g.realArea).toBeCloseTo(48e6 / Math.cos((35 * Math.PI) / 180))
    expect(g.ridgeLength).toBe(8000)
    expect(g.eaveY).toBe(BASE)
  })

  it('un rectangle tourné donne les mêmes quantités', () => {
    const c = Math.cos(Math.PI / 6)
    const s = Math.sin(Math.PI / 6)
    const rotated = [
      [0, 0],
      [8000, 0],
      [8000, 6000],
      [0, 6000],
    ].flatMap(([x, y]) => [1000 + x * c - y * s, 2000 + x * s + y * c])
    const g = geometry(roof({ points: rotated }))
    expect(Math.round(g.ridgeHeight)).toBe(2101)
    expect(m2(g.realArea)).toBe(76.91)
    expect(g.ridgeLength).toBeCloseTo(9000)
  })
})

describe('un pan', () => {
  it('le côté haut est le côté choisi : côté 0 en haut (y = 0), la pente descend vers les y croissants', () => {
    const g = geometry(roof({ shape: 'shed', ridgeEdge: 0 }))
    const [first, , third] = g.slopes[0].polygon
    expect(first.y).toBeCloseTo(BASE + 6500 * Math.tan((35 * Math.PI) / 180)) // au bord du débord haut
    expect(third.y).toBeCloseTo(g.eaveY)
    expect(g.slopes[0].downhill).toEqual({ x: 0, y: 1 })
  })

  it('côté 2 : le côté haut est en y = 6000', () => {
    const g = geometry(roof({ shape: 'shed', ridgeEdge: 2 }))
    expect(g.slopes[0].downhill).toEqual({ x: -0, y: -1 })
    expect(g.raisedWalls[0].every((p) => p.z === 6000)).toBe(true)
  })

  it('deux pignons en triangle rectangle et un mur rehaussé de la hauteur du point haut', () => {
    const g = geometry(roof({ shape: 'shed' }))
    expect(g.gableCount).toBe(2)
    expect(g.gables).toHaveLength(2)
    const wall = g.raisedWalls[0]
    expect(Math.max(...wall.map((p) => p.y)) - BASE).toBeCloseTo(g.ridgeHeight)
    expect(g.ridgeLength).toBe(0)
    expect(g.eaveLength).toBe(9000) // un seul égout, débord compris
  })
})

describe('croupe', () => {
  it('ignore le sens du faîtage : il suit toujours le grand côté', () => {
    expect(geometry(roof({ shape: 'hip', ridgeEdge: 1 }))).toEqual(geometry(roof({ shape: 'hip', ridgeEdge: 0 })))
  })

  it('quatre arêtiers des coins du débord aux bouts du faîtage', () => {
    const g = geometry(roof({ shape: 'hip' }))
    expect(g.hips).toHaveLength(4)
    expect(g.hips[0]).toEqual([
      { x: -500, y: -500 },
      { x: 3000, y: 3000 },
    ])
    expect(g.ridge).toEqual([
      { x: 3000, y: 3000 },
      { x: 5000, y: 3000 },
    ])
    expect(g.hipLength).toBeGreaterThan(4 * 3500 * Math.SQRT2)
  })
})

describe('toit plat', () => {
  it('surface du contour, sans débord par défaut', () => {
    const g = geometry(roof({ shape: 'flat', overhang: 0 }))
    expect(m2(g.realArea)).toBe(48)
    expect(g.ridgeHeight).toBe(0)
    expect(g.eaveY).toBe(BASE)
    expect(g.gableCount).toBe(0)
  })

  it('avec débord : le contour est agrandi de chaque côté', () => {
    expect(m2(geometry(roof({ shape: 'flat', overhang: 500 })).realArea)).toBe(63)
  })

  it('accepte un polygone quelconque (en L)', () => {
    const l = [0, 0, 6000, 0, 6000, 3000, 3000, 3000, 3000, 6000, 0, 6000]
    expect(m2(geometry(roof({ shape: 'flat', overhang: 0, points: l })).realArea)).toBe(27)
  })
})

describe('refus', () => {
  it('un toit en pente demande un rectangle', () => {
    const trapeze = [0, 0, 8000, 0, 7000, 6000, 1000, 6000]
    expect(computeRoof(roof({ points: trapeze }), BASE)).toEqual({ problem: 'not-rectangle' })
  })

  it('pente hors de 1° à 75°', () => {
    expect(computeRoof(roof({ pitch: 0 }), BASE)).toEqual({ problem: 'bad-pitch' })
    expect(computeRoof(roof({ pitch: 80 }), BASE)).toEqual({ problem: 'bad-pitch' })
  })

  it('moins de trois points', () => {
    expect(computeRoof(roof({ points: [0, 0, 1000, 0] }), BASE)).toEqual({ problem: 'too-few-points' })
  })
})

describe('outils', () => {
  it('reconnaît un rectangle, quel que soit le sens du contour', () => {
    expect(isRoofRectangle(RECT_8000_6000)).toBe(true)
    expect(isRoofRectangle([0, 0, 0, 6000, 8000, 6000, 8000, 0])).toBe(true)
    expect(isRoofRectangle([0, 0, 8000, 0, 8000, 6000])).toBe(false)
  })

  it('le faîtage par défaut suit le grand côté', () => {
    expect(defaultRidgeEdge(RECT_8000_6000)).toBe(0)
    expect(defaultRidgeEdge([0, 0, 6000, 0, 6000, 8000, 0, 8000])).toBe(1)
  })

  it('pivoter fait le tour des quatre côtés', () => {
    expect([0, 1, 2, 3].map(pivotRidge)).toEqual([1, 2, 3, 0])
  })

  it('le contour agrandi part vers l\'extérieur dans les deux sens de tracé', () => {
    const square = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ]
    const expected = [
      { x: -1, y: -1 },
      { x: 11, y: -1 },
      { x: 11, y: 11 },
      { x: -1, y: 11 },
    ]
    const near = (pts: { x: number; y: number }[]) => pts.map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) }))
    expect(near(offsetPolygon(square, 1))).toEqual(expected)
    expect(near(offsetPolygon([...square].reverse(), 1))).toEqual([...expected].reverse())
  })

  it('valeurs par défaut (D41) : deux pans, 35°, débord 500 ; toit plat sans débord', () => {
    const pitched = createRoofElement('Toiture', RECT_8000_6000)
    expect(pitched).toMatchObject({ type: 'roof', shape: 'gable', pitch: 35, overhang: 500, ridgeEdge: 0 })
    expect(createRoofElement('Toiture', RECT_8000_6000, 'flat').overhang).toBe(0)
  })
})
