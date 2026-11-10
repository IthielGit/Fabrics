import { describe, expect, it } from 'vitest'
import type { OpeningElement, WallElement } from '../../types/document'
import {
  changeOpeningKind,
  changeOpeningKindAndSize,
  flipHinge,
  flipSide,
  MIN_OPENING_SIZE,
  resizeOpening,
} from './openingEdit'

const wall: Pick<WallElement, 'points' | 'height'> = { points: [0, 0, 4000, 0], height: 2500 }

function opening(partial: Partial<OpeningElement> = {}): OpeningElement {
  return {
    id: 'o1',
    type: 'opening',
    name: 'Porte 1',
    x: 0,
    y: 0,
    rotation: 0,
    opacity: 1,
    locked: false,
    hidden: false,
    kind: 'door',
    wallId: 'w1',
    segmentIndex: 0,
    offset: 2000,
    width: 900,
    height: 2100,
    sillHeight: 0,
    hinge: 'start',
    side: 'left',
    ...partial,
  }
}

describe('changeOpeningKind', () => {
  it('ne change rien si le type est le même', () => {
    const door = opening()
    expect(changeOpeningKind(door, 'door', 2500)).toBe(door)
  })

  it('une fenêtre redevenue porte ou baie descend au sol', () => {
    const window = opening({ kind: 'window', height: 1000, sillHeight: 900 })
    expect(changeOpeningKind(window, 'door', 2500)).toMatchObject({ kind: 'door', sillHeight: 0 })
    expect(changeOpeningKind(window, 'bay', 2500)).toMatchObject({ kind: 'bay', sillHeight: 0 })
  })

  it('une porte devenue fenêtre reçoit l’allège par défaut quand elle tient', () => {
    const door = opening({ height: 1000 })
    expect(changeOpeningKind(door, 'window', 2500)).toMatchObject({ kind: 'window', sillHeight: 900 })
  })

  it('réduit l’allège pour que la fenêtre ne dépasse pas le mur', () => {
    const door = opening({ height: 2100 }) // 900 + 2100 > 2500
    expect(changeOpeningKind(door, 'window', 2500)).toMatchObject({ sillHeight: 400 })
  })

  it('garde l’allège existante d’une fenêtre', () => {
    const baie = opening({ kind: 'bay', height: 1000, sillHeight: 500 })
    expect(changeOpeningKind(baie, 'window', 2500).sillHeight).toBe(500)
  })
})

describe('changeOpeningKindAndSize', () => {
  const stdWindow = () => opening({ kind: 'window', width: 1200, height: 1000, sillHeight: 900 })

  it('une fenêtre par défaut devenue porte prend la taille d’une porte (900 × 2100, au sol)', () => {
    const result = changeOpeningKindAndSize(stdWindow(), 'door', wall, [])
    expect(result).toMatchObject({ kind: 'door', width: 900, height: 2100, sillHeight: 0 })
  })

  it('une porte par défaut devenue fenêtre prend la taille d’une fenêtre (1200 × 1000, allège 900)', () => {
    const result = changeOpeningKindAndSize(opening({ kind: 'door' }), 'window', wall, [])
    expect(result).toMatchObject({ kind: 'window', width: 1200, height: 1000, sillHeight: 900 })
  })

  it('une fenêtre par défaut devenue baie prend la taille d’une baie', () => {
    const result = changeOpeningKindAndSize(stdWindow(), 'bay', wall, [])
    expect(result).toMatchObject({ kind: 'bay', width: 2400, height: 2150, sillHeight: 0 })
  })

  it('garde une taille modifiée à la main', () => {
    const custom = opening({ kind: 'window', width: 1500, height: 1200, sillHeight: 800 })
    const result = changeOpeningKindAndSize(custom, 'door', wall, [])
    expect(result).toMatchObject({ kind: 'door', width: 1500, height: 1200, sillHeight: 0 })
  })

  it('garde l’ancienne taille si la nouvelle ne tient pas dans la hauteur du mur', () => {
    const lowWall = { ...wall, height: 2000 }
    const result = changeOpeningKindAndSize(stdWindow(), 'door', lowWall, [])
    expect(result).toMatchObject({ kind: 'door', width: 1200, height: 1000, sillHeight: 0 })
  })

  it('garde l’ancienne taille s’il n’y a pas la place à côté d’une voisine', () => {
    const neighbour = opening({ id: 'o2', offset: 2800, width: 900 }) // occupe 2350 → 3250
    const near = opening({ kind: 'window', width: 1200, height: 1000, sillHeight: 900, offset: 1700 })
    const narrowWall = { ...wall, points: [0, 0, 3300, 0] }
    const result = changeOpeningKindAndSize(near, 'bay', narrowWall, [neighbour])
    expect(result).toMatchObject({ kind: 'bay', width: 1200, height: 1000, sillHeight: 0 })
  })

  it('ne change rien si le type est le même', () => {
    const w = stdWindow()
    expect(changeOpeningKindAndSize(w, 'window', wall, [])).toBe(w)
  })
})

describe('resizeOpening', () => {
  it('change la largeur en gardant le centre', () => {
    const result = resizeOpening(opening(), { width: 1200 }, wall, [])
    expect(result).toEqual({ opening: expect.objectContaining({ width: 1200, offset: 2000 }) })
  })

  it('décale le centre pour rester sur le mur', () => {
    const result = resizeOpening(opening({ offset: 500 }), { width: 1200 }, wall, [])
    expect(result).toEqual({ opening: expect.objectContaining({ width: 1200, offset: 600 }) })
  })

  it('refuse une largeur plus grande que le mur', () => {
    expect(resizeOpening(opening(), { width: 4500 }, wall, [])).toEqual({ problem: 'no-room' })
  })

  it('refuse d’élargir contre des voisines quand il n’y a plus de place', () => {
    const left = opening({ id: 'a', offset: 600, width: 1000 }) // 100 → 1100
    const right = opening({ id: 'b', offset: 3400, width: 1000 }) // 2900 → 3900
    const middle = opening({ id: 'm', offset: 2000, width: 900 })
    expect(resizeOpening(middle, { width: 1800 }, wall, [left, middle, right])).toEqual({
      opening: expect.objectContaining({ width: 1800 }),
    })
    expect(resizeOpening(middle, { width: 1900 }, wall, [left, middle, right])).toEqual({
      problem: 'no-room',
    })
  })

  it('décale l’ouverture quand elle grandit contre une voisine', () => {
    const neighbour = opening({ id: 'n', offset: 1000, width: 1000 }) // 500 → 1500
    const door = opening({ id: 'm', offset: 1800, width: 600 }) // 1500 → 2100
    const result = resizeOpening(door, { width: 800 }, wall, [neighbour, door])
    expect(result).toEqual({ opening: expect.objectContaining({ width: 800, offset: 1900 }) })
  })

  it('refuse une ouverture plus haute que le mur', () => {
    expect(resizeOpening(opening(), { height: 2600 }, wall, [])).toEqual({ problem: 'too-tall' })
    const window = opening({ kind: 'window', height: 1000, sillHeight: 900 })
    expect(resizeOpening(window, { sillHeight: 1600 }, wall, [])).toEqual({ problem: 'too-tall' })
  })

  it('accepte une hauteur qui arrive pile au sommet du mur', () => {
    expect(resizeOpening(opening(), { height: 2500 }, wall, [])).toEqual({
      opening: expect.objectContaining({ height: 2500 }),
    })
  })

  it('impose une taille minimale et une allège positive', () => {
    const result = resizeOpening(opening(), { width: 5, height: -20, sillHeight: -3 }, wall, [])
    expect(result).toEqual({
      opening: expect.objectContaining({
        width: MIN_OPENING_SIZE,
        height: MIN_OPENING_SIZE,
        sillHeight: 0,
      }),
    })
  })
})

describe('flipHinge et flipSide', () => {
  it('inverse la charnière', () => {
    expect(flipHinge(opening()).hinge).toBe('end')
    expect(flipHinge(flipHinge(opening())).hinge).toBe('start')
  })

  it('inverse le côté d’ouverture', () => {
    expect(flipSide(opening()).side).toBe('right')
    expect(flipSide(flipSide(opening())).side).toBe('left')
  })
})
