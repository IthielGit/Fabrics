import { describe, expect, it } from 'vitest'
import type { CanvasElement } from '../../types/document'
import {
  createEllipseElement,
  createLineElement,
  createRectElement,
  createRoomElement,
  createWallElement,
} from '../documents/elements'
import { applyNodeTransform, hasAbsolutePoints, translateElement } from './transform'

const plan = { rotation: 0, opacity: 1, locked: false, hidden: false, x: 0, y: 0 }

describe('translateElement', () => {
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
