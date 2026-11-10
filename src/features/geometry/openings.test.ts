import { describe, expect, it } from 'vitest'
import type { OpeningElement, WallElement } from '../../types/document'
import {
  clampOpeningOffset,
  findWallAt,
  openingArea,
  openingClearances,
  openingFitsHeight,
  openingGeometry,
  openingInterval,
  openingsOnSegment,
  relocateOpening,
  wallSegment,
  wallSegmentCount,
} from './openings'

function wall(points: number[], id = 'w1', thickness = 200): WallElement {
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
    thickness,
    height: 2500,
    fill: '#475569',
  }
}

function opening(partial: Partial<OpeningElement> = {}): OpeningElement {
  return {
    id: crypto.randomUUID(),
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
    offset: 1000,
    width: 900,
    height: 2100,
    sillHeight: 0,
    hinge: 'start',
    side: 'left',
    ...partial,
  }
}

describe('wallSegment', () => {
  it('donne longueur, direction et normale', () => {
    const s = wallSegment(wall([0, 0, 4000, 0]), 0)
    expect(s?.length).toBe(4000)
    expect(s?.direction).toEqual({ x: 1, y: 0 })
    expect(s?.normal.x).toBeCloseTo(0)
    expect(s?.normal.y).toBe(1)
  })

  it('renvoie null pour un segment absent ou de longueur nulle', () => {
    const w = wall([0, 0, 4000, 0, 4000, 0])
    expect(wallSegment(w, 1)).toBeNull()
    expect(wallSegment(w, 2)).toBeNull()
    expect(wallSegment(w, -1)).toBeNull()
  })

  it('compte les segments', () => {
    expect(wallSegmentCount(wall([0, 0, 4000, 0, 4000, 3000]))).toBe(2)
    expect(wallSegmentCount(wall([0, 0]))).toBe(0)
  })
})

describe('openingGeometry', () => {
  it('place l’ouverture le long du segment', () => {
    const g = openingGeometry(opening({ segmentIndex: 1, offset: 1500, width: 1000 }), wall([0, 0, 4000, 0, 4000, 3000]))
    expect(g?.center).toEqual({ x: 4000, y: 1500 })
    expect(g?.start).toEqual({ x: 4000, y: 1000 })
    expect(g?.end).toEqual({ x: 4000, y: 2000 })
    expect(g?.angle).toBe(90)
    expect(g?.thickness).toBe(200)
  })

  it('renvoie null si le segment n’existe plus', () => {
    expect(openingGeometry(opening({ segmentIndex: 3 }), wall([0, 0, 4000, 0]))).toBeNull()
  })
})

describe('clampOpeningOffset', () => {
  it('garde une position déjà valable', () => {
    expect(clampOpeningOffset(2000, 900, 4000)).toBe(2000)
  })

  it('empêche de dépasser les extrémités du segment', () => {
    expect(clampOpeningOffset(100, 900, 4000)).toBe(450)
    expect(clampOpeningOffset(3900, 900, 4000)).toBe(3550)
  })

  it('refuse une ouverture plus large que le segment', () => {
    expect(clampOpeningOffset(500, 1200, 1000)).toBeNull()
  })

  it('accepte une ouverture exactement aussi large que le segment', () => {
    expect(clampOpeningOffset(300, 1000, 1000)).toBe(500)
  })

  it('évite de chevaucher une voisine et choisit le côté le plus proche', () => {
    const neighbour = { from: 1500, to: 2500 }
    // Voisine de 1500 à 2500 ; une ouverture de 900 ne peut pas avoir son centre entre 1050 et 2950.
    expect(clampOpeningOffset(1900, 900, 4000, [neighbour])).toBe(1050)
    expect(clampOpeningOffset(2100, 900, 4000, [neighbour])).toBe(2950)
  })

  it('permet de toucher une voisine', () => {
    expect(clampOpeningOffset(1050, 900, 4000, [{ from: 1500, to: 2500 }])).toBe(1050)
  })

  it('renvoie null quand il n’y a plus de place', () => {
    expect(clampOpeningOffset(1000, 900, 2000, [{ from: 500, to: 1500 }])).toBeNull()
  })

  it('trouve la place entre deux voisines', () => {
    const occupied = [
      { from: 0, to: 1000 },
      { from: 2000, to: 3000 },
    ]
    // Centre permis entre 1450 et 1550 : le plus proche de 400 est 1450.
    expect(clampOpeningOffset(400, 900, 3000, occupied)).toBe(1450)
  })
})

describe('openingClearances', () => {
  it('donne les distances libres de chaque côté', () => {
    expect(openingClearances(1000, 900, 4000)).toEqual({ before: 550, after: 2550 })
  })
})

describe('openingFitsHeight', () => {
  it('accepte une porte de 2,10 m dans un mur de 2,50 m', () => {
    expect(openingFitsHeight({ height: 2100, sillHeight: 0 }, 2500)).toBe(true)
  })

  it('refuse une fenêtre dont le haut dépasse le mur', () => {
    expect(openingFitsHeight({ height: 1000, sillHeight: 1600 }, 2500)).toBe(false)
  })

  it('accepte une ouverture qui arrive pile en haut du mur', () => {
    expect(openingFitsHeight({ height: 1500, sillHeight: 1000 }, 2500)).toBe(true)
  })
})

describe('openingArea', () => {
  it('porte de 0,90 × 2,10 m → 1,89 m²', () => {
    expect(openingArea({ width: 900, height: 2100 }) / 1_000_000).toBeCloseTo(1.89, 10)
  })
})

describe('openingsOnSegment et openingInterval', () => {
  it('filtre par mur et segment, en excluant une ouverture', () => {
    const a = opening({ id: 'a' })
    const b = opening({ id: 'b', segmentIndex: 1 })
    const c = opening({ id: 'c', wallId: 'w2' })
    const d = opening({ id: 'd' })
    expect(openingsOnSegment([a, b, c, d], 'w1', 0, 'a').map((o) => o.id)).toEqual(['d'])
  })

  it('donne l’intervalle occupé', () => {
    expect(openingInterval({ offset: 1000, width: 900 })).toEqual({ from: 550, to: 1450 })
  })
})

describe('findWallAt', () => {
  const horizontal = wall([0, 0, 4000, 0], 'h')
  const vertical = wall([4000, 0, 4000, 3000], 'v')

  it('trouve le mur sous le point avec sa position', () => {
    const hit = findWallAt({ x: 1200, y: 60 }, [horizontal, vertical])
    expect(hit?.wall.id).toBe('h')
    expect(hit?.segmentIndex).toBe(0)
    expect(hit?.offset).toBe(1200)
    expect(hit?.distance).toBe(60)
  })

  it('ignore un point hors de l’épaisseur (plus la tolérance)', () => {
    expect(findWallAt({ x: 1200, y: 150 }, [horizontal])).toBeNull()
    expect(findWallAt({ x: 1200, y: 150 }, [horizontal], 100)?.wall.id).toBe('h')
  })

  it('choisit le mur le plus proche', () => {
    expect(findWallAt({ x: 3950, y: 20 }, [horizontal, vertical])?.wall.id).toBe('h')
    expect(findWallAt({ x: 3980, y: 60 }, [horizontal, vertical])?.wall.id).toBe('v')
  })

  it('trouve le bon segment d’un mur en L', () => {
    const hit = findWallAt({ x: 4050, y: 1000 }, [wall([0, 0, 4000, 0, 4000, 3000])])
    expect(hit?.segmentIndex).toBe(1)
    expect(hit?.offset).toBe(1000)
  })
})

describe('relocateOpening', () => {
  it('garde l’ouverture au même endroit quand on allonge le mur', () => {
    const before = wall([0, 0, 4000, 0])
    const after = wall([0, 0, 6000, 0])
    const moved = relocateOpening(opening({ offset: 1000 }), before, after, [])
    expect(moved?.segmentIndex).toBe(0)
    expect(moved?.offset).toBe(1000)
  })

  it('la ramène sur le mur quand on le raccourcit', () => {
    const moved = relocateOpening(opening({ offset: 3000 }), wall([0, 0, 4000, 0]), wall([0, 0, 2000, 0]), [])
    expect(moved?.offset).toBe(1550)
  })

  it('suit un sommet ajouté : passe sur le bon segment', () => {
    const before = wall([0, 0, 4000, 0])
    const after = wall([0, 0, 2000, 0, 4000, 0])
    const moved = relocateOpening(opening({ offset: 3000 }), before, after, [])
    expect(moved?.segmentIndex).toBe(1)
    expect(moved?.offset).toBe(1000)
  })

  it('renvoie null quand l’ouverture ne tient plus', () => {
    expect(relocateOpening(opening({ width: 900 }), wall([0, 0, 4000, 0]), wall([0, 0, 500, 0]), [])).toBeNull()
  })

  it('évite les autres ouvertures du nouveau segment', () => {
    const other = opening({ id: 'other', offset: 1000 })
    const moved = relocateOpening(opening({ offset: 3000 }), wall([0, 0, 4000, 0]), wall([0, 0, 2000, 0]), [other])
    expect(moved).toBeNull()
  })
})
