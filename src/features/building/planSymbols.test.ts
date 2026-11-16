import { describe, expect, it } from 'vitest'
import { createOpeningElement, createWallElement } from '../documents/elements'
import { buildPlanSymbols } from './planSymbols'

const level = { id: 'n0' }

describe('buildPlanSymbols', () => {
  it('place le symbole d\u2019une porte sur son mur, en coordonnées du plan', () => {
    const wall = createWallElement('Mur', [0, 0, 4000, 0], 200, 2500)
    const door = {
      ...createOpeningElement('door', 'Porte', { wallId: wall.id, segmentIndex: 0, offset: 2000, side: 'left' }),
      width: 900,
    }
    const [symbol] = buildPlanSymbols(wall, [door], level)
    expect(symbol.sourceId).toBe(door.id)
    expect(symbol.levelId).toBe('n0')
    // Découpe de 900 mm centrée sur x = 2000.
    const xs = symbol.cut.map((p) => p.x)
    expect(Math.min(...xs)).toBeCloseTo(1550)
    expect(Math.max(...xs)).toBeCloseTo(2450)
    // Le battant et l'arc vont du côté gauche du mur (y > 0 pour un mur tracé vers +x).
    const ys = symbol.lines.flat().map((p) => p.y)
    expect(Math.max(...ys)).toBeCloseTo(900)
  })

  it('tourne le symbole avec un mur vertical', () => {
    const wall = createWallElement('Mur', [0, 0, 0, 4000], 200, 2500)
    const door = createOpeningElement('door', 'Porte', { wallId: wall.id, segmentIndex: 0, offset: 2000, side: 'left' })
    const [symbol] = buildPlanSymbols(wall, [door], level)
    const ys = symbol.cut.map((p) => p.y)
    expect(Math.min(...ys)).toBeCloseTo(2000 - door.width / 2)
    // Gauche d'un mur tracé vers +y (y vers le bas) : x négatif.
    expect(Math.min(...symbol.lines.flat().map((p) => p.x))).toBeCloseTo(-door.width)
  })

  it('ignore les ouvertures d\u2019un autre mur', () => {
    const wall = createWallElement('Mur', [0, 0, 4000, 0], 200, 2500)
    const door = createOpeningElement('door', 'Porte', { wallId: 'autre', segmentIndex: 0, offset: 2000, side: 'left' })
    expect(buildPlanSymbols(wall, [door], level)).toEqual([])
  })
})
