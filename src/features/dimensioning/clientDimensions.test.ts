import { describe, expect, it } from 'vitest'
import type { CanvasElement, RoomElement, WallElement } from '../../types/document'
import { dimensionGeometry } from '../geometry/dimension'
import { computeMeasurements } from '../measurements/measurements'
import { clientDimensions } from './clientDimensions'
import type { AutoDimension } from './types'

const BASE = { rotation: 0, opacity: 1, locked: false, hidden: false, x: 0, y: 0, levelId: 'L0' }

const wall = (id: string, points: number[], thickness = 200): WallElement => ({
  ...BASE, id, name: id, type: 'wall', points, thickness, height: 2700, fill: '#444',
})
const room = (id: string, name: string, points: number[], partial: Partial<RoomElement> = {}): RoomElement => ({
  ...BASE, id, name, type: 'room', points, fill: '#eee', showLabel: true, ...partial,
})

const run = (elements: CanvasElement[]) => clientDimensions(elements, computeMeasurements(elements).rooms)
const length = (d: AutoDimension) => Math.round(dimensionGeometry(d.points, d.offset)!.length)

/** Bâtiment de 8000 × 6000 mm aux axes, murs de 200 mm (un seul tracé fermé). */
const box = wall('box', [0, 0, 8000, 0, 8000, 6000, 0, 6000, 0, 0])

describe('cotes Client', () => {
  it('cote les dimensions extérieures totales : 8200 et 6200 pour 8000 × 6000 aux axes', () => {
    const { dimensions } = run([box])
    const outer = dimensions.filter((d) => d.id.startsWith('outer'))
    expect(outer.map(length)).toEqual([8200, 6200, 8200, 6200])
  })

  it('place les cotes extérieures hors du bâtiment', () => {
    const { dimensions } = run([box])
    for (const d of dimensions) {
      const { center } = dimensionGeometry(d.points, d.offset)!
      const inside = center.x > -100 && center.x < 8100 && center.y > -100 && center.y < 6100
      expect(inside).toBe(false)
    }
  })

  it('pièce rectangulaire : nom, 4000 × 3000 et 12,00 m², sans autre cote à l’intérieur', () => {
    const chambre = room('r1', 'Chambre', [100, 100, 4100, 100, 4100, 3100, 100, 3100])
    const { dimensions, labels } = run([box, chambre])
    expect(labels).toEqual([{ id: 'room-r1', x: 2100, y: 1600, lines: ['Chambre', '4000 × 3000', '12,00 m²'] }])
    expect(dimensions.filter((d) => !d.id.startsWith('outer'))).toEqual([])
  })

  it('pièce d’une autre forme : une cote par côté, tournée vers l’intérieur', () => {
    // L de 4000 × 4000 amputé d'un carré de 2000 × 2000 en haut à droite (12,00 m²).
    const l = room('l', 'Séjour', [0, 0, 2000, 0, 2000, 2000, 4000, 2000, 4000, 4000, 0, 4000])
    const { dimensions, labels } = run([l])
    expect(labels[0].lines).toEqual(['Séjour', '12,00 m²'])
    expect(dimensions.map(length)).toEqual([2000, 2000, 2000, 2000, 4000, 4000])
    // Le côté du bas (y = 4000) a sa cote au-dessus, donc dans la pièce.
    const bottom = dimensions.find((d) => d.points[1] === 4000 && d.points[3] === 4000)!
    expect(dimensionGeometry(bottom.points, bottom.offset)!.center.y).toBeLessThan(4000)
  })

  it('le sens du tracé ne change pas le côté de la cote', () => {
    const reversed = room('l', 'Séjour', [0, 4000, 4000, 4000, 4000, 2000, 2000, 2000, 2000, 0, 0, 0])
    const bottom = run([reversed]).dimensions.find((d) => d.points[1] === 4000 && d.points[3] === 4000)!
    expect(dimensionGeometry(bottom.points, bottom.offset)!.center.y).toBeLessThan(4000)
  })

  it('la surface affichée est celle des métrés (trémie déduite)', () => {
    const chambre = room('r1', 'Chambre', [0, 0, 4000, 0, 4000, 3000, 0, 3000])
    const measures = computeMeasurements([chambre]).rooms.map((r) => ({ ...r, netArea: 10_000_000 }))
    expect(clientDimensions([chambre], measures).labels[0].lines[2]).toBe('10,00 m²')
  })

  it('ignore les éléments masqués ; rien à coter sans mur ni pièce', () => {
    expect(run([{ ...box, hidden: true }])).toEqual({ dimensions: [], labels: [] })
    expect(run([])).toEqual({ dimensions: [], labels: [] })
  })
})
