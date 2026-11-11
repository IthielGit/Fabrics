import { describe, expect, it } from 'vitest'
import type { Level } from '../../types/document'
import { createChimneyElement } from '../documents/elements'
import { elementBounds } from '../export/bounds'
import { rotateSelectionQuarterTurn } from '../geometry/rotateSelection'
import { applyNodeTransform } from '../geometry/transform'
import { buildChimney, chimneyFootprint, chimneyRisesThrough } from './chimney'
import { buildBuildingModel } from './model'

const level = (id: string, elevation: number): Level => ({
  id,
  name: id,
  elevation,
  height: 2700,
  slabThickness: 200,
})
const N0 = level('n0', 0)
const N1 = level('n1', 2700)
const N2 = level('n2', 5400)
const LEVELS = [N0, N1, N2]

const chimney = (overrides = {}) => ({
  ...createChimneyElement('Cheminée 1', 1000, 2000, 600, 500, 800),
  levelId: 'n0',
  ...overrides,
})

describe('cheminée : emprise', () => {
  it('quatre coins à partir du coin haut-gauche', () => {
    expect(chimneyFootprint(chimney())).toEqual([
      { x: 1000, y: 2000 },
      { x: 1600, y: 2000 },
      { x: 1600, y: 2500 },
      { x: 1000, y: 2500 },
    ])
  })

  it('tourne autour de son coin haut-gauche', () => {
    const corners = chimneyFootprint(chimney({ rotation: 90 }))
    expect(corners[1].x).toBeCloseTo(1000)
    expect(corners[1].y).toBeCloseTo(2600)
    expect(elementBounds(chimney({ rotation: 90 }))).toMatchObject({ width: 500, height: 600 })
  })
})

describe('cheminée : niveaux traversés', () => {
  it('apparaît en fantôme sur les niveaux au-dessus du sien, pas sur le sien ni en dessous', () => {
    const c = chimney({ levelId: 'n1' })
    expect(chimneyRisesThrough(c, LEVELS, 'n0')).toBe(false)
    expect(chimneyRisesThrough(c, LEVELS, 'n1')).toBe(false)
    expect(chimneyRisesThrough(c, LEVELS, 'n2')).toBe(true)
  })

  it('une cheminée sans niveau part du premier niveau', () => {
    const c = chimney({ levelId: undefined })
    expect(chimneyRisesThrough(c, LEVELS, 'n1')).toBe(true)
    expect(chimneyRisesThrough(c, LEVELS, 'n0')).toBe(false)
  })
})

describe('cheminée en 3D', () => {
  it('du plancher de son niveau jusqu’au dessus du dernier niveau + le dépassement', () => {
    const piece = buildChimney(chimney(), N0, LEVELS)!
    // Dernier niveau : 5400 + 2700 = 8100 ; + 800 de dépassement ; depuis le plancher (0).
    expect(piece.size.y).toBe(8900)
    expect(piece.center.y).toBe(4450)
    expect(piece.size.x).toBe(600)
    expect(piece.size.z).toBe(500)
    expect(piece.center.x).toBe(1300)
    expect(piece.center.z).toBe(2250)
  })

  it('part du plancher de son propre niveau', () => {
    const piece = buildChimney(chimney({ levelId: 'n1' }), N1, LEVELS)!
    expect(piece.center.y - piece.size.y / 2).toBe(2700)
    expect(piece.center.y + piece.size.y / 2).toBe(8900)
  })

  it('suit sa rotation', () => {
    const piece = buildChimney(chimney({ rotation: 90 }), N0, LEVELS)!
    expect(piece.rotationY).toBeCloseTo(-Math.PI / 2)
  })

  it('ne perce pas les dalles : les pièces du modèle ne changent pas', () => {
    const room = { id: 'r', type: 'room' as const, name: 'P', x: 0, y: 0, rotation: 0, opacity: 1, locked: false, hidden: false, points: [0, 0, 5000, 0, 5000, 4000, 0, 4000], fill: '#fff', showLabel: true, levelId: 'n1' }
    const without = buildBuildingModel({ elements: [room], levels: LEVELS })
    const withChimney = buildBuildingModel({ elements: [room, chimney()], levels: LEVELS })
    expect(withChimney.chimneys).toHaveLength(1)
    expect(withChimney.slabs).toEqual(without.slabs)
    expect(withChimney.slabs.every((s) => s.holes === undefined)).toBe(true)
  })

  it('le modèle l’inclut dans l’emprise, et la vue « étage ouvert » s’arrête au niveau affiché', () => {
    const all = buildBuildingModel({ elements: [chimney()], levels: LEVELS })
    expect(all.bounds!.max.y).toBe(8900)
    const open = buildBuildingModel({ elements: [chimney()], levels: LEVELS }, { upToLevelId: 'n1' })
    expect(open.chimneys[0].size.y).toBe(2700 + 2700 + 800)
  })

  it('une cheminée masquée n’apparaît pas', () => {
    const model = buildBuildingModel({ elements: [chimney({ hidden: true })], levels: LEVELS })
    expect(model.chimneys).toHaveLength(0)
  })
})

describe('cheminée : édition', () => {
  it('Maj + R : quart de tour sur place', () => {
    const c = chimney()
    const before = elementBounds(c)!
    const [turned] = rotateSelectionQuarterTurn([c])
    const after = elementBounds(turned)!
    expect([after.width, after.height]).toEqual([500, 600])
    expect(after.x + after.width / 2).toBeCloseTo(before.x + before.width / 2)
    expect(after.y + after.height / 2).toBeCloseTo(before.y + before.height / 2)
  })

  it('se redimensionne à la poignée (mm entiers, jamais sous 100 mm)', () => {
    const resized = applyNodeTransform(chimney(), { x: 1000, y: 2000, rotation: 0, scaleX: 1.5, scaleY: 0.1 })
    expect(resized.type === 'chimney' && [resized.width, resized.depth]).toEqual([900, 100])
  })
})
