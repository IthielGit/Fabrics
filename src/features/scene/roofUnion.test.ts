import { describe, expect, it } from 'vitest'
import { adjustRoofPans, type Pt, type RoofPanInput } from './roofUnion'

const rect = (x0: number, y0: number, x1: number, y1: number): Pt[] => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]
const pan = (id: string, kind: string, corners: Pt[], eave: number, factor = 1): RoofPanInput => {
  const w = Math.abs(corners[1][0] - corners[0][0]) || Math.abs(corners[1][1] - corners[0][1])
  const d = Math.abs(corners[2][1] - corners[1][1]) || Math.abs(corners[2][0] - corners[1][0])
  return { id, kind, corners, projectedArea: w * d, realArea: w * d * factor, eaveLength: eave, ridgeLength: 0, hipLength: 0 }
}

describe('toiture de plusieurs pans comptée sur leur réunion (D20-15 : A)', () => {
  it('pans séparés : quantités inchangées', () => {
    const out = adjustRoofPans([pan('a', 'shed', rect(0, 0, 4000, 3000), 4000), pan('b', 'shed', rect(5000, 0, 9000, 3000), 4000)])
    expect(out.map((o) => o.overlapping)).toEqual([false, false])
    expect(out[0].projectedArea).toBe(12_000_000)
  })

  it('deux pans qui se recouvrent de 600 mm : la bande est comptée une fois, au premier pan', () => {
    // Pan a : 0 → 4000 × 0 → 3600 ; pan b : 0 → 4000 × 3000 → 6000 (recouvrement 4000 × 600).
    const a = pan('a', 'shed', rect(0, 0, 4000, 3600), 4000, 1.5)
    const b = pan('b', 'shed', rect(0, 3000, 4000, 6000), 4000, 1.5)
    const [qa, qb] = adjustRoofPans([a, b])
    expect(qa.projectedArea).toBe(14_400_000)
    expect(qb.projectedArea).toBeCloseTo(9_600_000, 3)
    expect(qa.projectedArea + qb.projectedArea).toBeCloseTo(24_000_000, 3)
    expect(qb.realArea).toBeCloseTo(9_600_000 * 1.5, 3)
    expect([qa.toCheck, qb.toCheck]).toEqual([false, false])
  })

  it('égouts : un égout sous un autre pan ou recouvert par un pan précédent ne compte pas', () => {
    // Un pan descend vers son +z local (côté 2 : coins 2 → 3). Pan a : égout en y = 3600 (sous le pan b).
    const a = pan('a', 'shed', rect(0, 0, 4000, 3600), 4000)
    const b = pan('b', 'shed', rect(0, 3000, 4000, 6000), 4000)
    const [qa, qb] = adjustRoofPans([a, b])
    expect(qa.eaveLength).toBe(0)
    expect(qb.eaveLength).toBeCloseTo(4000, 6)
  })

  it('forme à plusieurs pentes recouverte : point à vérifier', () => {
    const [qa] = adjustRoofPans([pan('a', 'mansard', rect(0, 0, 4000, 3600), 8000), pan('b', 'shed', rect(0, 3000, 4000, 6000), 4000)])
    expect(qa.toCheck).toBe(true)
  })
})
