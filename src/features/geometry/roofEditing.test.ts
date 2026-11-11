import { describe, expect, it } from 'vitest'
import { isRoofRectangle } from '../building/roof'
import { createRoofElement } from '../documents/elements'
import { elementBounds } from '../export/bounds'
import { rotateSelectionQuarterTurn } from './rotateSelection'
import { preferredVertexKinds } from './snapping'
import {
  canRemoveVertex,
  getSegmentMidpoints,
  hasAbsolutePoints,
  insertVertexAtMidpoint,
  moveRectangleCorner,
  moveVertex,
  translateElement,
} from './transform'

const RECT = [0, 0, 8000, 0, 8000, 6000, 0, 6000]

describe('toiture : points absolus (règle D6)', () => {
  it('se déplace par ses points, x et y restent à 0', () => {
    const roof = createRoofElement('Toiture 1', RECT)
    expect(hasAbsolutePoints(roof)).toBe(true)
    const moved = translateElement(roof, 100, -50)
    expect(moved).toMatchObject({ x: 0, y: 0, points: [100, -50, 8100, -50, 8100, 5950, 100, 5950] })
  })

  it('l\'emprise d\'export comprend le débord', () => {
    expect(elementBounds(createRoofElement('Toiture 1', RECT))).toEqual({
      x: -500,
      y: -500,
      width: 9000,
      height: 7000,
    })
  })
})

describe('toiture en pente : le contour reste un rectangle', () => {
  it('glisser un coin déplace aussi ses deux voisins, le coin opposé reste fixe', () => {
    const roof = createRoofElement('Toiture 1', RECT)
    const moved = moveVertex(roof, 2, { x: 9000, y: 7000 })
    expect(moved.type === 'roof' && moved.points).toEqual([0, 0, 9000, 0, 9000, 7000, 0, 7000])
  })

  it('un rectangle tourné reste un rectangle de même orientation', () => {
    const c = Math.SQRT1_2
    const turned = [
      [0, 0],
      [4000, 0],
      [4000, 3000],
      [0, 3000],
    ].flatMap(([x, y]) => [x * c - y * c, x * c + y * c])
    const next = moveRectangleCorner(turned, 1, { x: 4000, y: 4000 })
    expect(isRoofRectangle(next)).toBe(true)
    expect(next.slice(6)).toEqual(turned.slice(6)) // le coin opposé (n° 3) n'a pas bougé
  })

  it('on ne peut ni ajouter ni retirer de sommet', () => {
    const roof = createRoofElement('Toiture 1', RECT)
    expect(getSegmentMidpoints(roof)).toEqual([])
    expect(insertVertexAtMidpoint(roof, 0)).toBe(roof)
    expect(canRemoveVertex(roof)).toBe(false)
  })
})

describe('toit plat : contour libre', () => {
  it('un sommet se déplace seul, et on peut en ajouter ou en retirer', () => {
    const roof = createRoofElement('Toiture 1', RECT, 'flat')
    const moved = moveVertex(roof, 2, { x: 9000, y: 7000 })
    expect(moved.type === 'roof' && moved.points).toEqual([0, 0, 8000, 0, 9000, 7000, 0, 6000])
    const more = insertVertexAtMidpoint(roof, 0)
    expect(more.type === 'roof' && more.points.length).toBe(10)
    expect(canRemoveVertex(more)).toBe(true)
    expect(canRemoveVertex(roof)).toBe(true) // 4 sommets, minimum 3
  })
})

describe('Maj + R', () => {
  it('fait tourner le contour d\'un quart de tour autour de son centre', () => {
    const roof = { ...createRoofElement('Toiture 1', RECT), overhang: 0 }
    const [turned] = rotateSelectionQuarterTurn([roof])
    expect(turned.type).toBe('roof')
    if (turned.type !== 'roof') return
    expect(isRoofRectangle(turned.points)).toBe(true)
    const xs = turned.points.filter((_, i) => i % 2 === 0)
    const ys = turned.points.filter((_, i) => i % 2 === 1)
    // 8000 × 6000 devient 6000 × 8000, même centre (4000, 3000)
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(6000)
    expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(8000)
    expect((Math.max(...xs) + Math.min(...xs)) / 2).toBeCloseTo(4000)
  })
})

describe('aimantation (D40)', () => {
  it('l\'outil Toiture attrape d\'abord les faces extérieures des murs', () => {
    const kinds = preferredVertexKinds('roof')
    expect(kinds.has('wall-face-outer')).toBe(true)
    expect(kinds.has('wall-face-inner')).toBe(false)
    expect(kinds.has('wall-axis')).toBe(false)
  })
})
