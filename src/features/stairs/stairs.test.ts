import { describe, expect, it } from 'vitest'
import type { Level } from '../../types/document'
import { createStairElement } from '../documents/elements'
import { polygonArea } from '../geometry/polygon'
import {
  computeStairSteps,
  defaultStairLengths,
  levelAboveOf,
  offsetPolygon,
  riserCount,
  stairFootprint,
  stairLayout,
  stairStatus,
  stairVoid,
} from './stairs'

const level = (id: string, elevation: number, height = 2700): Level => ({
  id,
  name: id,
  elevation,
  height,
  slabThickness: 200,
})

const GROUND = level('n0', 0)
const UPPER = level('n1', 2700)

describe('nombre de contremarches', () => {
  it('2 700 mm : 15 contremarches de 180 mm', () => {
    expect(riserCount(2700)).toBe(15)
  })

  it('2 880 mm : 16 contremarches', () => {
    expect(riserCount(2880)).toBe(16)
  })

  it('le plus petit nombre entier qui garde chaque contremarche à 180 mm ou moins', () => {
    for (const rise of [2500, 2600, 2750, 2801, 3000, 3200, 150, 180, 181]) {
      const n = riserCount(rise)
      expect(rise / n).toBeLessThanOrEqual(180)
      if (n > 1) expect(rise / (n - 1)).toBeGreaterThan(180)
    }
  })

  it('rien à monter : aucune contremarche', () => {
    expect(riserCount(0)).toBe(0)
    expect(riserCount(-100)).toBe(0)
  })
})

describe('marches d’un escalier', () => {
  it('2 700 mm : 15 contremarches, 14 girons, 3500 mm de volée au minimum', () => {
    const steps = computeStairSteps({ shape: 'straight', length: 3500 }, 2700)!
    expect(steps.risers).toBe(15)
    expect(steps.treads).toBe(14)
    expect(steps.riserHeight).toBe(180)
    expect(steps.requiredRun).toBe(3500)
    expect(steps.treadDepth).toBe(250)
    expect(steps.tooShort).toBe(false)
  })

  it('un escalier de 3000 mm de long est trop court : 3500 mm nécessaires', () => {
    const steps = computeStairSteps({ shape: 'straight', length: 3000 }, 2700)!
    expect(steps.tooShort).toBe(true)
    expect(steps.requiredRun).toBe(3500)
    expect(steps.treadDepth).toBeCloseTo(3000 / 14)
  })

  it('le giron est la longueur totale des volées divisée par le nombre de girons', () => {
    const steps = computeStairSteps({ shape: 'l', length: 2000, length2: 2000 }, 2700)!
    expect(steps.run).toBe(4000)
    expect(steps.treadDepth).toBeCloseTo(4000 / 14)
    expect(steps.tooShort).toBe(false)
  })

  it('les paliers ne comptent pas dans la longueur', () => {
    const l = computeStairSteps({ shape: 'l', length: 1750, length2: 1750 }, 2700)!
    const straight = computeStairSteps({ shape: 'straight', length: 3500 }, 2700)!
    expect(l.run).toBe(straight.run)
  })
})

describe('niveau d’arrivée et recalcul', () => {
  const stair = createStairElement('Escalier 1', 'straight', 0, 0, { length: 3500 })

  it('le niveau du dessus est celui juste au-dessus', () => {
    expect(levelAboveOf([GROUND, UPPER], 'n0')).toBe(UPPER)
    expect(levelAboveOf([UPPER, GROUND], 'n0')).toBe(UPPER) // quel que soit l'ordre de la liste
    expect(levelAboveOf([GROUND, UPPER], 'n1')).toBeUndefined()
  })

  it('hauteur à monter = altitude du niveau du dessus − altitude du niveau de départ', () => {
    const status = stairStatus({ ...stair, levelId: 'n0' }, [GROUND, UPPER])
    expect(status.kind).toBe('ok')
    if (status.kind === 'no-level-above') return
    expect(status.rise).toBe(2700)
    expect(status.steps.risers).toBe(15)
  })

  it('une altitude change : les marches sont recalculées (2 880 mm → 16 contremarches)', () => {
    const status = stairStatus({ ...stair, levelId: 'n0' }, [GROUND, level('n1', 2880)])
    if (status.kind === 'no-level-above') throw new Error('niveau du dessus attendu')
    expect(status.steps.risers).toBe(16)
    expect(status.steps.treads).toBe(15)
    // 15 girons demandent 3750 mm : 3500 ne suffit plus.
    expect(status.kind).toBe('too-short')
    expect(status.steps.requiredRun).toBe(3750)
  })

  it('sur le dernier niveau, ou si le niveau du dessus a disparu : aucun niveau au-dessus', () => {
    expect(stairStatus({ ...stair, levelId: 'n1' }, [GROUND, UPPER]).kind).toBe('no-level-above')
    expect(stairStatus({ ...stair, levelId: 'n0' }, [GROUND]).kind).toBe('no-level-above')
    expect(stairStatus(stair, undefined).kind).toBe('no-level-above')
  })

  it('un escalier sans niveau part du premier niveau', () => {
    const status = stairStatus({ ...stair, levelId: undefined }, [GROUND, UPPER])
    expect(status.kind).toBe('ok')
  })
})

describe('emprise', () => {
  it('droit 1000 × 3500 mm', () => {
    const stair = createStairElement('E', 'straight', 0, 0, { length: 3500 })
    const layout = stairLayout(stair)
    expect([layout.width, layout.height]).toEqual([1000, 3500])
    expect(polygonArea(layout.outline.flatMap((p) => [p.x, p.y]))).toBeCloseTo(3.5e6)
  })

  it('en L : volée, palier carré de côté « emmarchement », volée', () => {
    const stair = createStairElement('E', 'l', 0, 0, { length: 2000, length2: 1500 })
    const layout = stairLayout(stair, 14)
    expect(layout.landing).toEqual({ x: 0, y: 0, width: 1000, height: 1000 })
    expect([layout.width, layout.height]).toEqual([1000 + 1500, 1000 + 2000])
    // Volées + palier : 1000×2000 + 1000×1000 + 1500×1000.
    const area = polygonArea(layout.outline.flatMap((p) => [p.x, p.y]))
    expect(area).toBeCloseTo(2e6 + 1e6 + 1.5e6)
    expect(layout.flights.reduce((sum, flight) => sum + flight.treads, 0)).toBe(14)
  })

  it('en U : palier de (2 × emmarchement + jour) × emmarchement', () => {
    const stair = createStairElement('E', 'u', 0, 0, { length: 1750, length2: 1750, gap: 100 })
    const layout = stairLayout(stair, 14)
    expect(layout.landing).toEqual({ x: 0, y: 0, width: 2100, height: 1000 })
    expect([layout.width, layout.height]).toEqual([2100, 2750])
    expect(layout.flights.map((f) => f.direction)).toEqual(['up', 'down'])
    expect(layout.flights.reduce((sum, flight) => sum + flight.treads, 0)).toBe(14)
  })

  it('les girons sont répartis sur les volées selon leur longueur', () => {
    const stair = createStairElement('E', 'l', 0, 0, { length: 3000, length2: 1000 })
    const [first, second] = stairLayout(stair, 16).flights
    expect(first.treads).toBe(12)
    expect(second.treads).toBe(4)
  })

  it('placé : position, rotation autour du coin haut-gauche, retournement', () => {
    const stair = { ...createStairElement('E', 'straight', 1000, 2000, { length: 3500 }), rotation: 90 }
    const corners = stairFootprint(stair)
    // Rotation de 90° (sens horaire) autour de (1000, 2000) : l'emprise s'étend vers la gauche.
    const xs = corners.map((p) => Math.round(p.x))
    const ys = corners.map((p) => Math.round(p.y))
    expect([Math.min(...xs), Math.max(...xs)]).toEqual([-2500, 1000])
    expect([Math.min(...ys), Math.max(...ys)]).toEqual([2000, 3000])

    const l = createStairElement('E', 'l', 0, 0, { length: 2000, length2: 1500 })
    const normal = stairFootprint(l).map((p) => p.x)
    const mirrored = stairFootprint({ ...l, mirrored: true }).map((p) => p.x)
    expect(mirrored).toEqual(normal.map((x) => 2500 - x))
  })
})

describe('trémie', () => {
  it('droit 1000 × 3500 mm, marge 50 mm : trou de 1100 × 3600 mm (3,96 m²)', () => {
    const stair = createStairElement('E', 'straight', 500, 500, { length: 3500 })
    const hole = stairVoid(stair)
    const xs = hole.map((p) => p.x)
    const ys = hole.map((p) => p.y)
    expect(Math.max(...xs) - Math.min(...xs)).toBe(1100)
    expect(Math.max(...ys) - Math.min(...ys)).toBe(3600)
    expect(polygonArea(hole.flatMap((p) => [p.x, p.y]))).toBeCloseTo(3.96e6)
    expect([Math.min(...xs), Math.min(...ys)]).toEqual([450, 450])
  })

  it('en L : polygone en L à 6 sommets, agrandi de la marge', () => {
    const stair = createStairElement('E', 'l', 0, 0, { length: 2000, length2: 1500 })
    const hole = stairVoid(stair)
    expect(hole).toHaveLength(6)
    // L de 1000 × 3000 + 1500 × 1000 agrandi de 50 mm : surface plus grande que l'emprise.
    const area = polygonArea(hole.flatMap((p) => [p.x, p.y]))
    expect(area).toBeGreaterThan(4.5e6)
    expect(Math.min(...hole.map((p) => p.x))).toBe(-50)
  })

  it('en U : rectangle englobant (volées, palier et jour central)', () => {
    const stair = createStairElement('E', 'u', 0, 0, { length: 1750, length2: 1750, gap: 100 })
    const hole = stairVoid(stair)
    expect(hole).toHaveLength(4)
    expect(polygonArea(hole.flatMap((p) => [p.x, p.y]))).toBeCloseTo((2100 + 100) * (2750 + 100))
  })

  it('suit l’escalier quand on le déplace', () => {
    const stair = createStairElement('E', 'straight', 0, 0, { length: 3500 })
    const a = stairVoid(stair)
    const b = stairVoid({ ...stair, x: 700, y: -300 })
    expect(b.map((p) => [p.x - 700, p.y + 300])).toEqual(a.map((p) => [p.x, p.y]))
  })
})

describe('offsetPolygon', () => {
  it('agrandit un carré de la marge de chaque côté, quel que soit le sens du contour', () => {
    const square = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ]
    const flat = (points: { x: number; y: number }[]) => points.flatMap((p) => [p.x, p.y])
    expect(polygonArea(flat(offsetPolygon(square, 10)))).toBeCloseTo(120 * 120)
    expect(polygonArea(flat(offsetPolygon([...square].reverse(), 10)))).toBeCloseTo(120 * 120)
  })
})

describe('longueurs par défaut', () => {
  it('un escalier neuf n’est jamais trop court', () => {
    for (const rise of [2500, 2700, 2880, 3000]) {
      for (const shape of ['straight', 'l', 'u'] as const) {
        const lengths = defaultStairLengths(shape, rise)
        const steps = computeStairSteps({ shape, length: lengths.length, length2: lengths.length2 }, rise)!
        expect(steps.tooShort, `${shape} ${rise}`).toBe(false)
      }
    }
  })

  it('droit à 2 700 mm : 3500 mm', () => {
    expect(defaultStairLengths('straight', 2700)).toEqual({ length: 3500 })
  })
})
