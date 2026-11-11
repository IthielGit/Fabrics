import { describe, expect, it } from 'vitest'
import { pointDistance, polygonArea, polygonPerimeter } from '../geometry/polygon'
import {
  closedWallAxisAround,
  createRectangleRoom,
  createRoomWithWalls,
  isRectangle,
  rectangleCorners,
  straightWallPoints,
} from './construction'

describe('rectangleCorners', () => {
  it('donne les quatre coins quel que soit l’ordre des deux coins opposés', () => {
    const expected = [
      { x: 0, y: 0 },
      { x: 4000, y: 0 },
      { x: 4000, y: 3000 },
      { x: 0, y: 3000 },
    ]
    expect(rectangleCorners({ x: 0, y: 0 }, { x: 4000, y: 3000 })).toEqual(expected)
    expect(rectangleCorners({ x: 4000, y: 3000 }, { x: 0, y: 0 })).toEqual(expected)
    expect(rectangleCorners({ x: 4000, y: 0 }, { x: 0, y: 3000 })).toEqual(expected)
  })

  it('refuse un rectangle aplati', () => {
    expect(isRectangle({ x: 0, y: 0 }, { x: 4000, y: 3000 })).toBe(true)
    expect(isRectangle({ x: 0, y: 0 }, { x: 4000, y: 0 })).toBe(false)
    expect(isRectangle({ x: 0, y: 0 }, { x: 0, y: 3000 })).toBe(false)
  })
})

describe('mur droit', () => {
  it('a deux points', () => {
    expect(straightWallPoints({ x: 0, y: 0 }, { x: 3500, y: 0 })).toEqual([0, 0, 3500, 0])
  })
})

describe('pièce rectangulaire', () => {
  it('4000 × 3000 mm : 12 m² et 14 000 mm de périmètre', () => {
    const room = createRectangleRoom('Pièce 1', { x: 0, y: 0 }, { x: 4000, y: 3000 })
    expect(polygonArea(room.points)).toBeCloseTo(12e6)
    expect(polygonPerimeter(room.points)).toBeCloseTo(14000)
  })
})

describe('pièce avec murs', () => {
  it('axe du mur de 4200 × 3200 mm pour une pièce de 4000 × 3000 mm et un mur de 200 mm', () => {
    const [wall, room] = createRoomWithWalls(
      'Pièce 1',
      'Mur 1',
      { x: 0, y: 0 },
      { x: 4000, y: 3000 },
      200,
      2700,
    )
    expect(wall.points).toEqual([-100, -100, 4100, -100, 4100, 3100, -100, 3100, -100, -100])
    expect(wall.thickness).toBe(200)
    expect(wall.height).toBe(2700)
    expect(polygonArea(room.points)).toBeCloseTo(12e6)
    const axis = wall.points
    expect(pointDistance({ x: axis[0], y: axis[1] }, { x: axis[2], y: axis[3] })).toBe(4200)
    expect(pointDistance({ x: axis[2], y: axis[3] }, { x: axis[4], y: axis[5] })).toBe(3200)
    // Le contour est fermé : le dernier point rejoint le premier.
    expect(axis.slice(-2)).toEqual(axis.slice(0, 2))
  })

  it('les faces intérieures du mur suivent le rectangle tracé', () => {
    const axis = closedWallAxisAround({ x: 1000, y: 500 }, { x: 5000, y: 3500 }, 300)
    expect(axis.slice(0, 2)).toEqual([850, 350])
  })
})
