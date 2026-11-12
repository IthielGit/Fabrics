import { describe, expect, it } from 'vitest'
import type { CanvasElement } from '../../types/document'
import {
  collectBackgroundSegments,
  nearestBackgroundSnap,
  segmentIntersection,
  type BackgroundSegment,
} from './backgroundSnap'
import { snapPoint } from './snapping'

const seg = (ax: number, ay: number, bx: number, by: number): BackgroundSegment => ({
  a: { x: ax, y: ay },
  b: { x: bx, y: by },
})

function line(over: Partial<CanvasElement> & { points: number[] }): CanvasElement {
  return {
    id: 'l',
    name: 'Fond',
    type: 'line',
    x: 0,
    y: 0,
    rotation: 0,
    opacity: 1,
    locked: true,
    hidden: false,
    stroke: '#999',
    strokeWidth: 1,
    arrowEnd: false,
    groupId: 'g1',
    ...over,
  } as CanvasElement
}

describe('collectBackgroundSegments', () => {
  it('ajoute la position de l’élément et ne prend que les fonds visibles', () => {
    const segments = collectBackgroundSegments([
      line({ x: 100, y: 50, points: [0, 0, 1000, 0, 1000, 500] }),
      line({ id: 'cache', hidden: true, points: [0, 0, 5, 5] }),
      line({ id: 'libre', groupId: undefined, points: [0, 0, 5, 5] }),
    ])
    expect(segments).toEqual([seg(100, 50, 1100, 50), seg(1100, 50, 1100, 550)])
  })
})

describe('segmentIntersection', () => {
  it('trouve le croisement de deux traits', () => {
    expect(segmentIntersection(seg(0, 0, 1000, 1000), seg(0, 1000, 1000, 0))).toEqual({ x: 500, y: 500 })
  })
  it('ignore les parallèles et les traits qui ne se touchent pas', () => {
    expect(segmentIntersection(seg(0, 0, 100, 0), seg(0, 10, 100, 10))).toBeNull()
    expect(segmentIntersection(seg(0, 0, 100, 0), seg(200, -50, 200, 50))).toBeNull()
  })
})

describe('nearestBackgroundSnap', () => {
  const walls = [seg(0, 0, 4000, 0), seg(0, 0, 0, 3000)]

  it('attrape une extrémité en priorité', () => {
    expect(nearestBackgroundSnap({ x: 3, y: -4 }, walls, 10)).toEqual({
      point: { x: 0, y: 0 },
      kind: 'endpoint',
    })
  })
  it('attrape le croisement de deux traits qui se coupent', () => {
    const cross = [seg(0, 500, 2000, 500), seg(1000, 0, 1000, 1000)]
    expect(nearestBackgroundSnap({ x: 1004, y: 497 }, cross, 10)).toEqual({
      point: { x: 1000, y: 500 },
      kind: 'intersection',
    })
  })
  it('attrape le milieu d’un trait', () => {
    expect(nearestBackgroundSnap({ x: 2003, y: 4 }, walls, 10)).toEqual({
      point: { x: 2000, y: 0 },
      kind: 'midpoint',
    })
  })
  it('attrape un point du trait, sauf quand la direction est contrainte', () => {
    expect(nearestBackgroundSnap({ x: 1234, y: 6 }, walls, 10)).toEqual({
      point: { x: 1234, y: 0 },
      kind: 'edge',
    })
    expect(nearestBackgroundSnap({ x: 1234, y: 6 }, walls, 10, false)).toBeNull()
  })
  it('ne prend rien au-delà de la distance d’accroche', () => {
    expect(nearestBackgroundSnap({ x: 1234, y: 50 }, walls, 10)).toBeNull()
  })
})

describe('snapPoint avec un fond', () => {
  it('ramène le point sur l’extrémité du fond', () => {
    const result = snapPoint(
      { x: 4003, y: 2 },
      {
        vertices: [],
        background: [seg(0, 0, 4000, 0)],
        gridSize: null,
        threshold: 10,
        from: null,
        constrain: false,
      },
    )
    expect(result).toEqual({
      point: { x: 4000, y: 0 },
      kind: 'vertex',
      vertexKind: 'background-endpoint',
    })
  })
  it('laisse un sommet du plan gagner sur le fond', () => {
    const result = snapPoint(
      { x: 3, y: 2 },
      {
        vertices: [{ x: 5, y: 5, vertexKind: 'wall-axis' }],
        background: [seg(0, 0, 4000, 0)],
        gridSize: null,
        threshold: 10,
        from: null,
        constrain: false,
      },
    )
    expect(result.vertexKind).toBe('wall-axis')
  })
})
