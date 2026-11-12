import { describe, expect, it } from 'vitest'
import { connectedWallIds } from './wallChains'

const wall = (id: string, points: number[], levelId?: string, thickness = 200) => ({
  id,
  points,
  thickness,
  ...(levelId ? { levelId } : {}),
})

describe('murs liés', () => {
  const room = [
    wall('n', [0, 0, 4000, 0]),
    wall('e', [4000, 0, 4000, 3000]),
    wall('s', [4000, 3000, 0, 3000]),
    wall('w', [0, 3000, 0, 0]),
  ]

  it('une pièce fermée : les quatre murs, quel que soit celui de départ', () => {
    expect([...connectedWallIds(room, 'e')].sort()).toEqual(['e', 'n', 's', 'w'])
  })

  it('un mur isolé ne retourne que lui', () => {
    const all = [...room, wall('far', [9000, 9000, 12000, 9000])]
    expect(connectedWallIds(all, 'far')).toEqual(['far'])
    expect(connectedWallIds(all, 'n')).not.toContain('far')
  })

  it('une cloison qui s’arrête sur la face d’un mur (T) est liée', () => {
    const all = [...room, wall('partition', [2000, 100, 2000, 3000], undefined, 100)]
    expect(connectedWallIds(all, 'partition')).toContain('n')
    expect(connectedWallIds(all, 's')).toContain('partition')
  })

  it('une chaîne ouverte se suit de proche en proche', () => {
    const chain = [wall('a', [0, 0, 1000, 0]), wall('b', [1000, 0, 2000, 0]), wall('c', [2000, 0, 3000, 500])]
    expect([...connectedWallIds(chain, 'a')].sort()).toEqual(['a', 'b', 'c'])
  })

  it('deux murs parallèles proches mais sans contact ne sont pas liés', () => {
    const all = [wall('a', [0, 0, 4000, 0]), wall('b', [0, 500, 4000, 500])]
    expect(connectedWallIds(all, 'a')).toEqual(['a'])
  })

  it('un autre niveau et un mur masqué sont ignorés', () => {
    const all = [
      wall('a', [0, 0, 1000, 0], 'L0'),
      wall('up', [1000, 0, 2000, 0], 'L1'),
      { ...wall('hid', [0, 0, 0, 1000], 'L0'), hidden: true },
    ]
    expect(connectedWallIds(all, 'a')).toEqual(['a'])
  })

  it('identifiant inconnu : rien', () => {
    expect(connectedWallIds(room, 'nope')).toEqual([])
  })
})
