import { describe, expect, it } from 'vitest'
import type { CanvasElement, DimensionElement, RoomElement, WallElement } from '../../types/document'
import { collectSnapVertices, constrainAngle, snapPoint, type PointSnapContext } from './snapping'

const NONE: PointSnapContext = {
  vertices: [],
  gridSize: null,
  threshold: 80,
  from: null,
  constrain: false,
}

const BASE = { rotation: 0, opacity: 1, locked: false, hidden: false, x: 0, y: 0 }

function wall(id: string, points: number[], thickness = 200): WallElement {
  return { ...BASE, id, name: id, type: 'wall', points, thickness, height: 2500, fill: '#444' }
}
function room(id: string, points: number[]): RoomElement {
  return { ...BASE, id, name: id, type: 'room', points, fill: '#0f0', showLabel: true }
}
function dimension(id: string, points: [number, number, number, number]): DimensionElement {
  return { ...BASE, id, name: id, type: 'dimension', points, offset: 300 }
}

describe('constrainAngle', () => {
  const from = { x: 1000, y: 1000 }

  it('aligne exactement à l’horizontale (pas de décimales parasites)', () => {
    expect(constrainAngle(from, { x: 3000, y: 1100 })).toEqual({ x: 3000, y: 1000 })
  })

  it('aligne exactement à la verticale', () => {
    expect(constrainAngle(from, { x: 1100, y: 4000 })).toEqual({ x: 1000, y: 4000 })
    expect(constrainAngle(from, { x: 900, y: -2000 })).toEqual({ x: 1000, y: -2000 })
  })

  it('aligne à 45° en projetant le curseur sur la diagonale', () => {
    // décalage (2000, 1800) → projection sur la diagonale : 1900 dans chaque axe
    const result = constrainAngle(from, { x: 3000, y: 2800 })
    expect(result.x).toBeCloseTo(2900)
    expect(result.y).toBeCloseTo(2900)
  })

  it('gère les autres quadrants (135°, 225°, 315°)', () => {
    const a = constrainAngle(from, { x: 0, y: 1950 })
    expect(a.x - from.x).toBeCloseTo(-(a.y - from.y))
    const b = constrainAngle(from, { x: 0, y: 0 })
    expect(b.x - from.x).toBeCloseTo(b.y - from.y)
    const c = constrainAngle(from, { x: 1950, y: 0 })
    expect(c.x - from.x).toBeCloseTo(-(c.y - from.y))
  })

  it('renvoie le même point si la distance est nulle', () => {
    expect(constrainAngle(from, from)).toEqual(from)
  })
})

describe('snapPoint', () => {
  it('ne change rien sans aimantation', () => {
    expect(snapPoint({ x: 123, y: 456 }, NONE)).toEqual({ point: { x: 123, y: 456 }, kind: 'none' })
  })

  it('s’aimante sur un sommet proche', () => {
    const result = snapPoint(
      { x: 1030, y: 20 },
      { ...NONE, vertices: [{ x: 1000, y: 0 }], threshold: 50 },
    )
    expect(result).toEqual({ point: { x: 1000, y: 0 }, kind: 'vertex' })
  })

  it('ignore un sommet trop éloigné', () => {
    const result = snapPoint(
      { x: 1100, y: 0 },
      { ...NONE, vertices: [{ x: 1000, y: 0 }], threshold: 50 },
    )
    expect(result.kind).toBe('none')
  })

  it('choisit le sommet le plus proche', () => {
    const result = snapPoint(
      { x: 1000, y: 0 },
      {
        ...NONE,
        threshold: 100,
        vertices: [
          { x: 1060, y: 0 },
          { x: 1020, y: 0 },
        ],
      },
    )
    expect(result.point).toEqual({ x: 1020, y: 0 })
  })

  it('s’aimante sur la grille', () => {
    const result = snapPoint({ x: 1234, y: 4567 }, { ...NONE, gridSize: 100 })
    expect(result).toEqual({ point: { x: 1200, y: 4600 }, kind: 'grid' })
  })

  it('le sommet est prioritaire sur la grille', () => {
    const result = snapPoint(
      { x: 1013, y: 7 },
      { ...NONE, gridSize: 100, vertices: [{ x: 1020, y: 0 }], threshold: 30 },
    )
    expect(result).toEqual({ point: { x: 1020, y: 0 }, kind: 'vertex' })
  })

  it('avec Maj : contrainte horizontale, puis grille le long de l’axe', () => {
    const result = snapPoint(
      { x: 2540, y: 1090 },
      { ...NONE, from: { x: 1000, y: 1000 }, constrain: true, gridSize: 100 },
    )
    expect(result.kind).toBe('angle')
    expect(result.point).toEqual({ x: 2500, y: 1000 })
  })

  it('avec Maj sans grille : contrainte seule', () => {
    const result = snapPoint(
      { x: 2540, y: 1090 },
      { ...NONE, from: { x: 1000, y: 1000 }, constrain: true },
    )
    expect(result).toEqual({ point: { x: 2540, y: 1000 }, kind: 'angle' })
  })

  it('avec Maj à 45° : la diagonale reste à 45° malgré la grille', () => {
    const from = { x: 0, y: 0 }
    const result = snapPoint(
      { x: 1040, y: 980 },
      { ...NONE, from, constrain: true, gridSize: 100 },
    )
    expect(result.point.x).toBeCloseTo(result.point.y)
  })

  it('avec Maj sans point précédent : pas de contrainte', () => {
    const result = snapPoint({ x: 123, y: 456 }, { ...NONE, constrain: true, from: null })
    expect(result.kind).toBe('none')
  })
})

describe('collectSnapVertices', () => {
  it('rassemble les points des murs, pièces et cotes', () => {
    const elements: CanvasElement[] = [
      wall('w', [0, 0, 1000, 0]),
      room('r', [0, 0, 100, 0, 100, 100]),
      dimension('d', [10, 10, 20, 20]),
    ]
    const vertices = collectSnapVertices(elements)
    expect(vertices).toContainEqual({ x: 1000, y: 0 }) // sommet de mur
    expect(vertices).toContainEqual({ x: 100, y: 100 }) // sommet de pièce
    expect(vertices).toContainEqual({ x: 20, y: 20 }) // extrémité de cote
    expect(vertices.some((v) => Math.abs(v.y - 100) < 1e-6 && Math.abs(v.x - 1000) < 1e-6)).toBe(true) // angle de face
  })

  it('trouve l’angle intérieur de deux murs qui se rejoignent', () => {
    const vertices = collectSnapVertices([
      wall('a', [0, 0, 4000, 0]),
      wall('b', [4000, 0, 4000, 3000]),
    ])
    expect(vertices.some((v) => Math.abs(v.x - 3900) < 1e-6 && Math.abs(v.y - 100) < 1e-6)).toBe(true)
  })

  it('ignore les éléments masqués et exclus', () => {
    const hidden = { ...wall('h', [5000, 5000, 6000, 5000]), hidden: true }
    const excluded = wall('x', [7000, 7000, 8000, 7000])
    const vertices = collectSnapVertices([hidden, excluded], new Set(['x']))
    expect(vertices).toEqual([])
  })

  it('ignore les éléments qui ne sont pas du plan', () => {
    const rect: CanvasElement = {
      ...BASE,
      id: 'rect',
      name: 'rect',
      type: 'rect',
      width: 10,
      height: 10,
      fill: '#000',
      stroke: '#000',
      strokeWidth: 0,
      cornerRadius: 0,
    }
    expect(collectSnapVertices([rect])).toEqual([])
  })
})
