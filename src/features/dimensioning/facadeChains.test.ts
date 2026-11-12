import { describe, expect, it } from 'vitest'
import type { AxisElement, CanvasElement, OpeningElement, WallElement } from '../../types/document'
import { dimensionGeometry } from '../geometry/dimension'
import { facadeChains } from './facadeChains'
import type { AutoDimension } from './types'

const BASE = { rotation: 0, opacity: 1, locked: false, hidden: false, x: 0, y: 0, levelId: 'L0' }

const wall = (id: string, points: number[], thickness = 200): WallElement => ({
  ...BASE, id, name: id, type: 'wall', points, thickness, height: 2700, fill: '#444',
})
const opening = (id: string, wallId: string, partial: Partial<OpeningElement> = {}): OpeningElement => ({
  ...BASE, id, name: id, type: 'opening', kind: 'window', wallId, segmentIndex: 0, offset: 2900,
  width: 1200, height: 1350, sillHeight: 900, hinge: 'start', side: 'left', ...partial,
})
const axis = (id: string, points: [number, number, number, number]): AxisElement => ({
  ...BASE, levelId: undefined, id, name: id, type: 'axis', points, label: id,
})

const len = (d: AutoDimension) => Math.round(dimensionGeometry(d.points, d.offset)!.length)
const chain = (dims: AutoDimension[], prefix: string) => dims.filter((d) => d.id.startsWith(prefix)).map(len)

/** 5800 × 4000 mm aux axes, murs de 200 mm : façade haute de 6000 mm au nu. */
const box = wall('box', [0, 0, 5800, 0, 5800, 4000, 0, 4000, 0, 0])

describe('chaînes de cotes des façades (Exécution)', () => {
  it('façade de 6000 au nu, fenêtre de 1200 centrée : 2400 · 1200 · 2400, puis 6000', () => {
    const dims = facadeChains([box, opening('f', 'box')])
    expect(chain(dims, 'facade-top-openings')).toEqual([2400, 1200, 2400])
    expect(chain(dims, 'facade-total-top')).toEqual([6000])
    expect(chain(dims, 'facade-left-openings')).toEqual([])
    expect(chain(dims, 'facade-total-left')).toEqual([4200])
  })

  it('les chaînes s’éloignent de la façade dans l’ordre 1, 2, 3, à l’extérieur', () => {
    const refend = wall('r', [2000, 0, 2000, 4000])
    const dims = facadeChains([box, refend, opening('f', 'box')])
    const y = (prefix: string) => {
      const d = dims.find((dim) => dim.id.startsWith(prefix))!
      return dimensionGeometry(d.points, d.offset)!.line[0].y
    }
    expect(y('facade-top-openings')).toBe(-900)
    expect(y('facade-top-walls')).toBe(-1500)
    expect(y('facade-total-top')).toBe(-2100)
  })

  it('chaîne 2 : axe d’un mur de refend et axe de construction', () => {
    const refend = wall('r', [2000, 0, 2000, 4000])
    const dims = facadeChains([box, refend, axis('B', [4000, -2000, 4000, 6000])])
    // De -100 à 2000 (refend), à 4000 (axe B), à 5900.
    expect(chain(dims, 'facade-top-walls')).toEqual([2100, 2000, 1900])
    expect(chain(dims, 'facade-bottom-walls')).toEqual([2100, 2000, 1900])
    // Le refend vertical ne coupe pas les façades gauche et droite.
    expect(chain(dims, 'facade-left-walls')).toEqual([])
  })

  it('une façade en retrait : les bords des faces vues découpent la chaîne 1', () => {
    // Plan en L : retrait de 2000 en haut à droite.
    const l = wall('l', [0, 0, 3000, 0, 3000, 2000, 6000, 2000, 6000, 5000, 0, 5000, 0, 0])
    const dims = facadeChains([l])
    // Face haute de -100 à 3100, puis face du retrait de 3100 à 6100.
    expect(chain(dims, 'facade-top-openings')).toEqual([3200, 3000])
    expect(chain(dims, 'facade-total-top')).toEqual([6200])
  })

  it('une ouverture d’un mur intérieur n’entre pas dans la chaîne de façade', () => {
    const inner = wall('i', [0, 2000, 5800, 2000])
    const dims = facadeChains([box, inner, opening('p', 'i', { kind: 'door' })])
    expect(chain(dims, 'facade-top-openings')).toEqual([])
  })

  it('rien sans mur visible', () => {
    const elements: CanvasElement[] = [{ ...box, hidden: true }]
    expect(facadeChains(elements)).toEqual([])
  })
})
