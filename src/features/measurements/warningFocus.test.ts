import { describe, expect, it } from 'vitest'
import { createWallElement } from '../documents/elements'
import { boxRing, warningFocusBox } from './warningFocus'
import type { MetresWarning } from './warnings'

describe('warningFocusBox', () => {
  it('prend le contour de la surface quand l’avertissement en a un', () => {
    const warning: MetresWarning = {
      kind: 'coverageGap',
      levelId: 'n1',
      roomId: 'r1',
      roomName: 'Séjour',
      area: 1000,
      wallRef: null,
      rings: [
        [
          { x: 100, y: 200 },
          { x: 500, y: 200 },
          { x: 500, y: 400 },
          { x: 100, y: 400 },
        ],
      ],
    }
    expect(warningFocusBox(warning, ['r1'], [])).toEqual({ x: 100, y: 200, width: 400, height: 200 })
  })

  it('entoure le mur concerné, avec une marge', () => {
    const wall = createWallElement('Mur', [0, 0, 3000, 0], 200, 2500)
    const warning: MetresWarning = {
      kind: 'wallGap',
      levelId: 'n1',
      wallId: wall.id,
      wallRef: 'M01',
      otherWallRef: 'M02',
      gap: 50,
      fix: { wallId: wall.id } as never,
    }
    const box = warningFocusBox(warning, [wall.id], [wall])
    expect(box).not.toBeNull()
    expect(box!.width).toBeGreaterThan(3000)
  })

  it('renvoie null si l’élément a disparu', () => {
    const warning = { kind: 'noLevel', elementId: 'x', elementName: 'X', elementType: 'wall' } as MetresWarning
    expect(warningFocusBox(warning, ['x'], [])).toBeNull()
  })

  it('boxRing donne les quatre coins', () => {
    expect(boxRing({ x: 0, y: 0, width: 2, height: 3 })).toHaveLength(4)
  })
})
