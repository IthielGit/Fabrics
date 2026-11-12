import { describe, expect, it } from 'vitest'
import type { CanvasElement, OpeningElement, WallElement } from '../../types/document'
import { buildReferences } from './references'

const BASE = { rotation: 0, opacity: 1, locked: false, hidden: false, x: 0, y: 0 }
const L0 = { id: 'L0', name: 'Rez', elevation: 0, height: 2700, slabThickness: 200 }
const L1 = { id: 'L1', name: 'Étage', elevation: 2900, height: 2700, slabThickness: 200 }

const wall = (id: string, points: number[], levelId = 'L0'): WallElement => ({
  ...BASE, id, name: id, type: 'wall', points, thickness: 200, height: 2500, fill: '#444', levelId,
})

const opening = (id: string, wallId: string, partial: Partial<OpeningElement> = {}): OpeningElement => ({
  ...BASE, id, name: id, type: 'opening', kind: 'door', wallId, segmentIndex: 0, offset: 1000,
  width: 900, height: 2100, sillHeight: 0, hinge: 'start', side: 'left', levelId: 'L0', ...partial,
})

describe('repères M01, P01, F01', () => {
  it('numérote de haut en bas puis de gauche à droite', () => {
    const elements: CanvasElement[] = [
      wall('bas', [0, 5000, 4000, 5000]),
      wall('haut-droite', [3000, 0, 6000, 0]),
      wall('haut-gauche', [0, 0, 2000, 0]),
    ]
    const { walls } = buildReferences({ elements, levels: [L0] })
    expect(walls.get('haut-gauche')).toBe('M01')
    expect(walls.get('haut-droite')).toBe('M02')
    expect(walls.get('bas')).toBe('M03')
  })

  it('numérote niveau par niveau, de façon continue dans le bâtiment', () => {
    const elements: CanvasElement[] = [wall('etage', [0, 0, 4000, 0], 'L1'), wall('rez', [0, 3000, 4000, 3000])]
    const { walls } = buildReferences({ elements, levels: [L1, L0] })
    expect(walls.get('rez')).toBe('M01')
    expect(walls.get('etage')).toBe('M02')
  })

  it('P pour les portes, F pour les fenêtres et les baies (même compteur)', () => {
    const elements: CanvasElement[] = [
      wall('m', [0, 0, 6000, 0]),
      opening('f2', 'm', { kind: 'bay', offset: 4000 }),
      opening('p1', 'm', { offset: 500 }),
      opening('f1', 'm', { kind: 'window', offset: 2000 }),
    ]
    const { openings } = buildReferences({ elements, levels: [L0] })
    expect(openings.get('p1')).toBe('P01')
    expect(openings.get('f1')).toBe('F01')
    expect(openings.get('f2')).toBe('F02')
  })

  it('est stable : le même document donne les mêmes repères', () => {
    const elements: CanvasElement[] = [wall('a', [0, 0, 1000, 0]), wall('b', [0, 0, 1000, 0])]
    const first = buildReferences({ elements, levels: [L0] }).walls
    const second = buildReferences({ elements: [...elements].reverse(), levels: [L0] }).walls
    expect([...first]).toEqual([...second])
  })
})
