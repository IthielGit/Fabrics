/**
 * M19 B4 — Terrain et implantation lus dans la scène Pascal. HOUSE-01 : emprise extérieure
 * 8000 × 10000 mm (murs d'enveloppe de 200 mm, axe de 100 à 7900 / 9900 mm).
 */
import { describe, expect, it } from 'vitest'
import type { CanvasElement, FabricsDocument } from '../../types/document'
import { fabricsToScene } from './migrate/fromFabrics'
import { BUILDING_ID, SITE_ID, type PlanScene } from './sceneTypes'
import { settleScene } from './settle'
import { siteMeasures } from './siteMeasures'

const BASE = { rotation: 0, opacity: 1, locked: false, hidden: false, x: 0, y: 0 }

function house(): FabricsDocument {
  const elements: CanvasElement[] = [
    {
      ...BASE, id: 'ENV', levelId: 'L0', type: 'wall', name: 'ENV', thickness: 200, height: 3000, fill: '#475569',
      points: [100, 100, 7900, 100, 7900, 9900, 100, 9900, 100, 100],
    },
    { ...BASE, id: 'C1', levelId: 'L0', type: 'wall', name: 'C1', points: [200, 5000, 7800, 5000], thickness: 100, height: 3000, fill: '#475569' },
  ]
  return {
    version: 4, unit: 'mm', page: { width: 42000, height: 29700, background: '#ffffff' },
    levels: [
      { id: 'L0', name: 'Rez-de-chaussée', elevation: 0, height: 3000, slabThickness: 200 },
      { id: 'L1', name: 'Étage', elevation: 3000, height: 2800, slabThickness: 200 },
    ],
    elements,
  }
}

/** La parcelle (m) et la position du bâtiment réglées dans Pascal (Scène → Site, déplacer le bâtiment). */
function placed(parcel: [number, number][] | null, position: [number, number, number] = [0, 0, 0]): PlanScene {
  const scene = settleScene(fabricsToScene(house()).scene)
  const nodes = { ...scene.nodes }
  if (parcel) nodes[SITE_ID] = { ...nodes[SITE_ID], polygon: { type: 'polygon', points: parcel } }
  nodes[BUILDING_ID] = { ...nodes[BUILDING_ID], position }
  return settleScene({ nodes, rootNodeIds: scene.rootNodeIds })
}

const PARCEL: [number, number][] = [[-6, -10], [14, -10], [14, 20], [-6, 20]] // 20 × 30 m

describe('B4 : terrain et implantation', () => {
  it('parcelle : surface et périmètre de la limite de propriété', () => {
    const m = siteMeasures(placed(PARCEL))
    expect(m.parcelDefined).toBe(true)
    expect(m.parcelArea / 1e6).toBeCloseTo(600, 6)
    expect(m.parcelPerimeter).toBe(100_000)
  })

  it('emprise au sol = contour extérieur des murs du rez-de-chaussée (8000 × 10000 mm)', () => {
    const m = siteMeasures(placed(PARCEL))
    expect(m.footprintArea / 1e6).toBeCloseTo(80, 3)
    expect(m.coverageRatio).toBeCloseTo(80 / 600, 4)
  })

  it('implantation : dans la parcelle, recul minimal à la limite', () => {
    // Bâtiment de 0 à 8000 / 10000 mm ; limite à x = −6000 et y = −10000 → recul minimal 6000 mm (ouest)
    // et 6000 mm à l'est (14000 − 8000).
    const m = siteMeasures(placed(PARCEL))
    expect(m.insideParcel).toBe(true)
    expect(m.minSetback).toBe(6000)
  })

  it('bâtiment déplacé de 5000 mm vers l’est : recul 1000 mm à l’est, toujours dans la parcelle', () => {
    const m = siteMeasures(placed(PARCEL, [5, 0, 0]))
    expect(m.minSetback).toBe(1000)
    expect(m.insideParcel).toBe(true)
    // L'emprise ne dépend pas de la position.
    expect(m.footprintArea / 1e6).toBeCloseTo(80, 3)
  })

  it('bâtiment qui dépasse la limite : signalé hors de la parcelle', () => {
    expect(siteMeasures(placed(PARCEL, [8, 0, 0])).insideParcel).toBe(false)
  })

  it('altitudes des niveaux en mm', () => {
    expect(siteMeasures(placed(PARCEL)).levels).toEqual([
      { id: 'L0', name: 'Rez-de-chaussée', elevation: 0, height: 3000 },
      { id: 'L1', name: 'Étage', elevation: 3000, height: 2800 },
    ])
  })

  it('sans limite réglée (carré par défaut de Pascal) : pas de parcelle ni de coefficient', () => {
    const m = siteMeasures(placed(null))
    expect(m.parcelDefined).toBe(false)
    expect(m.coverageRatio).toBeNull()
    expect(m.insideParcel).toBeNull()
    expect(m.footprintArea / 1e6).toBeCloseTo(80, 3)
  })
})
