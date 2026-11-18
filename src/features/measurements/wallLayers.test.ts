/**
 * M19 B3 — Quantités par couche de mur, sans double comptage (critère G2) : un mur de 200 mm composé
 * de 20 + 160 + 20 mm dans Pascal (enduit, maçonnerie, enduit), lu par la vue Fabrics.
 */
import { WallNode } from '@pascal-app/core'
import { describe, expect, it } from 'vitest'
import type { CanvasElement, FabricsDocument } from '../../types/document'
import { fabricsToScene } from '../scene/migrate/fromFabrics'
import { rebuildScene } from '../scene/sceneBinding'
import type { PlanScene, SceneNodeData } from '../scene/sceneTypes'
import { settleScene } from '../scene/settle'
import { sceneToFabricsView } from '../scene/view/toFabricsView'
import { computeBuildingMeasurements } from './measurements'
import { layerTotals, wallLayerMeasures } from './wallLayers'

const ASSEMBLY = {
  layers: [
    { id: 'ext', role: 'finish', material: 'stucco', thickness: 0.02 },
    { id: 'core', role: 'structure', material: 'cmu', thickness: 0.16, core: true },
    { id: 'int', role: 'finish', material: 'plaster', thickness: 0.02 },
  ],
}

const BASE = { rotation: 0, opacity: 1, locked: false, hidden: false, x: 0, y: 0, levelId: 'L0' }

/** Mur de 5000 × 2500 mm, 200 mm, avec une fenêtre de 1000 × 1000 mm. */
function plan(): FabricsDocument {
  const elements: CanvasElement[] = [
    { ...BASE, id: 'M', type: 'wall', name: 'M', points: [0, 0, 5000, 0], thickness: 200, height: 2500, fill: '#475569' },
    {
      ...BASE, id: 'F', type: 'opening', name: 'F1', kind: 'window', wallId: 'M', segmentIndex: 0, offset: 2500,
      width: 1000, height: 1000, sillHeight: 1000, hinge: 'start', side: 'left',
    },
  ]
  return {
    version: 4, unit: 'mm', page: { width: 42000, height: 29700, background: '#ffffff' },
    levels: [{ id: 'L0', name: 'Rez-de-chaussée', elevation: 0, height: 2500, slabThickness: 200 }],
    elements,
  }
}

/** Le plan, puis la composition donnée au mur dans Pascal (panneau du mur, section Composition). */
function composed(): PlanScene {
  const scene = settleScene(fabricsToScene(plan()).scene)
  const wall = scene.nodes.wall_M__0
  const withAssembly = WallNode.parse({ ...wall, assembly: ASSEMBLY, thickness: 0.2 }) as unknown as SceneNodeData
  return settleScene({ nodes: { ...scene.nodes, [wall.id]: withAssembly }, rootNodeIds: scene.rootNodeIds })
}

describe('wallLayerMeasures', () => {
  it('surface nette par couche, volume au prorata de l’épaisseur', () => {
    const layers = wallLayerMeasures(
      [
        { id: 'a', role: 'finish', thickness: 20 },
        { id: 'b', role: 'structure', thickness: 160 },
        { id: 'c', role: 'finish', thickness: 20 },
      ],
      { netArea: 10_000_000, volume: 2_000_000_000 },
    )
    expect(layers.map((l) => l.area)).toEqual([10_000_000, 10_000_000, 10_000_000])
    expect(layers.map((l) => l.volume)).toEqual([200_000_000, 1_600_000_000, 200_000_000])
  })

  it('couche d’épaisseur nulle : ni surface ni volume ; aucune couche : rien', () => {
    const [film] = wallLayerMeasures([{ id: 'f', role: 'membrane', thickness: 0 }, { id: 'b', role: 'structure', thickness: 200 }], { netArea: 1, volume: 1 })
    expect(film).toMatchObject({ area: 0, volume: 0 })
    expect(wallLayerMeasures(undefined, { netArea: 1, volume: 1 })).toEqual([])
  })
})

describe('B3 : mur de 200 mm composé de 20 + 160 + 20 mm dans Pascal', () => {
  const m = computeBuildingMeasurements(sceneToFabricsView(composed())).levels[0].measurements
  const wall = m.walls.find((w) => w.id === 'M')!

  it('la vue Fabrics lit les couches en mm', () => {
    const el = sceneToFabricsView(composed()).elements.find((e) => e.id === 'M')
    expect(el?.type === 'wall' && el.layers?.map((l) => l.thickness)).toEqual([20, 160, 20])
  })

  it('critère G2 : quantités par couche, sans double comptage', () => {
    const net = 5000 * 2500 - 1000 * 1000
    expect(wall.netArea).toBe(net)
    expect(wall.layers?.map((l) => [l.role, l.material, l.thickness, l.area])).toEqual([
      ['finish', 'stucco', 20, net],
      ['structure', 'cmu', 160, net],
      ['finish', 'plaster', 20, net],
    ])
    // Volumes : 20 / 160 / 20 mm de la surface nette, et leur somme = volume du mur.
    expect(wall.layers?.map((l) => Math.round(l.volume))).toEqual([20 * net, 160 * net, 20 * net])
    expect(wall.layers!.reduce((sum, l) => sum + l.volume, 0)).toBeCloseTo(wall.volume, 3)
  })

  it('totaux par couche identique (rôle, matériau, épaisseur)', () => {
    const totals = layerTotals(m.walls)
    expect(totals).toHaveLength(3)
    expect(totals.reduce((sum, t) => sum + t.volume, 0)).toBeCloseTo(wall.volume, 3)
  })

  it('la composition reste dans la scène quand Fabrics réécrit le plan', () => {
    const scene = composed()
    const view = sceneToFabricsView(scene)
    const rebuilt = rebuildScene(scene, view, { ...view, page: { ...view.page, background: '#fafafa' } })
    expect((rebuilt.nodes.wall_M__0.assembly as typeof ASSEMBLY).layers.map((l) => l.thickness)).toEqual([0.02, 0.16, 0.02])
    expect(rebuilt.nodes.wall_M__0.metadata.fabrics).toBeDefined()
  })
})
