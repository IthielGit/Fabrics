import { describe, expect, it } from 'vitest'
import type { WallElement } from '../../types/document'
import { createRoomElement, createWallElement } from './elements'
import { isLockedWall, removableIds, wallIds, wallsLockState } from './wallLock'

function wall(patch: Partial<WallElement> = {}): WallElement {
  return { ...createWallElement('', [0, 0, 3000, 0], 200, 2500), ...patch }
}

describe('verrouillage des murs', () => {
  it('reconnaît un mur verrouillé, pas une pièce verrouillée', () => {
    expect(isLockedWall(wall({ locked: true }))).toBe(true)
    expect(isLockedWall(wall())).toBe(false)
    expect(isLockedWall({ ...createRoomElement('', [0, 0, 1000, 0, 1000, 1000]), locked: true })).toBe(false)
  })

  it('ne supprime pas les murs verrouillés et les compte', () => {
    const free = wall()
    const locked = wall({ locked: true })
    const room = { ...createRoomElement('', [0, 0, 1000, 0, 1000, 1000]), locked: true }
    const result = removableIds([free, locked, room], [free.id, locked.id, room.id])
    expect(result.ids).toEqual([free.id, room.id])
    expect(result.lockedWalls).toBe(1)
  })

  it('donne l’état de verrouillage d’un groupe de murs', () => {
    expect(wallsLockState([wall(), wall()])).toBe('none')
    expect(wallsLockState([wall({ locked: true }), wall({ locked: true })])).toBe('all')
    expect(wallsLockState([wall({ locked: true }), wall()])).toBe('mixed')
  })

  it('liste les murs visibles seulement', () => {
    const visible = wall()
    const hidden = wall({ hidden: true })
    const room = createRoomElement('', [0, 0, 1000, 0, 1000, 1000])
    expect(wallIds([visible, hidden, room])).toEqual([visible.id])
  })
})
