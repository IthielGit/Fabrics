import { describe, expect, it } from 'vitest'
import type { OpeningElement, WallElement } from '../../types/document'
import { createOpeningElement, createWallElement } from '../documents/elements'
import { computeMeasurements } from '../measurements/measurements'
import { joinWalls, joinWallsInDocument } from './joinWalls'
import { splitWallInDocument } from './splitWall'

const RECT = [0, 0, 4000, 0, 4000, 3000, 0, 3000, 0, 0]

function wall(points: number[], patch: Partial<WallElement> = {}): WallElement {
  return { ...createWallElement('', points, 200, 2500), material: 'brick', levelId: 'L1', ...patch }
}

function door(wallId: string, segmentIndex: number, offset: number): OpeningElement {
  return {
    ...createOpeningElement('door', '', { wallId, segmentIndex, offset, side: 'left' }),
    width: 900,
    hinge: 'start',
  }
}

describe('joindre des murs', () => {
  it('deux murs bout à bout donnent un seul tracé', () => {
    const a = wall([0, 0, 3000, 0])
    const b = wall([3000, 0, 3000, 2000])
    const result = joinWalls([a, b], [])
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.wall.points).toEqual([0, 0, 3000, 0, 3000, 2000])
    expect(result.wall.id).toBe(a.id)
    expect(result.absorbedIds).toEqual([b.id])
  })

  it('retourne un mur dessiné à l’envers et ses ouvertures', () => {
    const a = wall([0, 0, 3000, 0])
    const b = wall([3000, 2000, 3000, 0]) // dessiné de bas en haut… à l’envers du sens de la chaîne
    const d = door(b.id, 0, 500) // à 500 mm du bout (3000, 2000)
    const result = joinWalls([a, b], [d])
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.wall.points).toEqual([0, 0, 3000, 0, 3000, 2000])
    expect(result.openings).toHaveLength(1)
    expect(result.openings[0]).toMatchObject({
      wallId: a.id,
      segmentIndex: 1,
      offset: 1500, // 2000 - 500 : même endroit, compté depuis (3000, 0)
      hinge: 'end',
      side: 'right',
    })
  })

  it('garde la place des ouvertures d’un mur pris dans le bon sens', () => {
    const a = wall([0, 0, 3000, 0])
    const b = wall([3000, 0, 3000, 2000])
    const result = joinWalls([a, b], [door(a.id, 0, 700), door(b.id, 0, 900)])
    if (!result.ok) throw new Error('attendu : joint')
    expect(result.openings.map((o) => [o.segmentIndex, o.offset, o.hinge])).toEqual([
      [0, 700, 'start'],
      [1, 900, 'start'],
    ])
  })

  it('une chaîne fermée de quatre murs donne le contour d’origine (aller-retour avec Séparer)', () => {
    const original = wall(RECT)
    const split = splitWallInDocument([original], original.id)!
    const result = joinWallsInDocument(split.elements, split.wallIds)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.elements).toHaveLength(1)
    expect((result.elements[0] as WallElement).points).toEqual(RECT)
  })

  it('les métrés ne changent pas : longueur totale et surface des murs', () => {
    const parts = [wall([0, 0, 3000, 0]), wall([3000, 0, 3000, 2000]), wall([3000, 2000, 5000, 2000])]
    const before = computeMeasurements(parts).walls
    const joined = joinWallsInDocument(parts, parts.map((p) => p.id))
    if (!joined.ok) throw new Error('attendu : joint')
    const after = computeMeasurements(joined.elements).walls
    const sum = (list: typeof before, key: 'length' | 'wallArea') => list.reduce((s, w) => s + w[key], 0)
    expect(sum(after, 'length')).toBeCloseTo(sum(before, 'length'))
    expect(sum(after, 'wallArea')).toBeCloseTo(sum(before, 'wallArea'))
  })

  it('refuse des épaisseurs, hauteurs, matériaux ou niveaux différents', () => {
    const a = wall([0, 0, 3000, 0])
    const next = [3000, 0, 3000, 2000]
    expect(joinWalls([a, wall(next, { thickness: 150 })], [])).toEqual({ ok: false, problem: 'thickness' })
    expect(joinWalls([a, wall(next, { height: 2700 })], [])).toEqual({ ok: false, problem: 'height' })
    expect(joinWalls([a, wall(next, { material: 'wood' })], [])).toEqual({ ok: false, problem: 'material' })
    expect(joinWalls([a, wall(next, { levelId: 'L2' })], [])).toEqual({ ok: false, problem: 'level' })
  })

  it('refuse des murs qui ne se touchent pas, qui se croisent en T ou qui sont verrouillés', () => {
    const a = wall([0, 0, 3000, 0])
    expect(joinWalls([a, wall([3500, 0, 3500, 2000])], [])).toEqual({ ok: false, problem: 'notChained' })
    const t = joinWalls([a, wall([3000, 0, 3000, 2000]), wall([3000, 0, 3000, -2000])], [])
    expect(t).toEqual({ ok: false, problem: 'notChained' })
    expect(joinWalls([a, wall([3000, 0, 3000, 2000], { locked: true })], [])).toEqual({
      ok: false,
      problem: 'locked',
    })
    expect(joinWalls([a], [])).toEqual({ ok: false, problem: 'few' })
  })

  it('un nom tapé est gardé, un nom automatique reste vide', () => {
    const a = wall([0, 0, 3000, 0])
    const b = wall([3000, 0, 3000, 2000], { name: 'Façade' })
    const result = joinWalls([a, b], [])
    if (!result.ok) throw new Error('attendu : joint')
    expect(result.wall.name).toBe('Façade')
  })
})
