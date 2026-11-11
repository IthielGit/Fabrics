import { describe, expect, it } from 'vitest'
import { createRoomElement } from '../documents/elements'
import { overlappingRoomIds, roomsOverlap } from './roomOverlap'

/** Pièce rectangulaire de (x1, y1) à (x2, y2), en mm. */
function rect(x1: number, y1: number, x2: number, y2: number, levelId?: string) {
  const room = createRoomElement('Pièce', [x1, y1, x2, y1, x2, y2, x1, y2])
  return levelId ? { ...room, levelId } : room
}

describe('roomsOverlap', () => {
  it('ne signale pas deux pièces séparées', () => {
    expect(roomsOverlap(rect(0, 0, 3000, 3000), rect(5000, 0, 8000, 3000))).toBe(false)
  })

  it('ne signale pas deux pièces mitoyennes (côté commun)', () => {
    expect(roomsOverlap(rect(0, 0, 3000, 3000), rect(3000, 0, 6000, 3000))).toBe(false)
  })

  it('ne signale pas deux pièces qui se touchent par un coin', () => {
    expect(roomsOverlap(rect(0, 0, 3000, 3000), rect(3000, 3000, 6000, 6000))).toBe(false)
  })

  it('signale un recouvrement partiel', () => {
    expect(roomsOverlap(rect(0, 0, 3000, 3000), rect(2000, 1000, 5000, 4000))).toBe(true)
  })

  it('signale deux pièces identiques', () => {
    expect(roomsOverlap(rect(0, 0, 3000, 3000), rect(0, 0, 3000, 3000))).toBe(true)
  })

  it('signale une pièce entièrement à l’intérieur d’une autre', () => {
    expect(roomsOverlap(rect(0, 0, 6000, 6000), rect(1000, 1000, 2000, 2000))).toBe(true)
    expect(roomsOverlap(rect(1000, 1000, 2000, 2000), rect(0, 0, 6000, 6000))).toBe(true)
  })

  it('signale deux pièces en croix (aucun sommet à l’intérieur de l’autre)', () => {
    expect(roomsOverlap(rect(0, 1000, 6000, 2000), rect(2000, 0, 3000, 6000))).toBe(true)
  })

  it('tient compte du déplacement x / y d’une pièce', () => {
    const moved = { ...rect(0, 0, 3000, 3000), x: 10000 }
    expect(roomsOverlap(moved, rect(0, 0, 3000, 3000))).toBe(false)
    expect(roomsOverlap(moved, rect(10000, 0, 13000, 3000))).toBe(true)
  })

  it('traite une pièce en L : pas de recouvrement dans le creux, oui dans la branche', () => {
    const l = createRoomElement('L', [0, 0, 6000, 0, 6000, 2000, 2000, 2000, 2000, 6000, 0, 6000])
    expect(roomsOverlap(l, rect(3000, 3000, 5000, 5000))).toBe(false)
    expect(roomsOverlap(l, rect(500, 3000, 1500, 5000))).toBe(true)
  })

  it('ignore une pièce sans surface', () => {
    const flat = createRoomElement('Plate', [0, 0, 1000, 0])
    expect(roomsOverlap(flat, rect(0, 0, 3000, 3000))).toBe(false)
  })
})

describe('overlappingRoomIds', () => {
  it('ne compare que les pièces d’un même niveau', () => {
    const rdc = rect(0, 0, 3000, 3000, 'n0')
    const etage = rect(0, 0, 3000, 3000, 'n1')
    expect(overlappingRoomIds([rdc, etage]).size).toBe(0)
  })

  it('renvoie les deux pièces en cause, pas les autres', () => {
    const a = rect(0, 0, 3000, 3000, 'n0')
    const b = rect(2000, 0, 5000, 3000, 'n0')
    const c = rect(9000, 0, 12000, 3000, 'n0')
    const ids = overlappingRoomIds([a, b, c])
    expect(ids.has(a.id)).toBe(true)
    expect(ids.has(b.id)).toBe(true)
    expect(ids.has(c.id)).toBe(false)
  })

  it('compare une pièce sans niveau à toutes les autres', () => {
    const common = rect(0, 0, 3000, 3000)
    const onLevel = rect(0, 0, 3000, 3000, 'n1')
    expect(overlappingRoomIds([common, onLevel]).size).toBe(2)
  })
})
