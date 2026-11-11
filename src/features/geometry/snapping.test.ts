import { describe, expect, it } from 'vitest'
import type { CanvasElement, DimensionElement, RoomElement, WallElement } from '../../types/document'
import { createAxisElement } from '../documents/elements'
import {
  collectSnapAxes,
  collectSnapVertices,
  collectSnapWallAxes,
  constrainAngle,
  snapPoint,
  type PointSnapContext,
} from './snapping'

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

describe('alignement doux (sans Maj)', () => {
  const from = { x: 1000, y: 1000 }
  const SOFT: PointSnapContext = { ...NONE, from, softAlign: true, threshold: 80 }

  it('ramène un point presque horizontal sur l’horizontale du point précédent', () => {
    expect(snapPoint({ x: 3000, y: 1090 }, SOFT)).toEqual({
      point: { x: 3000, y: 1000 },
      kind: 'angle',
    })
  })

  it('ramène un point presque vertical sur la verticale', () => {
    expect(snapPoint({ x: 940, y: -2000 }, SOFT)).toEqual({
      point: { x: 1000, y: -2000 },
      kind: 'angle',
    })
  })

  it('laisse un point franchement oblique tel quel (45° compris)', () => {
    expect(snapPoint({ x: 3000, y: 1300 }, SOFT).kind).toBe('none')
    expect(snapPoint({ x: 3000, y: 3000 }, SOFT).kind).toBe('none')
  })

  it('ne ramène pas un segment court dont l’angle est trop grand', () => {
    // 90 mm d’écart sur 100 mm de long : ce n’est pas une ligne « presque droite »
    expect(snapPoint({ x: 1100, y: 1090 }, SOFT).kind).toBe('none')
  })

  it('désactivé par défaut et sans point précédent', () => {
    expect(snapPoint({ x: 3000, y: 1090 }, { ...NONE, from }).kind).toBe('none')
    expect(snapPoint({ x: 3000, y: 1090 }, { ...SOFT, from: null }).kind).toBe('none')
  })

  it('reste droit malgré la grille : la grille ne s’applique que le long de la ligne', () => {
    const result = snapPoint({ x: 3127, y: 1090 }, { ...SOFT, gridSize: 100 })
    expect(result.point).toEqual({ x: 3100, y: 1000 })
    expect(result.kind).toBe('angle')
  })

  it('un tracé de 3 points sur la grille donne des angles droits', () => {
    // Sans alignement, la grille seule donnerait y = 1100 (pente) ; avec, y reste 1000.
    expect(snapPoint({ x: 3127, y: 1060 }, { ...SOFT, gridSize: 100 }).point.y).toBe(1000)
    expect(snapPoint({ x: 3127, y: 1060 }, { ...NONE, from, gridSize: 100 }).point.y).toBe(1100)
  })

  it('le sommet reste prioritaire', () => {
    const result = snapPoint(
      { x: 3000, y: 1090 },
      { ...SOFT, vertices: [{ x: 3000, y: 1130 }], threshold: 80 },
    )
    expect(result).toEqual({ point: { x: 3000, y: 1130 }, kind: 'vertex' })
  })

  it('Maj reste prioritaire sur l’alignement doux', () => {
    const result = snapPoint({ x: 3000, y: 2000 }, { ...SOFT, constrain: true })
    expect(result.kind).toBe('angle')
    expect(result.point.x - from.x).toBeCloseTo(result.point.y - from.y)
  })
})

describe('aimantation sur l’axe des murs', () => {
  // mur horizontal de 200 mm d’épaisseur, de (0, 1000) à (4000, 1000)
  const wallAxes = [{ a: { x: 0, y: 1000 }, b: { x: 4000, y: 1000 }, reach: 100 }]

  it('ramène un point posé dans l’épaisseur du mur sur son axe', () => {
    const result = snapPoint({ x: 2000, y: 1090 }, { ...NONE, wallAxes, threshold: 20 })
    expect(result).toEqual({ point: { x: 2000, y: 1000 }, kind: 'wall' })
  })

  it('accroche aussi à moins de la distance d’accroche d’un mur très fin', () => {
    const thin = [{ a: { x: 0, y: 1000 }, b: { x: 4000, y: 1000 }, reach: 10 }]
    expect(snapPoint({ x: 2000, y: 1015 }, { ...NONE, wallAxes: thin, threshold: 20 }).kind).toBe(
      'wall',
    )
    expect(snapPoint({ x: 2000, y: 1050 }, { ...NONE, wallAxes: thin, threshold: 20 }).kind).toBe(
      'none',
    )
  })

  it('ignore un point plus loin que le mur', () => {
    expect(snapPoint({ x: 2000, y: 1300 }, { ...NONE, wallAxes, threshold: 20 }).kind).toBe('none')
  })

  it('reste borné au segment du mur', () => {
    const result = snapPoint({ x: 4050, y: 1000 }, { ...NONE, wallAxes, threshold: 20 })
    expect(result.point).toEqual({ x: 4000, y: 1000 })
  })

  it('le sommet est prioritaire, et l’axe de mur passe avant la grille', () => {
    const vertex = snapPoint(
      { x: 4010, y: 1050 },
      { ...NONE, wallAxes, vertices: [{ x: 4000, y: 1000 }], threshold: 80 },
    )
    expect(vertex.kind).toBe('vertex')
    const grid = snapPoint({ x: 2037, y: 1060 }, { ...NONE, wallAxes, gridSize: 100, threshold: 20 })
    expect(grid).toEqual({ point: { x: 2037, y: 1000 }, kind: 'wall' })
  })

  it('Maj : la direction contrainte prime sur l’axe de mur', () => {
    const result = snapPoint(
      { x: 2000, y: 1090 },
      { ...NONE, wallAxes, threshold: 20, from: { x: 0, y: 0 }, constrain: true },
    )
    expect(result.kind).toBe('angle')
  })

  it('collectSnapWallAxes : un segment par côté, murs masqués et exclus écartés', () => {
    const elements: CanvasElement[] = [
      wall('w1', [0, 0, 1000, 0, 1000, 500]),
      { ...wall('hidden', [0, 0, 100, 0]), hidden: true },
      wall('skipped', [0, 0, 100, 0], 300),
    ]
    const axes = collectSnapWallAxes(elements, new Set(['skipped']))
    expect(axes).toHaveLength(2)
    expect(axes[0]).toEqual({ a: { x: 0, y: 0 }, b: { x: 1000, y: 0 }, reach: 100 })
  })
})

describe('aimantation sur les axes', () => {
  const axes = [
    { a: { x: 0, y: 3000 }, b: { x: 10000, y: 3000 } }, // horizontal
    { a: { x: 4000, y: 0 }, b: { x: 4000, y: 8000 } }, // vertical
  ]

  it('un point proche d’un axe est ramené sur sa ligne', () => {
    const result = snapPoint({ x: 2000, y: 3040 }, { ...NONE, axes })
    expect(result.kind).toBe('axis')
    expect(result.point).toEqual({ x: 2000, y: 3000 })
  })

  it('hors de la distance d’accroche, rien ne bouge', () => {
    const result = snapPoint({ x: 2000, y: 3200 }, { ...NONE, axes })
    expect(result).toEqual({ point: { x: 2000, y: 3200 }, kind: 'none' })
  })

  it('un sommet prime sur la ligne d’un axe (croisement des axes compris)', () => {
    const crossing = { x: 4000, y: 3000 }
    const result = snapPoint({ x: 4030, y: 3030 }, { ...NONE, axes, vertices: [crossing] })
    expect(result).toEqual({ point: crossing, kind: 'vertex' })
  })

  it('l’axe prime sur la grille', () => {
    const result = snapPoint({ x: 2030, y: 3030 }, { ...NONE, axes, gridSize: 100 })
    expect(result).toEqual({ point: { x: 2030, y: 3000 }, kind: 'axis' })
  })

  it('avec Maj, la direction contrainte prime sur l’axe', () => {
    const result = snapPoint(
      { x: 2000, y: 3040 },
      { ...NONE, axes, from: { x: 0, y: 2900 }, constrain: true },
    )
    expect(result.kind).toBe('angle')
  })

  it('collectSnapVertices contient les croisements des axes, collectSnapAxes les axes visibles', () => {
    const horizontalAxis = createAxisElement('Axe A', 'A', [0, 3000, 10000, 3000])
    const verticalAxis = createAxisElement('Axe 1', '1', [4000, 0, 4000, 8000])
    const hiddenAxis = { ...createAxisElement('Axe B', 'B', [0, 100, 10000, 100]), hidden: true }
    const elements: CanvasElement[] = [horizontalAxis, verticalAxis, hiddenAxis]
    expect(collectSnapVertices(elements)).toEqual([{ x: 4000, y: 3000 }])
    expect(collectSnapAxes(elements)).toHaveLength(2)
    expect(collectSnapAxes(elements, new Set([verticalAxis.id]))).toHaveLength(1)
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
