/** M19 B6 — Dalles de Pascal dans les métrés : surface moins trémies, épaisseur, volume. */
import { FloorOpeningNode, SlabNode } from '@pascal-app/core'
import { describe, expect, it } from 'vitest'
import type { FabricsDocument } from '../../types/document'
import { fabricsToScene } from './migrate/fromFabrics'
import type { PlanScene, SceneNodeData } from './sceneTypes'
import { settleScene } from './settle'
import { slabMeasures } from './slabMeasures'

function sceneWithSlab(slab: { id: string }): PlanScene {
  const doc: FabricsDocument = {
    version: 4, unit: 'mm', page: { width: 42000, height: 29700, background: '#ffffff' },
    levels: [{ id: 'L0', name: 'Rez-de-chaussée', elevation: 0, height: 2700, slabThickness: 200 }],
    elements: [],
  }
  const base = settleScene(fabricsToScene(doc).scene)
  const level = base.nodes.level_L0
  return settleScene({
    nodes: { ...base.nodes, [slab.id]: slab as unknown as SceneNodeData, level_L0: { ...level, children: [...(level.children ?? []), slab.id] } },
    rootNodeIds: base.rootNodeIds,
  })
}

describe('slabMeasures', () => {
  it('terrasse 6000 × 4000 mm, 160 mm, trémie 1000 × 1000 mm', () => {
    const slab = SlabNode.parse({
      id: 'slab_terrasse', parentId: 'level_L0', name: 'Terrasse', thickness: 0.16, elevation: 0.05,
      polygon: [[0, 0], [6, 0], [6, 4], [0, 4]],
      holes: [[[1, 1], [2, 1], [2, 2], [1, 2]]],
    })
    const [m] = slabMeasures(sceneWithSlab(slab))
    expect(m.levelId).toBe('L0')
    expect(m.area / 1e6).toBeCloseTo(23, 9) // 24 − 1 m²
    expect(m.holesArea / 1e6).toBeCloseTo(1, 9)
    expect(m.perimeter).toBe(20000)
    expect(m.thickness).toBe(160)
    expect(m.elevation).toBe(50)
    expect(m.volume / 1e9).toBeCloseTo(3.68, 9) // 23 × 0,16 m³
  })
  it('M22 : une trémie de Pascal posée sur le plancher est déduite de la dalle, sans double compte', () => {
    const slab = SlabNode.parse({
      id: 'slab_plancher', parentId: 'level_L0', name: 'Plancher', thickness: 0.2, elevation: 0,
      polygon: [[0, 0], [6, 0], [6, 4], [0, 4]],
      holes: [[[1, 1], [2, 1], [2, 2], [1, 2]]],
    })
    // Trémie 2 × 1 m qui recouvre le trou de 1 m² et déborde de la dalle de 0,5 m².
    const opening = FloorOpeningNode.parse({ id: 'floor-opening_t', parentId: 'level_L0', polygon: [[1, 1], [3, 1], [3, 2], [1, 2]] })
    const outside = FloorOpeningNode.parse({ id: 'floor-opening_o', parentId: 'level_L0', polygon: [[5.5, 3], [6.5, 3], [6.5, 4], [5.5, 4]] })
    const scene = sceneWithSlab(slab)
    const level = scene.nodes.level_L0
    const withOpenings: PlanScene = {
      ...scene,
      nodes: {
        ...scene.nodes,
        [opening.id]: opening as unknown as SceneNodeData,
        [outside.id]: outside as unknown as SceneNodeData,
        level_L0: { ...level, children: [...(level.children ?? []), opening.id, outside.id] },
      },
    }
    const [m] = slabMeasures(withOpenings).filter((x) => x.id === 'slab_plancher')
    // 24 − 1 (trou) − 1 (reste de la trémie) − 0,5 (trémie qui déborde) = 21,5 m²
    expect(m.area / 1e6).toBeCloseTo(21.5, 6)
    expect(m.holesArea / 1e6).toBeCloseTo(2.5, 6)
  })
})
