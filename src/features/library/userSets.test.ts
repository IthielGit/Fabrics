import { describe, expect, it } from 'vitest'
import { createFurnitureElement, createWallElement } from '../documents/elements'
import { getPlaceable } from './catalog/prefabs'
import { elementsForSet } from './placeSet'
import { getUserSet, setUserSets } from './userRegistry'
import {
  addUserSet,
  countSavableObjects,
  createUserSet,
  MAX_USER_SETS,
  parseUserSets,
  removeUserSet,
} from './userSets'

const sink = createFurnitureElement('Évier', 'sink-kitchen-1', 1000, 500, 1200, 600)
const fridge = { ...createFurnitureElement('Frigo', 'fridge', 2200, 500, 600, 650), mirrored: true }
const wall = createWallElement('', [0, 0, 4000, 0], 200, 2500)

describe('bibliothèque personnelle', () => {
  it('garde les objets, relatifs au coin de leur emprise, et laisse les murs', () => {
    expect(countSavableObjects([sink, fridge, wall])).toBe(2)
    const set = createUserSet([sink, fridge, wall], '  Ensemble cuisine ', 'user-1')!
    expect(set.name).toBe('Ensemble cuisine')
    expect(set.def).toMatchObject({ id: 'user-1', category: 'sets', width: 1800, depth: 650 })
    expect(set.def.members).toEqual([
      { symbol: 'sink-kitchen-1', x: 0, y: 0, rotation: 0, width: 1200, depth: 600 },
      { symbol: 'fridge', x: 1200, y: 0, rotation: 0, width: 600, depth: 650, mirrored: true },
    ])
  })

  it('sans objet ou sans nom : rien', () => {
    expect(createUserSet([wall], 'Mur')).toBeNull()
    expect(createUserSet([sink], '   ')).toBeNull()
  })

  it('se réinsère ailleurs avec les mêmes positions relatives', () => {
    const set = createUserSet([sink, fridge], 'Cuisine', 'user-2')!
    setUserSets([set])
    expect(getPlaceable('user-2')).toBe(set.def)
    const placed = elementsForSet(getPlaceable('user-2')!, { x: 10000, y: 8000 }, (id) => id)
    expect(placed.map((el) => [el.x, el.y])).toEqual([
      [10000, 8000],
      [11200, 8000],
    ])
    expect(placed[1].mirrored).toBe(true)
    setUserSets([])
    expect(getUserSet('user-2')).toBeUndefined()
  })

  it('aller-retour JSON, entrées invalides ignorées', () => {
    const set = createUserSet([sink, fridge], 'Cuisine', 'user-3')!
    const parsed = parseUserSets(JSON.stringify([set, { id: 'x' }, 42, { ...set, id: 'autre', name: 'x' }]))
    expect(parsed).toEqual([set])
    expect(parseUserSets('pas du json')).toEqual([])
    expect(parseUserSets(null)).toEqual([])
    expect(parseUserSets('{"a":1}')).toEqual([])
  })

  it('ajouter met en tête, retirer enlève, la liste est limitée', () => {
    const make = (n: number) => createUserSet([sink], `Ensemble ${n}`, `user-${n}`)!
    let list = [make(1), make(2)]
    list = addUserSet(list, make(3))
    expect(list.map((s) => s.id)).toEqual(['user-3', 'user-1', 'user-2'])
    expect(removeUserSet(list, 'user-1').map((s) => s.id)).toEqual(['user-3', 'user-2'])
    for (let n = 4; n < 80; n++) list = addUserSet(list, make(n))
    expect(list).toHaveLength(MAX_USER_SETS)
  })
})
