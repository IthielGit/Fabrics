import { describe, expect, it } from 'vitest'
import { WallNode } from '@pascal-app/core'

describe('branchement de @pascal-app/core', () => {
  it('valide un mur Pascal (en mètres)', () => {
    const wall = WallNode.parse({ start: [0, 0], end: [3.5, 0] })
    expect(wall.type).toBe('wall')
    expect(wall.id.startsWith('wall_')).toBe(true)
  })
})
