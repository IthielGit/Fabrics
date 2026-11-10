import { describe, expect, it } from 'vitest'
import { createEllipseElement, createLineElement, createRectElement } from '../documents/elements'
import { applyNodeTransform } from './transform'

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
