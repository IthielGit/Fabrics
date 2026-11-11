import { describe, expect, it } from 'vitest'
import {
  ROOF_COVERINGS,
  WALL_MATERIALS,
  isRoofCovering,
  isWallMaterial,
  roofFacadeTexture,
  wallFacadeTexture,
  type FacadeTexture,
} from './materials'
import { clipSegmentToPolygon, hatchSegments, textureSegments, type Segment } from './views/patterns'

type Pt = [number, number]
const rect = (x0: number, y0: number, x1: number, y1: number): Pt[] => [
  [x0, y0],
  [x1, y0],
  [x1, y1],
  [x0, y1],
]
const WALL = rect(0, 0, 4000, 200) // mur de 4000 mm, 200 mm d'épaisseur, vu en plan
const SQUARE = rect(0, 0, 1000, 1000)
const L_SHAPE: Pt[] = [
  [0, 0],
  [2000, 0],
  [2000, 500],
  [500, 500],
  [500, 2000],
  [0, 2000],
]

function insideOrOn([x, y]: Pt, polygon: Pt[]): boolean {
  const xs = polygon.map((p) => p[0])
  const ys = polygon.map((p) => p[1])
  if (x < Math.min(...xs) - 1e-6 || x > Math.max(...xs) + 1e-6) return false
  if (y < Math.min(...ys) - 1e-6 || y > Math.max(...ys) + 1e-6) return false
  // Polygone en L : le carré évidé (x > 500 et y > 500) est dehors.
  if (polygon === L_SHAPE) return !(x > 500 + 1e-6 && y > 500 + 1e-6)
  return true
}

const angle = ([x1, y1, x2, y2]: Segment) => {
  const a = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI
  return Math.round(((a % 180) + 180) % 180)
}
const length = ([x1, y1, x2, y2]: Segment) => Math.hypot(x2 - x1, y2 - y1)

describe('catalogue des matériaux et couvertures', () => {
  it('six matériaux de mur, cinq couvertures', () => {
    expect(WALL_MATERIALS).toEqual(['concrete', 'masonry', 'brick', 'wood', 'insulation', 'plasterboard'])
    expect(ROOF_COVERINGS).toEqual(['tiles', 'slates', 'zinc', 'steel', 'flat'])
    expect(isWallMaterial('brick')).toBe(true)
    expect(isWallMaterial('tiles')).toBe(false)
    expect(isRoofCovering('zinc')).toBe(true)
    expect(isRoofCovering(undefined)).toBe(false)
  })

  it('la texture de façade se déduit du matériau (D46)', () => {
    expect(wallFacadeTexture('brick')).toBe('brick')
    expect(wallFacadeTexture('wood')).toBe('cladding')
    expect(wallFacadeTexture('concrete')).toBe('render')
    expect(wallFacadeTexture('masonry')).toBe('render')
    expect(wallFacadeTexture('insulation')).toBeNull()
    expect(wallFacadeTexture('plasterboard')).toBeNull()
    expect(wallFacadeTexture(undefined)).toBeNull()
  })

  it('les versants prennent la texture de leur couverture ; toiture plate et sans couverture : aucune', () => {
    expect(roofFacadeTexture('tiles')).toBe('tiles')
    expect(roofFacadeTexture('steel')).toBe('steel')
    expect(roofFacadeTexture('flat')).toBeNull()
    expect(roofFacadeTexture(undefined)).toBeNull()
  })
})

describe('découpe d’un trait dans un polygone', () => {
  it('un trait qui traverse un carré est coupé à ses bords', () => {
    expect(clipSegmentToPolygon([-500, 300], [1500, 300], SQUARE)).toEqual([[0, 300, 1000, 300]])
  })

  it('un trait qui traverse le creux d’un L donne deux morceaux', () => {
    const parts = clipSegmentToPolygon([-100, 1000], [3000, 1000], L_SHAPE).map((s) => s.map(Math.round))
    expect(parts).toEqual([[0, 1000, 500, 1000]])
    const diagonal = clipSegmentToPolygon([-100, 250], [3000, 250], L_SHAPE)
    expect(diagonal).toHaveLength(1)
    const across = clipSegmentToPolygon([250, -100], [250, 3000], L_SHAPE)
    expect(across.map((s) => s.map(Math.round))).toEqual([[250, 0, 250, 2000]])
  })

  it('un trait dehors ne donne rien', () => {
    expect(clipSegmentToPolygon([2000, 2000], [3000, 3000], SQUARE)).toEqual([])
  })
})

describe('hachures des matières coupées', () => {
  const unit = 100

  it('chaque hachure reste dans son polygone, y compris un L', () => {
    for (const material of WALL_MATERIALS) {
      for (const polygon of [WALL, SQUARE, L_SHAPE]) {
        const segments = hatchSegments(polygon, material, unit)
        expect(segments.length, `${material}`).toBeGreaterThan(0)
        for (const [x1, y1, x2, y2] of segments) {
          expect(insideOrOn([x1, y1], polygon), `${material} ${x1},${y1}`).toBe(true)
          expect(insideOrOn([x2, y2], polygon), `${material} ${x2},${y2}`).toBe(true)
        }
      }
    }
  })

  it('les six hachures sont différentes deux à deux', () => {
    const signatures = WALL_MATERIALS.map((m) => JSON.stringify(hatchSegments(SQUARE, m, unit).map((s) => s.map(Math.round))))
    expect(new Set(signatures).size).toBe(6)
  })

  it('béton, maçonnerie et brique : traits à 45°, béton deux fois plus serré, brique doublée', () => {
    const concrete = hatchSegments(SQUARE, 'concrete', unit)
    const masonry = hatchSegments(SQUARE, 'masonry', unit)
    const brick = hatchSegments(SQUARE, 'brick', unit)
    for (const s of [...concrete, ...masonry, ...brick]) expect(angle(s)).toBe(135)
    expect(concrete.length / masonry.length).toBeCloseTo(2, 0)
    expect(brick.length / masonry.length).toBeCloseTo(2, 0)
  })

  it('l’écartement suit l’unité : deux fois plus grande, deux fois moins de traits', () => {
    const fine = hatchSegments(SQUARE, 'masonry', 50).length
    const coarse = hatchSegments(SQUARE, 'masonry', 100).length
    expect(fine / coarse).toBeCloseTo(2, 0)
  })

  it('bois : le fil suit le plus long côté (mur en plan horizontal, coupe verticale)', () => {
    for (const s of hatchSegments(WALL, 'wood', unit)) expect(angle(s)).toBe(0)
    for (const s of hatchSegments(rect(0, 0, 200, 3000), 'wood', unit)) expect(angle(s)).toBe(90)
  })

  it('isolant : zigzag d’une face à l’autre de l’épaisseur', () => {
    const segments = hatchSegments(WALL, 'insulation', unit)
    expect(segments.length).toBeGreaterThan(20)
    const full = segments.filter((s) => Math.round(Math.abs(s[3] - s[1])) === 200)
    expect(full.length).toBeGreaterThan(segments.length - 3)
  })

  it('plaque de plâtre : pointillé de traits très courts', () => {
    for (const s of hatchSegments(WALL, 'plasterboard', unit)) expect(length(s)).toBeLessThanOrEqual(8 + 1e-6)
  })

  it('deux morceaux voisins d’un même mur se raccordent (grille commune)', () => {
    const left = hatchSegments(rect(0, 0, 1000, 200), 'masonry', unit)
    const right = hatchSegments(rect(1000, 0, 2000, 200), 'masonry', unit)
    const onSeam = (segments: Segment[]) =>
      segments
        .flatMap(([x1, y1, x2, y2]) => [
          [x1, y1],
          [x2, y2],
        ])
        .filter(([x]) => Math.abs(x - 1000) < 1e-6)
        .map(([, y]) => Math.round(y))
        .sort((a, b) => a - b)
    expect(onSeam(left)).toEqual(onSeam(right))
    expect(onSeam(left).length).toBeGreaterThan(0)
  })

  it('polygone vide ou unité nulle : aucun trait', () => {
    expect(hatchSegments([], 'concrete', unit)).toEqual([])
    expect(hatchSegments(SQUARE, 'concrete', 0)).toEqual([])
  })
})

describe('textures des façades', () => {
  const unit = 100
  const FACADE = rect(0, 0, 3000, 2000)
  const TEXTURES: FacadeTexture[] = ['render', 'brick', 'cladding', 'tiles', 'slates', 'zinc', 'steel']

  it('chaque texture reste dans sa face et les sept sont différentes', () => {
    const signatures = new Set<string>()
    for (const texture of TEXTURES) {
      const segments = textureSegments(FACADE, texture, unit)
      expect(segments.length, texture).toBeGreaterThan(0)
      for (const [x1, y1, x2, y2] of segments) {
        expect(insideOrOn([x1, y1], FACADE)).toBe(true)
        expect(insideOrOn([x2, y2], FACADE)).toBe(true)
      }
      signatures.add(JSON.stringify(segments.map((s) => s.map(Math.round))))
    }
    expect(signatures.size).toBe(TEXTURES.length)
  })

  it('bardage : lames horizontales ; zinc et bac acier : traits verticaux', () => {
    for (const s of textureSegments(FACADE, 'cladding', unit)) expect(angle(s)).toBe(0)
    for (const s of textureSegments(FACADE, 'zinc', unit)) expect(angle(s)).toBe(90)
    for (const s of textureSegments(FACADE, 'steel', unit)) expect(angle(s)).toBe(90)
  })

  it('brique : rangs horizontaux et joints verticaux décalés d’un rang à l’autre', () => {
    const segments = textureSegments(FACADE, 'brick', unit)
    const joints = segments.filter((s) => angle(s) === 90)
    expect(segments.some((s) => angle(s) === 0)).toBe(true)
    expect(joints.length).toBeGreaterThan(0)
    const rowA = joints.filter((s) => Math.min(s[1], s[3]) === 0).map((s) => s[0])
    const rowB = joints.filter((s) => Math.round(Math.min(s[1], s[3])) === 50).map((s) => s[0])
    expect(rowA.length).toBeGreaterThan(0)
    expect(rowB.length).toBeGreaterThan(0)
    expect(rowA.some((x) => rowB.includes(x))).toBe(false)
  })

  it('enduit : points épars, moins nombreux que les points du plâtre', () => {
    const render = textureSegments(FACADE, 'render', unit)
    for (const s of render) expect(length(s)).toBeLessThanOrEqual(10 + 1e-6)
    expect(render.length).toBeLessThan(hatchSegments(FACADE, 'plasterboard', unit).length)
  })
})
