import { describe, expect, it } from 'vitest'
import type { OpeningElement, WallElement } from '../../types/document'
import {
  applyQuickSize,
  changeOpeningKind,
  changeOpeningStyle,
  resizeOpening,
  setTiltTurn,
} from './openingEdit'

const wall: Pick<WallElement, 'points' | 'height'> = { points: [0, 0, 4000, 0], height: 2500 }
const shortWall: Pick<WallElement, 'points' | 'height'> = { points: [0, 0, 1500, 0], height: 2500 }

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

function ok(result: ReturnType<typeof changeOpeningStyle>): OpeningElement {
  if ('problem' in result) throw new Error(`problème inattendu : ${result.problem}`)
  return result.opening
}

describe('changeOpeningStyle', () => {
  it('une taille encore par défaut prend celle du nouveau style', () => {
    const next = ok(changeOpeningStyle(opening(), 'double', wall, []))
    expect(next).toMatchObject({ style: 'double', width: 1400, height: 2100, sillHeight: 0 })
  })

  it('une taille modifiée à la main est gardée', () => {
    const next = ok(changeOpeningStyle(opening({ width: 950 }), 'slidingSurface', wall, []))
    expect(next).toMatchObject({ style: 'slidingSurface', width: 950, height: 2100 })
  })

  it('une fenêtre passe à la taille et à l\'allège du nouveau style', () => {
    const win = opening({ kind: 'window', width: 1200, height: 1000, sillHeight: 900 })
    const next = ok(changeOpeningStyle(win, 'tilt', wall, []))
    expect(next).toMatchObject({ style: 'tilt', width: 600, height: 400, sillHeight: 1600 })
  })

  it('garde l\'ancienne taille si la nouvelle ne tient pas (voisines collées)', () => {
    const left = opening({ id: 'o2', offset: 775, width: 1550 }) // 0 → 1550
    const right = opening({ id: 'o3', offset: 2975, width: 1050 }) // 2450 → 3500
    const next = ok(changeOpeningStyle(opening(), 'double', wall, [left, right]))
    expect(next).toMatchObject({ style: 'double', width: 900, height: 2100 })
  })

  it('ne change rien si le style est déjà celui de l\'ouverture ou n\'existe pas pour son type', () => {
    const door = opening()
    expect(ok(changeOpeningStyle(door, 'swing', wall, []))).toBe(door)
    expect(ok(changeOpeningStyle(door, 'casement2', wall, []))).toBe(door)
  })

  it('retire l\'oscillo-battant quand le nouveau style n\'a pas de vantaux', () => {
    const win = opening({
      kind: 'window',
      style: 'casement2',
      tiltTurn: true,
      width: 1200,
      height: 1000,
      sillHeight: 900,
    })
    const next = ok(changeOpeningStyle(win, 'fixed', wall, []))
    expect(next.style).toBe('fixed')
    expect(next.tiltTurn).toBeUndefined()
    // d'un vantail à deux vantaux, l'option reste
    const kept = ok(changeOpeningStyle({ ...win, style: 'casement1', width: 700, height: 1200 }, 'casement2', wall, []))
    expect(kept.tiltTurn).toBe(true)
  })

  it('accepte une galandage quand il y a de la place à côté', () => {
    const next = ok(changeOpeningStyle(opening(), 'slidingPocket', wall, []))
    expect(next.style).toBe('slidingPocket')
  })

  it('refuse une galandage sans place dans le mur', () => {
    const result = changeOpeningStyle(opening({ offset: 750 }), 'slidingPocket', shortWall, [])
    expect(result).toEqual({ problem: 'no-pocket' })
  })

  it('refuse une galandage encadrée par deux voisines', () => {
    const left = opening({ id: 'o2', offset: 1100, width: 900 }) // 650 → 1550
    const right = opening({ id: 'o3', offset: 2900, width: 900 }) // 2450 → 3350
    const result = changeOpeningStyle(opening(), 'slidingPocket', wall, [left, right])
    expect(result).toEqual({ problem: 'no-pocket' })
  })
})

describe('resizeOpening et galandage', () => {
  it('refuse d\'élargir une galandage au-delà de la place libre', () => {
    const pocket = opening({ style: 'slidingPocket', offset: 1000 })
    expect(resizeOpening(pocket, { width: 3000 }, wall, [])).toEqual({ problem: 'no-pocket' })
  })

  it('accepte un redimensionnement qui laisse la place', () => {
    const pocket = opening({ style: 'slidingPocket', offset: 1000 })
    const result = resizeOpening(pocket, { width: 1000 }, wall, [])
    expect('opening' in result && result.opening.width).toBe(1000)
  })
})

describe('applyQuickSize', () => {
  it('porte-fenêtre : allège 0, hauteur 2150, style à vantaux', () => {
    const win = opening({ kind: 'window', width: 1200, height: 1000, sillHeight: 900 })
    const next = ok(applyQuickSize(win, 'frenchWindow2', wall, []))
    expect(next).toMatchObject({ style: 'casement2', width: 1400, height: 2150, sillHeight: 0 })
  })

  it('passe-plat : baie libre de 600 × 600 à 1000 d\'allège', () => {
    const bay = opening({ kind: 'bay', width: 2400, height: 2150 })
    const next = ok(applyQuickSize(bay, 'passThrough', wall, []))
    expect(next).toMatchObject({ style: 'free', width: 600, height: 600, sillHeight: 1000 })
  })

  it('ne s\'applique pas à un autre type d\'ouverture', () => {
    const door = opening()
    expect(ok(applyQuickSize(door, 'shopWindow', wall, []))).toBe(door)
  })

  it('est refusée si elle dépasse le mur', () => {
    const low = { points: [0, 0, 4000, 0] as number[], height: 2000 }
    expect(applyQuickSize(opening(), 'entryDoor', low, [])).toEqual({ problem: 'too-tall' })
  })
})

describe('changeOpeningKind et style', () => {
  it('retire le style et l\'oscillo-battant quand le type change', () => {
    const win = opening({ kind: 'window', style: 'casement1', tiltTurn: true })
    const door = changeOpeningKind(win, 'door', 2500)
    expect(door.style).toBeUndefined()
    expect(door.tiltTurn).toBeUndefined()
  })
})

describe('setTiltTurn', () => {
  it('active et retire l\'option sur une fenêtre à vantaux', () => {
    const win = opening({ kind: 'window', style: 'casement1' })
    const on = setTiltTurn(win, true)
    expect(on.tiltTurn).toBe(true)
    expect(setTiltTurn(on, false).tiltTurn).toBeUndefined()
  })

  it('ne fait rien sur une fenêtre fixe', () => {
    const fixed = opening({ kind: 'window', style: 'fixed' })
    expect(setTiltTurn(fixed, true)).toBe(fixed)
  })
})
