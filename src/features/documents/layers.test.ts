import { describe, expect, it } from 'vitest'
import { createOpeningElement, createRectElement, createWallElement } from './elements'
import { drawOrder, moveElementToSlot, sameOrder, stepElement } from './layers'

// Ordre du tableau : A (fond) → B → C → D (dessus). Liste affichée : D, C, B, A.
const [A, B, C, D] = ['A', 'B', 'C', 'D'].map((n) => createRectElement(n, 0, 0, 10, 10))
const names = (list: { name: string }[]) => list.map((el) => el.name).join('')

describe('moveElementToSlot', () => {
  const all = [A, B, C, D]

  it('met un élément tout en haut de la liste (devant tout)', () => {
    expect(names(moveElementToSlot(all, A.id, 0))).toBe('BCDA')
  })

  it('met un élément tout en bas de la liste (derrière tout)', () => {
    expect(names(moveElementToSlot(all, D.id, 4))).toBe('DABC')
  })

  it('déplace C entre A et B dans la liste affichée (D, B, C, A… slot 2 → derrière B)', () => {
    // Liste affichée : D C B A. Déposer C au slot 3 = entre B et A.
    expect(names(moveElementToSlot(all, C.id, 3))).toBe('ACBD')
  })

  it('ne change rien quand on dépose un élément à sa propre place', () => {
    // C est à la ligne 1 de la liste affichée : slots 1 et 2 l'encadrent.
    expect(names(moveElementToSlot(all, C.id, 1))).toBe('ABCD')
    expect(names(moveElementToSlot(all, C.id, 2))).toBe('ABCD')
  })

  it('ignore un identifiant inconnu et borne l’emplacement', () => {
    expect(names(moveElementToSlot(all, 'inconnu', 1))).toBe('ABCD')
    expect(names(moveElementToSlot(all, A.id, 99))).toBe('ABCD')
  })

  it('ne modifie pas le tableau d’origine', () => {
    moveElementToSlot(all, A.id, 0)
    expect(names(all)).toBe('ABCD')
  })
})

describe('stepElement', () => {
  const all = [A, B, C, D]

  it('monte un élément d’un cran vers l’avant-plan', () => {
    expect(names(stepElement(all, B.id, 'up'))).toBe('ACBD')
  })

  it('descend un élément d’un cran vers l’arrière-plan', () => {
    expect(names(stepElement(all, C.id, 'down'))).toBe('ACBD')
  })

  it('ne bouge pas un élément déjà au bout', () => {
    expect(names(stepElement(all, D.id, 'up'))).toBe('ABCD')
    expect(names(stepElement(all, A.id, 'down'))).toBe('ABCD')
  })
})

describe('sameOrder', () => {
  it('compare l’ordre des éléments', () => {
    expect(sameOrder([A, B], [A, B])).toBe(true)
    expect(sameOrder([A, B], [B, A])).toBe(false)
    expect(sameOrder([A], [A, B])).toBe(false)
  })
})

describe('drawOrder', () => {
  const wall = createWallElement('Mur', [0, 0, 4000, 0], 200, 2500)
  const door = createOpeningElement('door', 'Porte', {
    wallId: wall.id,
    segmentIndex: 0,
    offset: 2000,
    side: 'left',
  })
  const rect = createRectElement('R', 0, 0, 10, 10)

  it('garde l’ordre quand l’ouverture est déjà au-dessus de son mur', () => {
    const elements = [wall, door, rect]
    expect(drawOrder(elements)).toEqual(elements)
  })

  it('dessine une ouverture placée sous son mur juste après lui', () => {
    expect(drawOrder([door, rect, wall]).map((el) => el.name)).toEqual(['R', 'Mur', 'Porte'])
  })

  it('ne change pas la liste des calques', () => {
    const elements = [door, wall]
    drawOrder(elements)
    expect(elements.map((el) => el.id)).toEqual([door.id, wall.id])
  })

  it('garde une ouverture sans mur à sa place', () => {
    expect(drawOrder([door, rect]).map((el) => el.id)).toEqual([door.id, rect.id])
  })

  it('range plusieurs ouvertures après leur mur, dans leur ordre', () => {
    const second = { ...door, id: 'second', name: 'Porte 2' }
    expect(drawOrder([door, second, wall]).map((el) => el.name)).toEqual(['Mur', 'Porte', 'Porte 2'])
  })
})
