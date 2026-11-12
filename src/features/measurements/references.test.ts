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

  it('deux murs à y = 749 et y = 751 sont sur la même ligne : on lit de gauche à droite', () => {
    const elements: CanvasElement[] = [
      wall('droite', [1000, 751, 2000, 751]),
      wall('gauche', [0, 749, 1000, 749]),
    ]
    const { walls } = buildReferences({ elements, levels: [L0] })
    expect(walls.get('gauche')).toBe('M01')
    expect(walls.get('droite')).toBe('M02')
  })

  it('un écart de plus de 500 mm change de ligne, même avec x plus petit', () => {
    const elements: CanvasElement[] = [
      wall('dessous', [0, 1300, 1000, 1300]),
      wall('dessus', [5000, 0, 6000, 0]),
    ]
    const { walls } = buildReferences({ elements, levels: [L0] })
    expect(walls.get('dessus')).toBe('M01')
    expect(walls.get('dessous')).toBe('M02')
  })

  it('une ouverture hors de son segment est classée au bout du segment', () => {
    // Mur de 6000 mm ; « loin » est à offset 9000, donc ramenée à 6000, après « milieu » (3000).
    const elements: CanvasElement[] = [
      wall('m', [0, 0, 6000, 0]),
      opening('loin', 'm', { kind: 'window', offset: 9000 }),
      opening('milieu', 'm', { kind: 'window', offset: 3000 }),
      opening('avant', 'm', { kind: 'window', offset: -500 }),
    ]
    const { openings } = buildReferences({ elements, levels: [L0] })
    expect(openings.get('avant')).toBe('F01')
    expect(openings.get('milieu')).toBe('F02')
    expect(openings.get('loin')).toBe('F03')
  })

  it('99 murs : deux chiffres ; 100 murs : trois chiffres pour tous les murs', () => {
    const many = (count: number): CanvasElement[] =>
      Array.from({ length: count }, (_, i) => wall(`w${i}`, [i * 1000, 0, i * 1000 + 500, 0]))
    const small = buildReferences({ elements: many(99), levels: [L0] }).walls
    expect(small.get('w0')).toBe('M01')
    expect(small.get('w98')).toBe('M99')
    const large = buildReferences({ elements: many(100), levels: [L0] }).walls
    expect(large.get('w0')).toBe('M001')
    expect(large.get('w99')).toBe('M100')
  })

  it('la largeur se décide par type : 100 murs n’allongent pas les repères des portes', () => {
    const elements: CanvasElement[] = [
      ...Array.from({ length: 100 }, (_, i) => wall(`w${i}`, [i * 1000, 0, i * 1000 + 500, 0])),
      opening('p', 'w0', { offset: 100 }),
    ]
    const { walls, openings } = buildReferences({ elements, levels: [L0] })
    expect(walls.get('w0')).toBe('M001')
    expect(openings.get('p')).toBe('P01')
  })
})
