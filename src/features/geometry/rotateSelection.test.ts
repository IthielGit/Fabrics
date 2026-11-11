import { describe, expect, it } from 'vitest'
import type { OpeningElement, WallElement } from '../../types/document'
import {
  createFurnitureElement,
  createOpeningElement,
  createRoomElement,
  createWallElement,
} from '../documents/elements'
import { reconcileOpenings } from '../documents/wallOpenings'
import { elementBounds } from '../export/bounds'
import { rotateSelectionQuarterTurn } from './rotateSelection'

describe('quart de tour d’une sélection', () => {
  it('une pièce de 4000 × 2000 mm devient 2000 × 4000 mm autour de son centre', () => {
    const room = createRoomElement('Pièce', [0, 0, 4000, 0, 4000, 2000, 0, 2000])
    const [turned] = rotateSelectionQuarterTurn([room])
    const box = elementBounds(turned)!
    expect([box.width, box.height]).toEqual([2000, 4000])
    expect([box.x + box.width / 2, box.y + box.height / 2]).toEqual([2000, 1000])
  })

  it('quatre quarts de tour ramènent chaque point à sa place', () => {
    let wall: WallElement = createWallElement('Mur', [0, 0, 3000, 0, 3000, 2000], 200, 2700)
    const original = wall.points
    for (let i = 0; i < 4; i++) wall = rotateSelectionQuarterTurn([wall])[0] as WallElement
    expect(wall.points).toEqual(original)
  })

  it('la sélection tourne d’un bloc : un meuble garde sa place dans la pièce', () => {
    const room = createRoomElement('Pièce', [0, 0, 4000, 0, 4000, 2000, 0, 2000])
    // Un lit dans le coin haut-gauche de la pièce.
    const bed = createFurnitureElement('Lit', 'bed-queen', 0, 0, 1600, 2000)
    const [turnedRoom, turnedBed] = rotateSelectionQuarterTurn([room, bed])
    const roomBox = elementBounds(turnedRoom)!
    const bedBox = elementBounds(turnedBed)!
    // Le coin haut-gauche tourne vers le coin haut-droit de la pièce tournée.
    expect(bedBox.x + bedBox.width).toBeCloseTo(roomBox.x + roomBox.width)
    expect(bedBox.y).toBeCloseTo(roomBox.y)
    expect([bedBox.width, bedBox.height]).toEqual([2000, 1600])
  })

  it('un meuble seul tourne sur place', () => {
    const table = createFurnitureElement('Table', 'table-rect-4', 1000, 1000, 1200, 800)
    const before = elementBounds(table)!
    const [turned] = rotateSelectionQuarterTurn([table])
    const after = elementBounds(turned)!
    expect(after.x + after.width / 2).toBeCloseTo(before.x + before.width / 2)
    expect(after.y + after.height / 2).toBeCloseTo(before.y + before.height / 2)
    expect(turned.rotation).toBe(90)
  })

  it('ignore les éléments verrouillés et les ouvertures', () => {
    const wall = createWallElement('Mur', [0, 0, 3000, 0], 200, 2700)
    const opening = createOpeningElement('door', 'Porte', {
      wallId: wall.id,
      segmentIndex: 0,
      offset: 1000,
      side: 'left',
    })
    const locked = { ...createRoomElement('Pièce', [0, 0, 1000, 0, 1000, 1000]), locked: true }
    const turned = rotateSelectionQuarterTurn([wall, opening, locked])
    expect(turned.map((el) => el.id)).toEqual([wall.id])
  })

  it('les ouvertures suivent leur mur tourné, sans bouger ni disparaître', () => {
    const wall = createWallElement('Mur', [0, 0, 3000, 0, 3000, 2000], 200, 2700)
    const door: OpeningElement = createOpeningElement('door', 'Porte', {
      wallId: wall.id,
      segmentIndex: 1,
      offset: 800,
      side: 'left',
    })
    const before = [wall, door]
    const [turnedWall] = rotateSelectionQuarterTurn([wall])
    const after = before.map((el) => (el.id === wall.id ? turnedWall : el))
    const kept = reconcileOpenings(before, after).find(
      (el): el is OpeningElement => el.type === 'opening',
    )!
    expect(kept.segmentIndex).toBe(1)
    expect(kept.offset).toBe(800)
  })
})
