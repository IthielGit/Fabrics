import { describe, expect, it } from 'vitest'
import type { CanvasElement, DimensionElement, RoomElement, WallElement } from '../../types/document'
import { createAxisElement, createOpeningElement } from '../documents/elements'
import {
  collectAlignTargets,
  collectOpeningSnapPoints,
  collectSnapAxes,
  collectSnapVertices,
  collectSnapWallAxes,
  constrainAngle,
  preferredVertexKinds,
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
    expect(result).toEqual({ point: { x: 1000, y: 0 }, kind: 'vertex', vertexKind: 'draft' })
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
    expect(result).toEqual({ point: { x: 1020, y: 0 }, kind: 'vertex', vertexKind: 'draft' })
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
    expect(result).toEqual({ point: { x: 3000, y: 1130 }, kind: 'vertex', vertexKind: 'draft' })
  })

  it('Maj reste prioritaire sur l’alignement doux', () => {
    const result = snapPoint({ x: 3000, y: 2000 }, { ...SOFT, constrain: true })
    expect(result.kind).toBe('angle')
    expect(result.point.x - from.x).toBeCloseTo(result.point.y - from.y)
  })
})

describe('guides d’alignement', () => {
  const alignTargets = [
    { x: 1000, y: 5000 },
    { x: 4000, y: 2000 },
  ]
  const ALIGN: PointSnapContext = { ...NONE, alignTargets, threshold: 80 }

  it('aligne x sur un point voisin et affiche un guide vertical', () => {
    const result = snapPoint({ x: 1040, y: 3000 }, ALIGN)
    expect(result).toEqual({
      point: { x: 1000, y: 3000 },
      kind: 'align',
      guides: [{ orientation: 'vertical', position: 1000 }],
    })
  })

  it('aligne y sur un point voisin et affiche un guide horizontal', () => {
    const result = snapPoint({ x: 2500, y: 2050 }, ALIGN)
    expect(result.point).toEqual({ x: 2500, y: 2000 })
    expect(result.guides).toEqual([{ orientation: 'horizontal', position: 2000 }])
  })

  it('aligne x et y en même temps sur deux points différents', () => {
    const result = snapPoint({ x: 1030, y: 2040 }, ALIGN)
    expect(result.point).toEqual({ x: 1000, y: 2000 })
    expect(result.guides).toHaveLength(2)
  })

  it('ne fait rien trop loin, sans cible, ou sans alignTargets', () => {
    expect(snapPoint({ x: 1200, y: 3000 }, ALIGN)).toEqual({
      point: { x: 1200, y: 3000 },
      kind: 'none',
    })
    expect(snapPoint({ x: 1040, y: 3000 }, { ...ALIGN, alignTargets: [] }).kind).toBe('none')
    expect(snapPoint({ x: 1040, y: 3000 }, NONE).guides).toBeUndefined()
  })

  it('la coordonnée alignée n’est pas arrondie à la grille, l’autre l’est', () => {
    const result = snapPoint({ x: 1040, y: 3070 }, { ...ALIGN, gridSize: 100 })
    expect(result.point).toEqual({ x: 1000, y: 3100 })
    const offGrid = snapPoint(
      { x: 1233, y: 3070 },
      { ...ALIGN, gridSize: 100, alignTargets: [{ x: 1250, y: 9000 }] },
    )
    expect(offGrid.point).toEqual({ x: 1250, y: 3100 })
    expect(offGrid.kind).toBe('align')
  })

  it('sur une direction horizontale, seule la coordonnée libre s’aligne', () => {
    // alignement doux depuis (0, 2000) : le point reste à y = 2000 ; x s'aligne sur 4000
    const result = snapPoint(
      { x: 4030, y: 2040 },
      { ...ALIGN, from: { x: 0, y: 2000 }, softAlign: true, alignTargets: [{ x: 4000, y: 7000 }] },
    )
    expect(result.point).toEqual({ x: 4000, y: 2000 })
    expect(result.kind).toBe('angle')
    expect(result.guides).toEqual([{ orientation: 'vertical', position: 4000 }])
  })

  it('sur une diagonale (Maj), aucun alignement', () => {
    const result = snapPoint(
      { x: 1000, y: 1010 },
      { ...ALIGN, from: { x: 0, y: 0 }, constrain: true, alignTargets: [{ x: 1000, y: 5000 }] },
    )
    expect(result.guides).toBeUndefined()
  })

  it('le sommet reste prioritaire sur l’alignement', () => {
    const result = snapPoint(
      { x: 1010, y: 5010 },
      { ...ALIGN, vertices: [{ x: 1000, y: 5000 }] },
    )
    expect(result.kind).toBe('vertex')
    expect(result.guides).toBeUndefined()
  })

  it('choisit la cible la plus proche en cas d’égalité de coordonnée', () => {
    const result = snapPoint(
      { x: 1000, y: 3000 },
      { ...ALIGN, alignTargets: [{ x: 1000, y: 9000 }, { x: 1000, y: 3500 }] },
    )
    expect(result.guides).toEqual([{ orientation: 'vertical', position: 1000 }])
  })

  it('collectAlignTargets : points des murs, pièces et cotes, sans masqués ni exclus', () => {
    const elements: CanvasElement[] = [
      wall('w', [0, 0, 1000, 0]),
      room('r', [0, 0, 100, 0, 100, 100]),
      dimension('d', [5, 5, 6, 6]),
      { ...wall('hidden', [9, 9, 9, 10]), hidden: true },
      wall('skipped', [7, 7, 8, 8]),
    ]
    const targets = collectAlignTargets(elements, new Set(['skipped']))
    expect(targets).toHaveLength(2 + 3 + 2)
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
    expect(result).toEqual({ point: crossing, kind: 'vertex', vertexKind: 'draft' })
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
    expect(collectSnapVertices(elements)).toEqual([{ x: 4000, y: 3000, vertexKind: 'axis-crossing' }])
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
    expect(vertices).toContainEqual({ x: 1000, y: 0, vertexKind: 'wall-axis' }) // sommet de mur
    expect(vertices).toContainEqual({ x: 100, y: 100, vertexKind: 'room' }) // sommet de pièce
    expect(vertices).toContainEqual({ x: 20, y: 20, vertexKind: 'dimension' }) // extrémité de cote
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

describe('aimantation sur les ouvertures (cotes)', () => {
  // Mur de 0 à 4 000 mm sur l'axe y = 0, épaisseur 200 ; porte de 900 mm centrée à 1 000 mm.
  const w = wall('w', [0, 0, 4000, 0])
  const door = createOpeningElement('door', 'Porte', {
    wallId: 'w',
    segmentIndex: 0,
    offset: 1000,
    side: 'left',
  })
  const sized = { ...door, width: 900 }

  it('donne les jambages et le milieu sur l’axe et sur les deux faces', () => {
    const points = collectOpeningSnapPoints([w, sized])
    expect(points).toHaveLength(9)
    const has = (x: number, y: number) =>
      points.some((p) => Math.abs(p.x - x) < 1e-6 && Math.abs(p.y - y) < 1e-6)
    expect(has(550, 100)).toBe(true)
    expect(has(550, -100)).toBe(true)
    expect(has(1450, 0)).toBe(true)
    expect(has(1000, 100)).toBe(true)
  })

  it('ignore une ouverture masquée, sans mur ou dont le mur est masqué', () => {
    expect(collectOpeningSnapPoints([w, { ...sized, hidden: true }])).toEqual([])
    expect(collectOpeningSnapPoints([sized])).toEqual([])
    expect(collectOpeningSnapPoints([{ ...w, hidden: true }, sized])).toEqual([])
  })

  it('aimante le curseur sur un jambage, avant les sommets', () => {
    const openingPoints = collectOpeningSnapPoints([w, sized])
    const result = snapPoint(
      { x: 560, y: 90 },
      { ...NONE, threshold: 30, openingPoints, vertices: [{ x: 580, y: 100 }] },
    )
    expect(result.kind).toBe('opening')
    expect(result.point).toEqual({ x: 550, y: 100 })
  })

  it('n’aimante pas hors de la distance d’accroche', () => {
    const openingPoints = collectOpeningSnapPoints([w, sized])
    const result = snapPoint({ x: 700, y: 400 }, { ...NONE, threshold: 30, openingPoints })
    expect(result.kind).toBe('none')
  })
})

describe('nature des sommets et tri selon l’outil', () => {
  // Mur fermé de 200 mm autour d'une pièce de 3000 × 2000 mm (face intérieure de 0 à 3000).
  const closed = wall('c', [-100, -100, 3100, -100, 3100, 2100, -100, 2100, -100, -100])

  it('un mur fermé distingue son axe, sa face intérieure et sa face extérieure', () => {
    const vertices = collectSnapVertices([closed])
    const at = (x: number, y: number) =>
      vertices.find((v) => Math.abs(v.x - x) < 1e-6 && Math.abs(v.y - y) < 1e-6)?.vertexKind
    expect(at(-100, -100)).toBe('wall-axis')
    expect(at(0, 0)).toBe('wall-face-inner')
    expect(at(-200, -200)).toBe('wall-face-outer')
  })

  it('un mur ouvert a des faces sans intérieur ni extérieur', () => {
    const vertices = collectSnapVertices([wall('o', [0, 0, 1000, 0])])
    expect(vertices.filter((v) => v.vertexKind === 'wall-face')).toHaveLength(4)
  })

  it('outil Pièce : la face intérieure gagne sur l’axe voisin, même un peu plus loin', () => {
    const vertices = collectSnapVertices([closed])
    // Curseur entre l'axe (-100, -100) et la face intérieure (0, 0), plus près de l'axe.
    const raw = { x: -60, y: -60 } // 57 mm de l'axe, 85 mm de la face
    const context = { ...NONE, vertices, threshold: 120 }
    expect(snapPoint(raw, context).vertexKind).toBe('wall-axis') // sans tri : le plus proche
    const sorted = snapPoint(raw, { ...context, preferredVertices: preferredVertexKinds('room') })
    expect(sorted.point).toEqual({ x: 0, y: 0 })
    expect(sorted.vertexKind).toBe('wall-face-inner')
  })

  it('outil Mur : l’axe gagne sur les faces ; une face reste attrapable tout près', () => {
    const vertices = collectSnapVertices([closed])
    const context = {
      ...NONE,
      vertices,
      threshold: 120,
      preferredVertices: preferredVertexKinds('wall'),
    }
    expect(snapPoint({ x: -60, y: -60 }, context).vertexKind).toBe('wall-axis')
    // À 5 mm de la face intérieure et à 136 mm de l'axe : la face est attrapée.
    expect(snapPoint({ x: 3, y: 4 }, context).vertexKind).toBe('wall-face-inner')
  })

  it('les points du tracé en cours sont toujours préférés', () => {
    const result = snapPoint(
      { x: 10, y: 0 },
      { ...NONE, vertices: [{ x: 0, y: 0 }], preferredVertices: preferredVertexKinds('room') },
    )
    expect(result.vertexKind).toBe('draft')
  })
})
