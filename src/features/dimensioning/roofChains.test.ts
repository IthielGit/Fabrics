import { describe, expect, it } from 'vitest'
import { roofChains } from './roofChains'

type Pt = [number, number]
const len = (d: { points: number[] }) => Math.round(Math.hypot(d.points[2] - d.points[0], d.points[3] - d.points[1]))

describe('cotes du plan de toiture (M20 20.1b)', () => {
  it('rectangle : seulement la cote d’ensemble de chaque côté', () => {
    const dims = roofChains([{ outer: [[0, 0], [8000, 0], [8000, 6000], [0, 6000]], holes: [] }])
    expect(dims.map((d) => [d.id, len(d)])).toEqual([
      ['roof-top-total', 8000],
      ['roof-right-total', 6000],
      ['roof-bottom-total', 8000],
      ['roof-left-total', 6000],
    ])
    // À l'extérieur : en haut au-dessus (décalage négatif), à gauche à gauche (positif).
    expect(dims[0].offset).toBe(-800)
    expect(dims[3].offset).toBe(800)
  })

  it('contour en L : la chaîne suit les redents vus de chaque côté, la cote d’ensemble est plus loin', () => {
    const L: Pt[] = [[0, 0], [4000, 0], [4000, 2000], [7000, 2000], [7000, 5000], [0, 5000]]
    const dims = roofChains([{ outer: L, holes: [] }])
    const side = (s: string) => dims.filter((d) => d.id.startsWith(`roof-${s}-`)).map(len)
    expect(side('top')).toEqual([4000, 3000, 7000])
    expect(side('right')).toEqual([2000, 3000, 5000])
    expect(side('bottom')).toEqual([7000])
    expect(side('left')).toEqual([5000])
    expect(dims.find((d) => d.id === 'roof-top-total')!.offset).toBe(-1400)
  })

  it('sans contour : aucune cote', () => {
    expect(roofChains([])).toEqual([])
  })
})
