import { describe, expect, it } from 'vitest'
import type { CanvasElement } from '../../types/document'
import {
  createAxisElement,
  createEllipseElement,
  createFurnitureElement,
  createLineElement,
  createOpeningElement,
  createRectElement,
  createRoomElement,
  createWallElement,
} from '../documents/elements'
import { elementBounds, openingBounds, planExportExtent } from './bounds'

describe('elementBounds', () => {
  it('rectangle', () => {
    const rect = createRectElement('R', 100, 200, 300, 50)
    expect(elementBounds(rect)).toEqual({ x: 100, y: 200, width: 300, height: 50 })
  })

  it('rectangle tourné de 90°', () => {
    const rect = { ...createRectElement('R', 0, 0, 300, 50), rotation: 90 }
    const box = elementBounds(rect)
    expect(box?.width).toBeCloseTo(50)
    expect(box?.height).toBeCloseTo(300)
    expect(box?.x).toBeCloseTo(-50)
  })

  it('ellipse (positionnée par son centre)', () => {
    const ellipse = createEllipseElement('E', 0, 0, 200, 100)
    expect(elementBounds(ellipse)).toEqual({ x: 0, y: 0, width: 200, height: 100 })
  })

  it('ligne (points relatifs)', () => {
    const line = createLineElement('L', 10, 20, 100, 50, 2)
    expect(elementBounds(line)).toEqual({ x: 10, y: 20, width: 100, height: 50 })
  })

  it('mur : tient compte de l’épaisseur', () => {
    const wall = createWallElement('M', [0, 0, 4000, 0], 200, 2500)
    const box = elementBounds(wall)
    expect(box?.y).toBeCloseTo(-100)
    expect(box?.height).toBeCloseTo(200)
    expect(box?.width).toBeCloseTo(4000)
  })

  it('pièce', () => {
    const room = createRoomElement('P', [0, 0, 4000, 0, 4000, 3000, 0, 3000])
    expect(elementBounds(room)).toEqual({ x: 0, y: 0, width: 4000, height: 3000 })
  })

  it('cote : inclut la ligne de cote décalée', () => {
    const dim: CanvasElement = {
      id: 'd',
      name: 'd',
      type: 'dimension',
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      points: [0, 0, 1000, 0],
      offset: 500,
    }
    const box = elementBounds(dim)
    expect(box?.y).toBeCloseTo(0)
    expect(box?.height).toBeGreaterThanOrEqual(500)
  })
})

describe('planExportExtent', () => {
  it('renvoie null pour un plan vide', () => {
    expect(planExportExtent([])).toBeNull()
  })

  it('agrandit l’emprise de 500 mm de chaque côté', () => {
    const room = createRoomElement('P', [1000, 1000, 5000, 1000, 5000, 4000, 1000, 4000])
    expect(planExportExtent([room])).toEqual({ x: 500, y: 500, width: 5000, height: 4000 })
  })

  it('ignore les éléments masqués', () => {
    const visible = createRoomElement('A', [0, 0, 1000, 0, 1000, 1000])
    const hidden = { ...createRoomElement('B', [9000, 9000, 9500, 9000, 9500, 9500]), hidden: true }
    expect(planExportExtent([visible, hidden])).toEqual({
      x: -500,
      y: -500,
      width: 2000,
      height: 2000,
    })
    expect(planExportExtent([hidden])).toBeNull()
  })
})

describe('ouvertures dans la zone exportée', () => {
  const wall = createWallElement('Mur', [0, 0, 4000, 0], 200, 2500)
  const door = (kind: 'door' | 'window' = 'door') =>
    createOpeningElement(kind, 'Porte', {
      wallId: wall.id,
      segmentIndex: 0,
      offset: 2000,
      side: 'left',
    })

  it('le battant d’une porte fait partie de l’emprise (il dépasse du mur)', () => {
    const box = openingBounds(door(), wall)
    // Porte de 900 mm, charnière au début, battant ouvert vers +y : il monte à 900 mm du mur.
    expect(box?.x).toBeCloseTo(1550)
    expect(box?.width).toBeCloseTo(900)
    expect(box?.y).toBeCloseTo(-102)
    expect(box!.y + box!.height).toBeCloseTo(900)
  })

  it('une fenêtre reste dans l’épaisseur du mur', () => {
    const box = openingBounds(door('window'), wall)
    expect(box!.height).toBeLessThan(210)
  })

  it('l’emprise d’un plan inclut le battant d’une porte', () => {
    const extent = planExportExtent([wall, door()], 500)
    // Découpe : y de −102 à 102 (2 mm de plus que le mur de chaque côté) ; battant jusqu'à
    // y = 900 ; marge de 500.
    expect(extent?.y).toBeCloseTo(-602)
    expect(extent!.y + extent!.height).toBeCloseTo(1400)
  })

  it('une ouverture dont le mur est masqué ne compte pas', () => {
    const hiddenWall = { ...wall, hidden: true }
    expect(planExportExtent([hiddenWall, door()])).toBeNull()
  })

  it('une ouverture sans mur ne compte pas', () => {
    expect(planExportExtent([door()])).toBeNull()
  })

  it('une ouverture masquée ne compte pas', () => {
    const hidden = { ...door(), hidden: true }
    const extent = planExportExtent([wall, hidden], 0)
    expect(extent!.y + extent!.height).toBeCloseTo(100)
  })

  it('openingBounds renvoie null si le segment n’existe plus', () => {
    const missing = { ...door(), segmentIndex: 5 }
    expect(openingBounds(missing, wall)).toBeNull()
  })
})

describe('emprise d’un axe', () => {
  it('comprend la ligne et ses deux bulles', () => {
    const axis = createAxisElement('Axe A', 'A', [0, 3000, 4000, 3000])
    const box = elementBounds(axis)!
    expect(box.x).toBeCloseTo(-500)
    expect(box.x + box.width).toBeCloseTo(4500)
    expect(box.y).toBeCloseTo(2750)
    expect(box.height).toBeCloseTo(500)
  })

  it('un axe visible agrandit l’emprise exportée du plan', () => {
    const wall = createWallElement('Mur', [0, 0, 1000, 0], 200, 2700)
    const axis = createAxisElement('Axe 1', '1', [500, -2000, 500, 3000])
    const withAxis = planExportExtent([wall, axis], 0)!
    const without = planExportExtent([wall], 0)!
    expect(withAxis.height).toBeGreaterThan(without.height)
    expect(planExportExtent([wall, { ...axis, hidden: true }], 0)).toEqual(without)
  })
})

describe('emprise d’un objet de la bibliothèque', () => {
  it('suit sa position, sa taille et sa rotation', () => {
    const bed = createFurnitureElement('Lit', 'bed-queen', 1000, 2000, 1600, 2000)
    expect(elementBounds(bed)).toEqual({ x: 1000, y: 2000, width: 1600, height: 2000 })
    const turned = elementBounds({ ...bed, rotation: 90 })!
    expect(turned.width).toBeCloseTo(2000)
    expect(turned.height).toBeCloseTo(1600)
    expect(turned.x).toBeCloseTo(-1000)
  })
})
