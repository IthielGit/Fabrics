import { describe, expect, it } from 'vitest'
import type { CanvasElement, OpeningElement, RoomElement, WallElement } from '../../types/document'
import { computeBuildingMeasurements } from './measurements'
import { blockingSurfaceWarnings, isBlockingWarning, metresWarnings } from './warnings'

const BASE = { rotation: 0, opacity: 1, locked: false, hidden: false, x: 0, y: 0 }
const L0 = { id: 'L0', name: 'Rez', elevation: 0, height: 2700, slabThickness: 200 }
const L1 = { id: 'L1', name: 'Étage', elevation: 2700, height: 2700, slabThickness: 200 }
const rect = (x0: number, y0: number, x1: number, y1: number) => [x0, y0, x1, y0, x1, y1, x0, y1]
const room = (id: string, points: number[], extra: Partial<RoomElement> = {}): RoomElement => ({
  ...BASE, id, name: id, type: 'room', points, fill: '#0a0', showLabel: true, levelId: 'L0', ...extra,
})
const wall = (id: string, points: number[], extra: Partial<WallElement> = {}): WallElement => ({
  ...BASE, id, name: id, type: 'wall', points, thickness: 200, height: 2500, fill: '#444', levelId: 'L0', ...extra,
})
const opening = (id: string, offset: number, width: number): OpeningElement => ({
  ...BASE, id, name: id, type: 'opening', kind: 'window', wallId: 'nord', segmentIndex: 0, offset,
  width, height: 1000, sillHeight: 900, hinge: 'start', side: 'left', levelId: 'L0',
})
const BOX = [
  wall('nord', [0, 0, 4000, 0]),
  wall('est', [4000, 0, 4000, 3000]),
  wall('sud', [4000, 3000, 0, 3000]),
  wall('ouest', [0, 3000, 0, 0]),
]
const check = (elements: CanvasElement[], levelId?: string) => {
  const document = { elements, levels: [L0, L1] }
  return metresWarnings(document, computeBuildingMeasurements(document), levelId)
}

describe('metresWarnings', () => {
  it('plan propre : aucun avertissement', () => {
    expect(check([...BOX, room('Salon', rect(100, 100, 3900, 2900)), opening('f', 2000, 1200)])).toEqual([])
  })

  it('pièce qui laisse une bande le long du mur est : surface et repère du mur', () => {
    const warnings = check([...BOX, room('Salon', rect(100, 100, 3800, 2900))])
    expect(warnings).toHaveLength(1)
    const [w] = warnings
    expect(w.kind).toBe('coverageGap')
    if (w.kind !== 'coverageGap') return
    expect(w.roomName).toBe('Salon')
    expect(w.area).toBeCloseTo(280_000)
    expect(w.wallRef).toMatch(/^M\d\d$/)
  })

  it('pièces superposées et pièce masquée', () => {
    const kinds = check([
      room('A', rect(0, 0, 2000, 2000)),
      room('B', rect(1000, 0, 3000, 2000), { hidden: true }),
    ]).map((w) => w.kind)
    expect(kinds).toEqual(['roomOverlap', 'hiddenRoom'])
  })

  it('éléments sans niveau : signalés (pas les axes)', () => {
    const lost = wall('perdu', [0, 0, 1000, 0], { levelId: undefined })
    const axis = { ...BASE, id: 'ax', name: 'A', type: 'axis', points: [0, 0, 0, 1000], label: 'A' } as CanvasElement
    const warnings = check([lost, axis])
    expect(warnings).toEqual([{ kind: 'noLevel', elementId: 'perdu', elementName: 'perdu', elementType: 'wall' }])
  })

  it('ouverture qui dépasse de son segment et ouvertures qui se chevauchent', () => {
    const kinds = check([...BOX, room('Salon', rect(100, 100, 3900, 2900)), opening('a', 3800, 1000), opening('b', 1000, 1200), opening('c', 1500, 1200)])
      .map((w) => w.kind)
    expect(kinds).toEqual(['openingOutside', 'openingOverlap'])
  })

  it('limité à un niveau : les autres niveaux sont ignorés', () => {
    const upstairs = room('Haut', rect(0, 0, 1000, 1000), { levelId: 'L1', hidden: true })
    expect(check([upstairs], 'L0')).toEqual([])
    expect(check([upstairs], 'L1').map((w) => w.kind)).toEqual(['hiddenRoom'])
  })
})

describe('isBlockingWarning', () => {
  it('manque et débord bloquent l’export ; le reste est seulement signalé', () => {
    const warnings = check([
      ...BOX,
      room('Salon', rect(100, 100, 3800, 2900)),
      room('Masquée', rect(5000, 0, 6000, 1000), { hidden: true }),
    ])
    expect(warnings.filter(isBlockingWarning).map((w) => w.kind)).toEqual(['coverageGap'])
    expect(warnings.filter((w) => !isBlockingWarning(w)).map((w) => w.kind)).toEqual(['hiddenRoom'])
  })
})

describe('blockingSurfaceWarnings', () => {
  it('bâtiment entier par défaut, ou un seul niveau', () => {
    const document = {
      elements: [...BOX, room('Salon', rect(100, 100, 3800, 2900))],
      levels: [L0, L1],
    }
    expect(blockingSurfaceWarnings(document).map((w) => w.kind)).toEqual(['coverageGap'])
    expect(blockingSurfaceWarnings(document, 'L1')).toEqual([])
  })
})
