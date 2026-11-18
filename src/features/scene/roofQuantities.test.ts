/**
 * M19 B6 — Quantités des toitures de Pascal : mêmes valeurs que Fabrics pour ses quatre formes, même
 * forme que Pascal pour toutes (hauteurs comparées point par point), calcul à la main du comble brisé.
 */
import { getActiveRoofHeight, getRoofSegmentSurfaceY, RoofSegmentNode } from '@pascal-app/core'
import { describe, expect, it } from 'vitest'
import { computeRoof } from '../building/roof'
import { type PascalRoofKind, type RoofSegmentSpec, roofQuantities, roofSurfaceHeight } from './roofQuantities'

const RATIOS = {
  gambrelLowerWidthRatio: 0.5,
  gambrelLowerHeightRatio: 0.6,
  mansardSteepWidthRatio: 0.15,
  mansardSteepHeightRatio: 0.7,
  dutchHipWidthRatio: 0.25,
  dutchHipHeightRatio: 0.5,
  dutchWaistLengthRatio: 0.98,
  dutchGabletRake: 0.48,
}

const spec = (kind: PascalRoofKind, width: number, depth: number, pitch: number, reach = 0): RoofSegmentSpec => ({
  kind, width, depth, pitch, reachX: reach, reachZ: reach, ...RATIOS,
})

describe('mêmes quantités que Fabrics (plat, un pan, deux pans, croupe)', () => {
  // Rectangle 8000 × 6000 mm, faîtage parallèle au grand côté (ridgeEdge 0), 35°, débord 500 mm.
  const points = [0, 0, 8000, 0, 8000, 6000, 0, 6000]
  it.each(['flat', 'shed', 'gable', 'hip'] as const)('%s', (shape) => {
    const fabrics = computeRoof({ points, shape, pitch: 35, overhang: 500, ridgeEdge: 0 }, 0)
    if (!('geometry' in fabrics) || !fabrics.geometry) throw new Error('toiture Fabrics invalide')
    const g = fabrics.geometry
    const q = roofQuantities(spec(shape, 8, 6, 35, 0.5))
    expect(q.projectedArea * 1e6).toBeCloseTo(g.projectedArea, 0)
    expect(q.realArea * 1e6).toBeCloseTo(g.realArea, 0)
    expect(q.ridgeLength * 1000).toBeCloseTo(g.ridgeLength, 3)
    expect(q.eaveLength * 1000).toBeCloseTo(g.eaveLength, 3)
    expect(q.hipLength * 1000).toBeCloseTo(g.hipLength, 3)
    expect(q.gableCount).toBe(g.gableCount)
  })

  it('référence de la liste de non-régression : deux pans 8000 × 6000, 35°, débord 500 → 76,91 m²', () => {
    expect(Math.round(roofQuantities(spec('gable', 8, 6, 35, 0.5)).realArea * 100) / 100).toBe(76.91)
  })
})

describe('même forme que Pascal', () => {
  const node = (kind: PascalRoofKind, width = 8, depth = 6, pitch = 40) =>
    RoofSegmentNode.parse({ roofType: kind, width, depth, pitch, overhang: 0, wallThickness: 0 })

  it.each(['shed', 'gable', 'hip', 'gambrel', 'mansard'] as const)('%s : hauteurs identiques point par point', (kind) => {
    const n = node(kind)
    const s = spec(kind, 8, 6, 40)
    const ref = [0.37, -1.1] as const
    for (let x = -3.9; x <= 3.9; x += 0.6) {
      for (let z = -2.9; z <= 2.9; z += 0.45) {
        const pascal = getRoofSegmentSurfaceY(n, x, z) - getRoofSegmentSurfaceY(n, ref[0], ref[1])
        const ours = roofSurfaceHeight(s, x, z) - roofSurfaceHeight(s, ref[0], ref[1])
        expect(ours, `${kind} (${x.toFixed(2)}, ${z.toFixed(2)})`).toBeCloseTo(pascal, 6)
      }
    }
  })

  it.each(['gable', 'hip', 'gambrel', 'mansard', 'dutch', 'conical', 'barrel', 'shed'] as const)('%s : hauteur du faîtage', (kind) => {
    expect(roofQuantities(spec(kind, 8, 6, 40)).ridgeHeight).toBeCloseTo(getActiveRoofHeight(node(kind)), 6)
  })
})

describe('calculs à la main', () => {
  it('comble brisé 8000 × 6000, 60°, rapports 0,5 / 0,6 : 84,66 m²', () => {
    // Brisis : course 1,5 m, pente 60° → longueur 3,000 m ; terrasson : course 1,5 m, hauteur
    // 4,330 − 2,598 = 1,732 m → longueur 2,291 m ; 2 × 8 × (3,000 + 2,291) = 84,66 m².
    const q = roofQuantities(spec('gambrel', 8, 6, 60))
    expect(Math.round(q.realArea * 100) / 100).toBe(84.66)
    expect(q.projectedArea).toBeCloseTo(48, 9)
    expect(q.ridgeLength).toBeCloseTo(8, 9)
    expect(q.eaveLength).toBeCloseTo(16, 9)
  })

  it('croupe équilatérale : surface réelle = surface au sol ÷ cos α, quel que soit le débord', () => {
    const q = roofQuantities({ ...spec('hip', 10, 6, 30), reachX: 0.8, reachZ: 0.4 })
    expect(q.realArea).toBeCloseTo(q.projectedArea / Math.cos(Math.PI / 6), 9)
  })

  it('cône de rayon 4 m à 45° : π r² √2', () => {
    const q = roofQuantities(spec('conical', 8, 8, 45))
    expect(q.realArea).toBeCloseTo(Math.PI * 16 * Math.SQRT2, 9)
  })

  it('voûte de portée 6 m et flèche 1,5 m sur 8 m : arc × longueur', () => {
    const q = roofQuantities({ ...spec('barrel', 8, 6, 0), barrelRise: 1.5 })
    // Rayon (9 + 2,25) / 3 = 3,75 m ; demi-angle asin(3 / 3,75) ; arc = 2 × 3,75 × 0,9273 = 6,9549 m.
    expect(q.realArea).toBeCloseTo(8 * 2 * 3.75 * Math.asin(0.8), 9)
  })
})
