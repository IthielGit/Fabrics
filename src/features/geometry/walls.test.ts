import { describe, expect, it } from 'vitest'
import { flattenPoints, polygonArea } from './polygon'
import { segmentIntersection, wallFaceCorners, wallFaceSegments, wallFaces } from './walls'

const near = (a: { x: number; y: number }, x: number, y: number) =>
  Math.abs(a.x - x) < 1e-6 && Math.abs(a.y - y) < 1e-6
const has = (points: { x: number; y: number }[], x: number, y: number) =>
  points.some((p) => near(p, x, y))

describe('wallFaces', () => {
  it('décale un mur droit d’une demi-épaisseur de chaque côté', () => {
    const { left, right } = wallFaces([0, 0, 4000, 0], 200)
    expect(left).toHaveLength(2)
    expect(left.every((p) => near(p, p.x, 100))).toBe(true)
    expect(right.every((p) => near(p, p.x, -100))).toBe(true)
    expect(left[0].x).toBeCloseTo(0)
    expect(left[1].x).toBeCloseTo(4000)
  })

  it('raccorde les faces en onglet à un angle droit', () => {
    // Mur en L : (0,0) → (4000,0) → (4000,3000)
    const { left, right } = wallFaces([0, 0, 4000, 0, 4000, 3000], 200)
    expect(has(left, 3900, 100)).toBe(true) // angle intérieur
    expect(has(right, 4100, -100)).toBe(true) // angle extérieur
  })

  it('traite un axe qui revient à son départ comme fermé : 4 angles intérieurs', () => {
    // Pièce de 4 m × 3 m (axes), murs de 20 cm : l'intérieur mesure 3,80 × 2,80 m
    const axis = [0, 0, 4000, 0, 4000, 3000, 0, 3000, 0, 0]
    const { left } = wallFaces(axis, 200)
    expect(left).toHaveLength(5) // 4 angles + retour au départ
    expect(has(left, 100, 100)).toBe(true)
    expect(has(left, 3900, 100)).toBe(true)
    expect(has(left, 3900, 2900)).toBe(true)
    expect(has(left, 100, 2900)).toBe(true)
    expect(polygonArea(flattenPoints(left.slice(0, 4)))).toBeCloseTo(10_640_000)
  })

  it('ignore les points en double (double-clic)', () => {
    const { left } = wallFaces([0, 0, 1000, 0, 1000, 0], 200)
    expect(left).toHaveLength(2)
  })

  it('ne produit rien pour un mur sans longueur', () => {
    expect(wallFaces([0, 0], 200)).toEqual({ left: [], right: [] })
    expect(wallFaces([5, 5, 5, 5], 200)).toEqual({ left: [], right: [] })
  })

  it('coupe un angle très aigu au lieu de créer une longue pointe', () => {
    const { left } = wallFaces([0, 0, 4000, 0, 0, 100], 200)
    // la pointe d'onglet resterait gigantesque : tous les points restent proches du mur
    expect(left.every((p) => Math.abs(p.x) < 8000 && Math.abs(p.y) < 8000)).toBe(true)
  })
})

describe('segmentIntersection', () => {
  const seg = (ax: number, ay: number, bx: number, by: number) => ({
    a: { x: ax, y: ay },
    b: { x: bx, y: by },
  })

  it('trouve le croisement de deux segments', () => {
    const p = segmentIntersection(seg(0, 0, 10, 10), seg(0, 10, 10, 0))!
    expect(p.x).toBeCloseTo(5)
    expect(p.y).toBeCloseTo(5)
  })

  it('renvoie null pour des segments parallèles', () => {
    expect(segmentIntersection(seg(0, 0, 10, 0), seg(0, 5, 10, 5))).toBeNull()
  })

  it('renvoie null si le croisement est hors des segments', () => {
    expect(segmentIntersection(seg(0, 0, 1, 0), seg(5, -5, 5, 5))).toBeNull()
  })

  it('accepte un croisement exactement à l’extrémité', () => {
    const p = segmentIntersection(seg(0, 0, 10, 0), seg(10, -5, 10, 5))!
    expect(p.x).toBeCloseTo(10)
    expect(p.y).toBeCloseTo(0)
  })
})

describe('wallFaceSegments', () => {
  it('renvoie les segments des deux faces', () => {
    expect(wallFaceSegments({ points: [0, 0, 4000, 0, 4000, 3000], thickness: 200 })).toHaveLength(4)
  })
})

describe('wallFaceCorners', () => {
  it('trouve les angles intérieurs où quatre murs séparés se rejoignent', () => {
    const t = 200
    const walls = [
      { points: [0, 0, 4000, 0], thickness: t },
      { points: [4000, 0, 4000, 3000], thickness: t },
      { points: [4000, 3000, 0, 3000], thickness: t },
      { points: [0, 3000, 0, 0], thickness: t },
    ]
    const corners = wallFaceCorners(walls)
    expect(has(corners, 100, 100)).toBe(true)
    expect(has(corners, 3900, 100)).toBe(true)
    expect(has(corners, 3900, 2900)).toBe(true)
    expect(has(corners, 100, 2900)).toBe(true)
  })

  it('inclut les angles des faces d’un mur seul', () => {
    const corners = wallFaceCorners([{ points: [0, 0, 1000, 0], thickness: 200 }])
    expect(has(corners, 0, 100)).toBe(true)
    expect(has(corners, 1000, -100)).toBe(true)
  })

  it('renvoie une liste vide sans mur', () => {
    expect(wallFaceCorners([])).toEqual([])
  })
})
