import { describe, expect, it } from 'vitest'
import type { CanvasElement, WallElement } from '../../types/document'
import { createRoomElement, createWallElement } from '../documents/elements'
import { moveWallSide, wallSideZone } from './moveWallSide'

const wall = (points: number[]): WallElement => createWallElement('', points, 200, 2500)

/** Quatre murs séparés autour d'une pièce de 4000 × 3000. */
function house() {
  const top = wall([0, 0, 4000, 0])
  const right = wall([4000, 0, 4000, 3000])
  const bottom = wall([4000, 3000, 0, 3000])
  const left = wall([0, 3000, 0, 0])
  const room = createRoomElement('Salon', [0, 0, 4000, 0, 4000, 3000, 0, 3000])
  return { top, right, bottom, left, room, all: [top, right, bottom, left, room] as CanvasElement[] }
}

const byId = (list: CanvasElement[]) => new Map(list.map((el) => [el.id, el]))

describe('zone d’un côté', () => {
  it('un côté horizontal se déplace en y, un côté vertical en x', () => {
    expect(wallSideZone(wall([0, 0, 4000, 0]), 0)).toEqual({
      zone: { x: 0, y: 0, width: 4000, height: 0 },
      normal: { x: 0, y: 1 },
    })
    expect(wallSideZone(wall([100, 0, 100, 3000]), 0)?.normal).toEqual({ x: 1, y: 0 })
  })
  it('un côté en biais n’a pas de zone', () => {
    expect(wallSideZone(wall([0, 0, 3000, 1000]), 0)).toBeNull()
    expect(wallSideZone(wall([0, 0, 3000, 0]), 5)).toBeNull()
  })
})

describe('glisser un seul mur', () => {
  it('le mur du haut descend de 500, les murs voisins raccourcissent et la pièce suit', () => {
    const { top, right, left, bottom, room, all } = house()
    const move = moveWallSide(all, top.id, 0, 500)!
    expect(move.blocked).toBe(false)
    expect(move.delta).toEqual({ x: 0, y: 500 })
    const changed = byId(move.result!.elements)
    expect((changed.get(top.id) as WallElement).points).toEqual([0, 500, 4000, 500])
    expect((changed.get(right.id) as WallElement).points).toEqual([4000, 500, 4000, 3000])
    expect((changed.get(left.id) as WallElement).points).toEqual([0, 3000, 0, 500])
    expect(changed.has(bottom.id)).toBe(false) // le mur du bas ne bouge pas
    expect((changed.get(room.id) as { points: number[] }).points).toEqual([
      0, 500, 4000, 500, 4000, 3000, 0, 3000,
    ])
  })

  it('un déplacement vers l’extérieur allonge les murs voisins', () => {
    const { right, all } = house()
    const move = moveWallSide(all, right.id, 0, 1000)!
    const changed = byId(move.result!.elements)
    // Le mur de droite se déplace de 1000 en x ; le haut et le bas s'allongent.
    expect((changed.get(right.id) as WallElement).points).toEqual([5000, 0, 5000, 3000])
  })

  it('un mur dans le prolongement bloque le déplacement', () => {
    const a = wall([0, 0, 2000, 0])
    const b = wall([2000, 0, 4000, 0]) // même ligne : il deviendrait oblique
    const move = moveWallSide([a, b], a.id, 0, 300)!
    expect(move.blocked).toBe(true)
    expect(move.delta).toEqual({ x: 0, y: 0 })
    expect(move.result).toBeNull()
  })

  it('un mur verrouillé ou inconnu ne bouge pas', () => {
    const locked = { ...wall([0, 0, 4000, 0]), locked: true }
    expect(moveWallSide([locked], locked.id, 0, 100)).toBeNull()
    expect(moveWallSide([], 'x', 0, 100)).toBeNull()
  })

  it('une distance nulle ne change rien et n’est pas un blocage', () => {
    const { top, all } = house()
    const move = moveWallSide(all, top.id, 0, 0)!
    expect(move.blocked).toBe(false)
    expect(move.result).toBeNull()
  })
})
