import { describe, expect, it } from 'vitest'
import type { CanvasElement, OpeningElement, WallElement } from '../../types/document'
import { createOpeningElement, createWallElement } from '../documents/elements'
import { computeMeasurements } from '../measurements/measurements'
import { computeWallJoins } from './wallJoins'
import {
  canSplitWall,
  cutWall,
  cutWallInDocument,
  cutWallProblem,
  snapCutOffset,
  splitWall,
  splitWallInDocument,
} from './splitWall'

const RECT = [0, 0, 4000, 0, 4000, 3000, 0, 3000, 0, 0] // pièce fermée, 4 côtés

function wall(points: number[]): WallElement {
  return { ...createWallElement('Mur', points, 200, 2500), material: 'brick', levelId: 'L1', locked: true }
}

function counter() {
  let n = 0
  return () => `id-${++n}`
}

describe('séparer les côtés d’un mur', () => {
  it('une pièce fermée donne quatre murs, le premier garde l’identifiant', () => {
    const w = wall(RECT)
    const result = splitWall(w, [], counter())!
    expect(result.walls).toHaveLength(4)
    expect(result.walls[0].id).toBe(w.id)
    expect(result.walls.map((p) => p.points)).toEqual([
      [0, 0, 4000, 0],
      [4000, 0, 4000, 3000],
      [4000, 3000, 0, 3000],
      [0, 3000, 0, 0],
    ])
    expect(new Set(result.walls.map((p) => p.id)).size).toBe(4)
    // Nom automatique (D58) : chaque morceau prend le sien, plus de « Mur 1 1 ».
    expect(result.walls.map((p) => p.name)).toEqual(['', '', '', ''])
  })

  it('un nom tapé à la main est gardé et numéroté', () => {
    const named = { ...wall(RECT), name: 'Façade' }
    expect(splitWall(named, [])!.walls.map((p) => p.name)).toEqual(['Façade 1', 'Façade 2', 'Façade 3', 'Façade 4'])
  })

  it('chaque côté garde épaisseur, hauteur, matériau, niveau et verrouillage', () => {
    for (const part of splitWall(wall(RECT), [])!.walls) {
      expect(part).toMatchObject({
        thickness: 200,
        height: 2500,
        material: 'brick',
        levelId: 'L1',
        locked: true,
        type: 'wall',
      })
    }
  })

  it('une polyligne ouverte en L donne deux murs', () => {
    expect(splitWall(wall([0, 0, 3000, 0, 3000, 2000]), [])!.walls).toHaveLength(2)
  })

  it('un mur droit n’a rien à séparer', () => {
    const straight = wall([0, 0, 3000, 0])
    expect(canSplitWall(straight)).toBe(false)
    expect(splitWall(straight, [])).toBeNull()
    expect(canSplitWall(wall(RECT))).toBe(true)
  })

  it('un sommet en double ne crée pas de mur de longueur nulle', () => {
    const result = splitWall(wall([0, 0, 3000, 0, 3000, 0, 3000, 2000]), [])!
    expect(result.walls.map((p) => p.points)).toEqual([
      [0, 0, 3000, 0],
      [3000, 0, 3000, 2000],
    ])
    expect(splitWall(wall([0, 0, 3000, 0, 3000, 0]), [])).toBeNull()
  })

  it('les ouvertures passent sur le mur de leur côté, à la même place', () => {
    const w = wall(RECT)
    const onSide0 = createOpeningElement('door', 'Porte', { wallId: w.id, segmentIndex: 0, offset: 1000, side: 'left' })
    const onSide2 = createOpeningElement('window', 'Fenêtre', { wallId: w.id, segmentIndex: 2, offset: 1500, side: 'right' })
    const other = createOpeningElement('window', 'Autre', { wallId: 'ailleurs', segmentIndex: 0, offset: 500, side: 'left' })
    const result = splitWall(w, [onSide0, onSide2, other], counter())!
    expect(result.openings).toHaveLength(2)
    const door = result.openings.find((o) => o.id === onSide0.id)!
    const window = result.openings.find((o) => o.id === onSide2.id)!
    expect(door).toMatchObject({ wallId: result.walls[0].id, segmentIndex: 0, offset: 1000 })
    expect(window).toMatchObject({ wallId: result.walls[2].id, segmentIndex: 0, offset: 1500 })
    expect(result.removedOpeningIds).toEqual([])
  })

  it('une ouverture sur un côté nul est retirée', () => {
    const w = wall([0, 0, 3000, 0, 3000, 0, 3000, 2000])
    const lost = createOpeningElement('door', 'Porte', { wallId: w.id, segmentIndex: 1, offset: 0, side: 'left' })
    const result = splitWall(w, [lost])!
    expect(result.openings).toEqual([])
    expect(result.removedOpeningIds).toEqual([lost.id])
  })
})

describe('séparation dans un document', () => {
  it('les côtés prennent la place du mur ; les autres éléments restent', () => {
    const before = wall([0, 0, 1000, 0])
    const w = wall(RECT)
    const after = wall([9000, 0, 10000, 0])
    const opening = createOpeningElement('door', 'Porte', { wallId: w.id, segmentIndex: 3, offset: 800, side: 'left' })
    const elements: CanvasElement[] = [before, w, opening, after]
    const result = splitWallInDocument(elements, w.id, counter())!
    expect(result.wallIds).toHaveLength(4)
    expect(result.elements.filter((e) => e.type === 'wall')).toHaveLength(6)
    expect(result.elements[0]).toBe(before)
    expect(result.elements[result.elements.length - 1]).toBe(after)
    const moved = result.elements.find((e): e is OpeningElement => e.id === opening.id)!
    expect(moved.wallId).toBe(result.wallIds[3])
  })

  it('identifiant inconnu, élément qui n’est pas un mur ou mur droit : rien', () => {
    const straight = wall([0, 0, 3000, 0])
    expect(splitWallInDocument([straight], 'nope')).toBeNull()
    expect(splitWallInDocument([straight], straight.id)).toBeNull()
  })

  it('les métrés des murs ne changent pas (longueur, surfaces, ouvertures déduites)', () => {
    const w = wall(RECT)
    const door = createOpeningElement('door', 'Porte', { wallId: w.id, segmentIndex: 0, offset: 1000, side: 'left' })
    const window = createOpeningElement('window', 'Fenêtre', { wallId: w.id, segmentIndex: 1, offset: 1500, side: 'left' })
    const elements: CanvasElement[] = [w, door, window]
    const totalsOf = (list: CanvasElement[]) => {
      const walls = computeMeasurements(list).walls
      const sum = (pick: (m: (typeof walls)[number]) => number) => walls.reduce((s, m) => s + pick(m), 0)
      return {
        length: sum((m) => m.length),
        area: sum((m) => m.wallArea),
        openings: sum((m) => m.openingsArea),
        net: sum((m) => m.netArea),
      }
    }
    const result = splitWallInDocument(elements, w.id, counter())!
    const before = totalsOf(elements)
    expect(before.length).toBe(14000)
    expect(before.openings).toBeGreaterThan(0)
    expect(totalsOf(result.elements)).toEqual(before)
  })

  it('les angles de la pièce séparée sont raccordés comme avant', () => {
    const w = wall(RECT)
    const split = splitWallInDocument([w], w.id, counter())!
    const parts = split.elements.filter((e): e is WallElement => e.type === 'wall')
    const joins = computeWallJoins(parts.map((p) => ({ id: p.id, points: p.points, thickness: p.thickness })))
    expect(joins.size).toBeGreaterThan(0)
  })
})

describe('couper un mur en un point', () => {
  const STRAIGHT = [0, 0, 4000, 0]
  const open = (kind: 'door' | 'window', name: string, wallId: string, segmentIndex: number, offset: number) =>
    createOpeningElement(kind, name, { wallId, segmentIndex, offset, side: 'left' })

  it('donne deux murs bout à bout ; le premier garde l’identifiant', () => {
    const w = wall(STRAIGHT)
    const out = cutWall(w, [], 0, 1500, counter())
    if (!out.ok) throw new Error('coupe refusée')
    const [first, second] = out.result.walls
    expect(first.id).toBe(w.id)
    expect(first.points).toEqual([0, 0, 1500, 0])
    expect(second.points).toEqual([1500, 0, 4000, 0])
    expect(second.id).toBe('id-1')
    expect(second).toMatchObject({ thickness: 200, height: 2500, material: 'brick', levelId: 'L1', locked: true })
  })

  it('la longueur totale ne change pas, même en biais', () => {
    const out = cutWall(wall([0, 0, 3000, 4000]), [], 0, 1230)
    if (!out.ok) throw new Error('coupe refusée')
    const length = (p: number[]) => Math.hypot(p[2] - p[0], p[3] - p[1])
    const [a, b] = out.result.walls
    expect(length(a.points) + length(b.points)).toBeCloseTo(5000, 6)
  })

  it('un mur à plusieurs côtés : chaque morceau garde les côtés qui lui reviennent', () => {
    const w = wall([0, 0, 4000, 0, 4000, 3000, 0, 3000])
    const out = cutWall(w, [], 1, 1000, counter())
    if (!out.ok) throw new Error('coupe refusée')
    expect(out.result.walls[0].points).toEqual([0, 0, 4000, 0, 4000, 1000])
    expect(out.result.walls[1].points).toEqual([4000, 1000, 4000, 3000, 0, 3000])
  })

  it('les ouvertures suivent leur morceau, à la même place dans le document', () => {
    const w = wall([0, 0, 4000, 0, 4000, 3000])
    const before = open('door', 'P1', w.id, 0, 500)
    const after = open('window', 'F1', w.id, 0, 3000)
    const other = open('window', 'F2', w.id, 1, 700)
    const out = cutWall(w, [before, after, other], 0, 2000, counter())
    if (!out.ok) throw new Error('coupe refusée')
    const second = out.result.walls[1]
    const byId = new Map(out.result.openings.map((o) => [o.id, o]))
    expect(byId.has(before.id)).toBe(false) // reste sur le premier morceau, inchangée
    expect(byId.get(after.id)).toMatchObject({ wallId: second.id, segmentIndex: 0, offset: 1000 })
    expect(byId.get(other.id)).toMatchObject({ wallId: second.id, segmentIndex: 1, offset: 700 })
  })

  it('refuse une coupe trop près d’un sommet (moins que l’épaisseur)', () => {
    const w = wall(STRAIGHT)
    expect(cutWallProblem(w, [], 0, 100)).toBe('too-close')
    expect(cutWallProblem(w, [], 0, 3900)).toBe('too-close')
    expect(cutWallProblem(w, [], 0, 200)).toBeNull()
    expect(cutWall(w, [], 0, 0).ok).toBe(false)
  })

  it('refuse une coupe au milieu d’une ouverture, accepte à son bord', () => {
    const w = wall(STRAIGHT)
    const door = open('door', 'P1', w.id, 0, 2000)
    const half = door.width / 2
    expect(cutWallProblem(w, [door], 0, 2000)).toBe('on-opening')
    expect(cutWallProblem(w, [door], 0, 2000 + half - 10)).toBe('on-opening')
    expect(cutWallProblem(w, [door], 0, 2000 + half)).toBeNull()
  })

  it('dans le document : les deux murs prennent la place de l’ancien', () => {
    const w = wall(STRAIGHT)
    const text = { id: 'x', type: 'text' } as unknown as CanvasElement
    const out = cutWallInDocument([text, w], w.id, 0, 1000, counter())
    if (!out.ok) throw new Error('coupe refusée')
    expect(out.elements.map((el) => el.id)).toEqual(['x', w.id, 'id-1'])
    expect(out.wallIds).toEqual([w.id, 'id-1'])
  })

  it('les métrés restent justes : la longueur de mur ne change pas', () => {
    const w = wall(STRAIGHT)
    const out = cutWallInDocument([w], w.id, 0, 1500)
    if (!out.ok) throw new Error('coupe refusée')
    const total = (els: CanvasElement[]) =>
      els
        .filter((e): e is WallElement => e.type === 'wall')
        .reduce((sum, p) => sum + Math.hypot(p.points[2] - p.points[0], p.points[3] - p.points[1]), 0)
    expect(total(out.elements)).toBe(total([w]))
  })

  it('snapCutOffset arrondit à 10 mm', () => {
    expect(snapCutOffset(1234)).toBe(1230)
    expect(snapCutOffset(1235)).toBe(1240)
  })
})
