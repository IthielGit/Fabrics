import { describe, expect, it } from 'vitest'
import type { CanvasElement } from '../../types/document'
import {
  createEllipseElement,
  createLineElement,
  createRectElement,
  createRoomElement,
  createWallElement,
} from '../documents/elements'
import {
  applyNodeTransform,
  canRemoveVertex,
  getSegmentMidpoints,
  getVertices,
  hasAbsolutePoints,
  insertVertexAtMidpoint,
  moveVertex,
  removeVertex,
  translateElement,
} from './transform'

const plan = { rotation: 0, opacity: 1, locked: false, hidden: false, x: 0, y: 0 }

describe('translateElement', () => {
  it('ne déplace jamais une ouverture : sa place vient de son mur', () => {
    const opening = {
      ...createRectElement('R', 0, 0, 1, 1),
      type: 'opening' as const,
      kind: 'door' as const,
      wallId: 'w1',
      segmentIndex: 0,
      offset: 1000,
      width: 900,
      height: 2100,
      sillHeight: 0,
      hinge: 'start' as const,
      side: 'left' as const,
    }
    expect(translateElement(opening, 500, 500)).toBe(opening)
  })

  it('déplace x et y d’un rectangle', () => {
    const rect = createRectElement('R', 10, 20, 100, 50)
    expect(translateElement(rect, 5, -3)).toMatchObject({ x: 15, y: 17, width: 100 })
  })

  it('déplace les points d’un mur sans toucher à sa position (qui reste à 0)', () => {
    const wall = createWallElement('M', [0, 0, 4000, 0], 200, 2500)
    const moved = translateElement(wall, 100, 200)
    expect(moved).toMatchObject({ x: 0, y: 0, points: [100, 200, 4100, 200] })
  })

  it('déplace les points d’une pièce', () => {
    const room = createRoomElement('P', [0, 0, 1000, 0, 1000, 1000])
    expect(translateElement(room, -50, 50)).toMatchObject({
      x: 0,
      y: 0,
      points: [-50, 50, 950, 50, 950, 1050],
    })
  })

  it('déplace les deux extrémités d’une cote', () => {
    const dim: CanvasElement = { ...plan, id: 'd', name: 'd', type: 'dimension', points: [0, 0, 1000, 0], offset: 300 }
    expect(translateElement(dim, 10, 20)).toMatchObject({ points: [10, 20, 1010, 20] })
  })

  it('ne modifie pas l’élément d’origine', () => {
    const wall = createWallElement('M', [0, 0, 4000, 0], 200, 2500)
    translateElement(wall, 100, 100)
    expect(wall.points).toEqual([0, 0, 4000, 0])
  })
})

describe('getVertices / moveVertex', () => {
  it('liste les sommets d’un mur, d’une pièce et d’une cote', () => {
    expect(getVertices(createWallElement('M', [0, 0, 100, 0, 100, 50], 200, 2500))).toHaveLength(3)
    expect(getVertices(createRoomElement('P', [0, 0, 1, 0, 1, 1, 0, 1]))).toHaveLength(4)
    const dim: CanvasElement = { ...plan, id: 'd', name: 'd', type: 'dimension', points: [0, 0, 5, 5], offset: 1 }
    expect(getVertices(dim)).toEqual([
      { x: 0, y: 0 },
      { x: 5, y: 5 },
    ])
  })

  it('ne renvoie aucun sommet pour un rectangle', () => {
    expect(getVertices(createRectElement('R', 0, 0, 1, 1))).toEqual([])
  })

  it('déplace un sommet de mur', () => {
    const wall = createWallElement('M', [0, 0, 4000, 0, 4000, 3000], 200, 2500)
    const moved = moveVertex(wall, 1, { x: 4500, y: -200 })
    expect(moved).toMatchObject({ points: [0, 0, 4500, -200, 4000, 3000] })
  })

  it('déplace un sommet de pièce et modifie sa surface', () => {
    const room = createRoomElement('P', [0, 0, 4000, 0, 4000, 3000, 0, 3000])
    const moved = moveVertex(room, 2, { x: 5000, y: 3000 })
    expect(moved).toMatchObject({ points: [0, 0, 4000, 0, 5000, 3000, 0, 3000] })
  })

  it('déplace une extrémité de cote', () => {
    const dim: CanvasElement = { ...plan, id: 'd', name: 'd', type: 'dimension', points: [0, 0, 1000, 0], offset: 300 }
    expect(moveVertex(dim, 1, { x: 2000, y: 0 })).toMatchObject({ points: [0, 0, 2000, 0] })
  })

  it('ignore un indice invalide et les éléments sans sommets', () => {
    const wall = createWallElement('M', [0, 0, 100, 0], 200, 2500)
    expect(moveVertex(wall, 5, { x: 1, y: 1 })).toBe(wall)
    expect(moveVertex(wall, -1, { x: 1, y: 1 })).toBe(wall)
    const rect = createRectElement('R', 0, 0, 1, 1)
    expect(moveVertex(rect, 0, { x: 1, y: 1 })).toBe(rect)
  })

  it('ne modifie pas l’élément d’origine', () => {
    const wall = createWallElement('M', [0, 0, 100, 0], 200, 2500)
    moveVertex(wall, 0, { x: 9, y: 9 })
    expect(wall.points).toEqual([0, 0, 100, 0])
  })
})

describe('ajout et retrait de sommets', () => {
  it('donne les milieux des côtés d’un mur (sans refermer)', () => {
    const wall = createWallElement('M', [0, 0, 4000, 0, 4000, 3000], 200, 2500)
    expect(getSegmentMidpoints(wall)).toEqual([
      { x: 2000, y: 0 },
      { x: 4000, y: 1500 },
    ])
  })

  it('donne aussi le milieu du côté de fermeture d’une pièce', () => {
    const room = createRoomElement('P', [0, 0, 4000, 0, 4000, 3000, 0, 3000])
    const midpoints = getSegmentMidpoints(room)
    expect(midpoints).toHaveLength(4)
    expect(midpoints[3]).toEqual({ x: 0, y: 1500 })
  })

  it('ne donne aucun milieu pour une cote ou un rectangle', () => {
    const dim: CanvasElement = { ...plan, id: 'd', name: 'd', type: 'dimension', points: [0, 0, 10, 0], offset: 1 }
    expect(getSegmentMidpoints(dim)).toEqual([])
    expect(getSegmentMidpoints(createRectElement('R', 0, 0, 1, 1))).toEqual([])
  })

  it('insère un sommet au milieu d’un côté de mur', () => {
    const wall = createWallElement('M', [0, 0, 4000, 0, 4000, 3000], 200, 2500)
    expect(insertVertexAtMidpoint(wall, 0)).toMatchObject({
      points: [0, 0, 2000, 0, 4000, 0, 4000, 3000],
    })
  })

  it('insère un sommet sur le côté de fermeture d’une pièce', () => {
    const room = createRoomElement('P', [0, 0, 4000, 0, 4000, 3000, 0, 3000])
    expect(insertVertexAtMidpoint(room, 3)).toMatchObject({
      points: [0, 0, 4000, 0, 4000, 3000, 0, 3000, 0, 1500],
    })
  })

  it('ne change pas la surface d’une pièce en insérant un sommet', () => {
    const room = createRoomElement('P', [0, 0, 4000, 0, 4000, 3000, 0, 3000])
    expect(insertVertexAtMidpoint(room, 1)).toMatchObject({ type: 'room' })
    expect(getVertices(insertVertexAtMidpoint(room, 1))).toHaveLength(5)
  })

  it('ignore un côté invalide, une cote et un rectangle', () => {
    const wall = createWallElement('M', [0, 0, 100, 0], 200, 2500)
    expect(insertVertexAtMidpoint(wall, 1)).toBe(wall)
    expect(insertVertexAtMidpoint(wall, -1)).toBe(wall)
    const rect = createRectElement('R', 0, 0, 1, 1)
    expect(insertVertexAtMidpoint(rect, 0)).toBe(rect)
  })

  it('retire un sommet de mur ou de pièce', () => {
    const wall = createWallElement('M', [0, 0, 100, 0, 100, 50], 200, 2500)
    expect(removeVertex(wall, 1)).toMatchObject({ points: [0, 0, 100, 50] })
    const room = createRoomElement('P', [0, 0, 4000, 0, 4000, 3000, 0, 3000])
    expect(removeVertex(room, 0)).toMatchObject({ points: [4000, 0, 4000, 3000, 0, 3000] })
  })

  it('refuse de descendre sous 2 sommets (mur) ou 3 sommets (pièce)', () => {
    const wall = createWallElement('M', [0, 0, 100, 0], 200, 2500)
    expect(canRemoveVertex(wall)).toBe(false)
    expect(removeVertex(wall, 0)).toBe(wall)
    const room = createRoomElement('P', [0, 0, 1000, 0, 1000, 1000])
    expect(canRemoveVertex(room)).toBe(false)
    expect(removeVertex(room, 0)).toBe(room)
  })

  it('ne retire pas de sommet d’une cote et ignore un indice invalide', () => {
    const dim: CanvasElement = { ...plan, id: 'd', name: 'd', type: 'dimension', points: [0, 0, 10, 0], offset: 1 }
    expect(removeVertex(dim, 0)).toBe(dim)
    const wall = createWallElement('M', [0, 0, 100, 0, 100, 50], 200, 2500)
    expect(removeVertex(wall, 7)).toBe(wall)
  })

  it('ne modifie pas l’élément d’origine', () => {
    const wall = createWallElement('M', [0, 0, 100, 0, 100, 50], 200, 2500)
    insertVertexAtMidpoint(wall, 0)
    removeVertex(wall, 1)
    expect(wall.points).toEqual([0, 0, 100, 0, 100, 50])
  })
})

describe('hasAbsolutePoints', () => {
  it('est vrai pour les éléments de plan seulement', () => {
    expect(hasAbsolutePoints(createWallElement('M', [0, 0, 1, 1], 1, 1))).toBe(true)
    expect(hasAbsolutePoints(createRoomElement('P', [0, 0, 1, 1, 2, 2]))).toBe(true)
    expect(hasAbsolutePoints(createRectElement('R', 0, 0, 1, 1))).toBe(false)
    expect(hasAbsolutePoints(createLineElement('L', 0, 0, 1, 1, 1))).toBe(false)
  })
})

describe('applyNodeTransform', () => {
  it('déplace un rectangle sans changer sa taille', () => {
    const rect = createRectElement('R', 0, 0, 100, 50)
    const moved = applyNodeTransform(rect, { x: 30, y: 40, rotation: 0, scaleX: 1, scaleY: 1 })
    expect(moved).toMatchObject({ x: 30, y: 40, width: 100, height: 50, rotation: 0 })
  })

  it('applique l’échelle aux dimensions d’un rectangle', () => {
    const rect = createRectElement('R', 0, 0, 100, 50)
    const resized = applyNodeTransform(rect, { x: 0, y: 0, rotation: 0, scaleX: 2, scaleY: 3 })
    expect(resized).toMatchObject({ width: 200, height: 150 })
  })

  it('applique l’échelle aux rayons d’une ellipse', () => {
    const ellipse = createEllipseElement('E', 0, 0, 100, 60) // rayons 50 et 30
    const resized = applyNodeTransform(ellipse, { x: 50, y: 30, rotation: 0, scaleX: 2, scaleY: 0.5 })
    expect(resized).toMatchObject({ radiusX: 100, radiusY: 15 })
  })

  it('conserve la rotation', () => {
    const rect = createRectElement('R', 0, 0, 10, 10)
    const rotated = applyNodeTransform(rect, { x: 0, y: 0, rotation: 45, scaleX: 1, scaleY: 1 })
    expect(rotated.rotation).toBe(45)
  })

  it('ignore le signe de l’échelle (retournement)', () => {
    const rect = createRectElement('R', 0, 0, 100, 50)
    const flipped = applyNodeTransform(rect, { x: 0, y: 0, rotation: 0, scaleX: -2, scaleY: 1 })
    expect(flipped).toMatchObject({ width: 200, height: 50 })
  })

  it('étire les points d’une ligne', () => {
    const line = createLineElement('L', 10, 20, 100, 50, 4)
    const resized = applyNodeTransform(line, { x: 10, y: 20, rotation: 0, scaleX: 2, scaleY: 3 })
    expect(resized).toMatchObject({ x: 10, y: 20, points: [0, 0, 200, 150] })
  })

  it('déplace une ligne sans toucher à ses points', () => {
    const line = createLineElement('L', 0, 0, 100, 50, 4)
    const moved = applyNodeTransform(line, { x: 5, y: 6, rotation: 30, scaleX: 1, scaleY: 1 })
    expect(moved).toMatchObject({ x: 5, y: 6, rotation: 30, points: [0, 0, 100, 50] })
  })

  it('ne modifie pas l’élément d’origine', () => {
    const rect = createRectElement('R', 0, 0, 100, 50)
    applyNodeTransform(rect, { x: 9, y: 9, rotation: 9, scaleX: 9, scaleY: 9 })
    expect(rect).toMatchObject({ x: 0, y: 0, width: 100, height: 50, rotation: 0 })
  })
})
