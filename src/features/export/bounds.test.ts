import { describe, expect, it } from 'vitest'
import type { CanvasElement } from '../../types/document'
import {
  createEllipseElement,
  createLineElement,
  createRectElement,
  createRoomElement,
  createWallElement,
} from '../documents/elements'
import { elementBounds, planExportExtent } from './bounds'

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
