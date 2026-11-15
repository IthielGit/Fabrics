import { describe, expect, it } from 'vitest'
import { createRectElement, createWallElement } from '../documents/elements'
import { commentTargetAt } from './commentTarget'

describe('commentTargetAt', () => {
  const wall = createWallElement('Mur', [0, 0, 4000, 0], 200, 2700)

  it('vise un mur près de son axe', () => {
    expect(commentTargetAt([wall], 2000, 80, 10).elementId).toBe(wall.id)
  })

  it('ne vise pas un mur trop loin de lui, mais garde le point cliqué', () => {
    expect(commentTargetAt([wall], 2000, 600, 10)).toEqual({ elementId: null, x: 2000, y: 600 })
  })

  it('un mur en diagonale n’est pas visé par le coin vide de sa boîte', () => {
    const diagonal = createWallElement('Diag', [0, 0, 4000, 4000], 200, 2700)
    expect(commentTargetAt([diagonal], 3800, 200, 10).elementId).toBeNull()
    expect(commentTargetAt([diagonal], 2000, 2000, 10).elementId).toBe(diagonal.id)
  })

  it('le plus petit élément l’emporte sur celui qui l’entoure', () => {
    const big = { ...createRectElement('Grand', 0, 0, 5000, 5000), id: 'big' }
    const small = { ...createRectElement('Petit', 1000, 1000, 500, 500), id: 'small' }
    expect(commentTargetAt([big, small], 1200, 1200, 0).elementId).toBe('small')
    expect(commentTargetAt([small, big], 1200, 1200, 0).elementId).toBe('small')
    expect(commentTargetAt([big, small], 3000, 3000, 0).elementId).toBe('big')
  })

  it('un mur l’emporte sur la forme qui l’entoure', () => {
    const room = { ...createRectElement('Pièce', -500, -500, 6000, 3000), id: 'room' }
    expect(commentTargetAt([room, wall], 2000, 0, 10).elementId).toBe(wall.id)
  })

  it('à surface égale, l’élément dessiné au-dessus gagne', () => {
    const a = { ...createRectElement('A', 0, 0, 1000, 1000), id: 'a' }
    const b = { ...createRectElement('B', 0, 0, 1000, 1000), id: 'b' }
    expect(commentTargetAt([a, b], 500, 500, 0).elementId).toBe('b')
  })

  it('ignore les éléments cachés', () => {
    expect(commentTargetAt([{ ...wall, hidden: true }], 2000, 0, 10).elementId).toBeNull()
  })

  it('sans élément, pose un point libre', () => {
    expect(commentTargetAt([], 10, 20, 5)).toEqual({ elementId: null, x: 10, y: 20 })
  })
})
