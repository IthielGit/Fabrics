import { describe, expect, it } from 'vitest'
import type { OpeningElement, WallElement } from '../../types/document'
import { planOpeningPlacement, pointerOffset, slideOpening } from './openingPlacement'

const DOOR = { width: 900, height: 2100, sillHeight: 0 }

function wall(points: number[], id = 'w1', height = 2500): WallElement {
  return {
    id,
    type: 'wall',
    name: 'Mur',
    x: 0,
    y: 0,
    rotation: 0,
    opacity: 1,
    locked: false,
    hidden: false,
    points,
    thickness: 200,
    height,
    fill: '#475569',
  }
}

function opening(offset: number, width = 900, segmentIndex = 0): OpeningElement {
  return {
    id: crypto.randomUUID(),
    type: 'opening',
    name: 'Porte',
    x: 0,
    y: 0,
    rotation: 0,
    opacity: 1,
    locked: false,
    hidden: false,
    kind: 'door',
    wallId: 'w1',
    segmentIndex,
    offset,
    width,
    height: 2100,
    sillHeight: 0,
    hinge: 'start',
    side: 'left',
  }
}

const horizontal = wall([0, 0, 4000, 0])

describe('planOpeningPlacement', () => {
  it('renvoie null quand le curseur est loin des murs', () => {
    expect(planOpeningPlacement({ x: 2000, y: 1000 }, [horizontal], [], DOOR)).toBeNull()
  })

  it('pose la porte sous le curseur, sur le bon segment', () => {
    const placement = planOpeningPlacement({ x: 2000, y: 30 }, [horizontal], [], DOOR)
    expect(placement?.wall.id).toBe('w1')
    expect(placement?.segmentIndex).toBe(0)
    expect(placement?.offset).toBe(2000)
    expect(placement?.problem).toBeNull()
  })

  it('arrondit la position à 10 mm', () => {
    expect(planOpeningPlacement({ x: 2003.7, y: 0 }, [horizontal], [], DOOR)?.offset).toBe(2000)
    expect(planOpeningPlacement({ x: 2006.2, y: 0 }, [horizontal], [], DOOR)?.offset).toBe(2010)
  })

  it('garde la porte entière sur le mur près d’une extrémité', () => {
    expect(planOpeningPlacement({ x: 100, y: 0 }, [horizontal], [], DOOR)?.offset).toBe(450)
    expect(planOpeningPlacement({ x: 3950, y: 0 }, [horizontal], [], DOOR)?.offset).toBe(3550)
  })

  it('ouvre la porte du côté où se trouve le curseur', () => {
    // Sur un axe orienté vers +x, la normale « gauche » est +y.
    expect(planOpeningPlacement({ x: 2000, y: 50 }, [horizontal], [], DOOR)?.side).toBe('left')
    expect(planOpeningPlacement({ x: 2000, y: -50 }, [horizontal], [], DOOR)?.side).toBe('right')
  })

  it('refuse une ouverture plus haute que le mur', () => {
    const low = wall([0, 0, 4000, 0], 'w1', 2000)
    const placement = planOpeningPlacement({ x: 2000, y: 0 }, [low], [], DOOR)
    expect(placement?.problem).toBe('too-tall')
  })

  it('accepte une fenêtre dont le haut arrive pile au sommet du mur', () => {
    const size = { width: 1200, height: 1500, sillHeight: 1000 }
    expect(planOpeningPlacement({ x: 2000, y: 0 }, [horizontal], [], size)?.problem).toBeNull()
  })

  it('décale la porte pour ne pas chevaucher une voisine', () => {
    const neighbour = opening(2000) // occupe de 1550 à 2450
    const placement = planOpeningPlacement({ x: 2100, y: 0 }, [horizontal], [neighbour], DOOR)
    expect(placement?.problem).toBeNull()
    expect(placement?.offset).toBe(2900) // 2450 + 450
  })

  it('signale qu’il n’y a plus de place', () => {
    const full = opening(2000, 3800)
    const placement = planOpeningPlacement({ x: 2000, y: 0 }, [horizontal], [full], DOOR)
    expect(placement?.problem).toBe('no-room')
  })

  it('refuse une porte plus large que le mur', () => {
    const short = wall([0, 0, 600, 0])
    expect(planOpeningPlacement({ x: 300, y: 0 }, [short], [], DOOR)?.problem).toBe('no-room')
  })

  it('ignore les ouvertures des autres murs et des autres segments', () => {
    const elsewhere = { ...opening(2000), wallId: 'w2' }
    const otherSegment = opening(2000, 900, 1)
    const l = wall([0, 0, 4000, 0, 4000, 3000])
    const placement = planOpeningPlacement({ x: 2000, y: 0 }, [l], [elsewhere, otherSegment], DOOR)
    expect(placement?.offset).toBe(2000)
    expect(placement?.problem).toBeNull()
  })

  it('utilise la tolérance pour viser un mur fin', () => {
    expect(planOpeningPlacement({ x: 2000, y: 180 }, [horizontal], [], DOOR)).toBeNull()
    expect(planOpeningPlacement({ x: 2000, y: 180 }, [horizontal], [], DOOR, 100)).not.toBeNull()
  })
})

describe('pointerOffset', () => {
  it('projette le curseur sur le segment, sans borner', () => {
    expect(pointerOffset({ x: 1200, y: 300 }, horizontal, 0)).toBe(1200)
    expect(pointerOffset({ x: -500, y: 0 }, horizontal, 0)).toBe(-500)
    expect(pointerOffset({ x: 5000, y: 0 }, horizontal, 0)).toBe(5000)
  })

  it('renvoie null pour un segment inexistant', () => {
    expect(pointerOffset({ x: 0, y: 0 }, horizontal, 3)).toBeNull()
  })

  it('suit la direction d’un segment vertical', () => {
    const l = wall([0, 0, 4000, 0, 4000, 3000])
    expect(pointerOffset({ x: 4100, y: 1000 }, l, 1)).toBe(1000)
  })
})

describe('slideOpening', () => {
  it('fait coulisser l’ouverture avec le curseur', () => {
    const door = opening(1000)
    expect(slideOpening(door, horizontal, [door], { x: 2000, y: 0 }, 0).offset).toBe(2000)
  })

  it('garde l’écart entre le curseur et le centre au moment de la saisie', () => {
    const door = opening(1000)
    // Saisie à 200 mm du centre : le centre suit le curseur avec ce décalage.
    expect(slideOpening(door, horizontal, [door], { x: 2200, y: 0 }, 200).offset).toBe(2000)
  })

  it('s’arrête aux extrémités du mur', () => {
    const door = opening(1000)
    expect(slideOpening(door, horizontal, [door], { x: -3000, y: 0 }, 0).offset).toBe(450)
    expect(slideOpening(door, horizontal, [door], { x: 9000, y: 0 }, 0).offset).toBe(3550)
  })

  it('ignore la distance du curseur au mur', () => {
    const door = opening(1000)
    expect(slideOpening(door, horizontal, [door], { x: 2000, y: 2500 }, 0).offset).toBe(2000)
  })

  it('arrondit à 10 mm', () => {
    const door = opening(1000)
    expect(slideOpening(door, horizontal, [door], { x: 2004, y: 0 }, 0).offset).toBe(2000)
  })

  it('s’arrête contre une voisine', () => {
    const door = opening(1000)
    const other = opening(3000) // occupe de 2550 à 3450
    // La porte (900 de large) ne peut pas avoir son centre entre 2100 et 3900.
    expect(slideOpening(door, horizontal, [door, other], { x: 2300, y: 0 }, 0).offset).toBe(2100)
  })

  it('renvoie la même ouverture quand rien ne change', () => {
    const door = opening(1000)
    expect(slideOpening(door, horizontal, [door], { x: 1000, y: 0 }, 0)).toBe(door)
  })

  it('ne touche pas aux autres champs', () => {
    const door = { ...opening(1000), hinge: 'end' as const, side: 'right' as const }
    const moved = slideOpening(door, horizontal, [door], { x: 2000, y: 0 }, 0)
    expect(moved).toMatchObject({ id: door.id, hinge: 'end', side: 'right', width: 900 })
  })
})
