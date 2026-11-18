/** M19 B6 — Toiture et escalier dessinés dans Pascal : présents dans les métrés de leur niveau. */
import { RoofNode, RoofSegmentNode, StairNode, StairSegmentNode } from '@pascal-app/core'
import { describe, expect, it } from 'vitest'
import { computeBuildingMeasurements } from '../../measurements/measurements'
import type { FabricsDocument } from '../../../types/document'
import { fabricsToScene } from '../migrate/fromFabrics'
import type { PlanScene, SceneNodeData } from '../sceneTypes'
import { settleScene } from '../settle'
import { sceneToFabricsView } from './toFabricsView'

function sceneWith(...nodes: { id: string; parentId: string | null; children?: string[] }[]): PlanScene {
  const doc: FabricsDocument = {
    version: 4, unit: 'mm', page: { width: 42000, height: 29700, background: '#ffffff' },
    levels: [
      { id: 'L0', name: 'Rez-de-chaussée', elevation: 0, height: 2700, slabThickness: 200 },
      { id: 'L1', name: 'Étage', elevation: 2700, height: 2700, slabThickness: 200 },
    ],
    elements: [],
  }
  const base = settleScene(fabricsToScene(doc).scene)
  const all: Record<string, SceneNodeData> = { ...base.nodes }
  for (const node of nodes) all[node.id] = node as unknown as SceneNodeData
  for (const node of nodes) {
    const parent = node.parentId ? all[node.parentId] : undefined
    if (parent && !(parent.children ?? []).includes(node.id)) all[parent.id] = { ...parent, children: [...(parent.children ?? []), node.id] }
  }
  return settleScene({ nodes: all, rootNodeIds: base.rootNodeIds })
}

describe('toiture de Pascal dans les métrés', () => {
  const segment = RoofSegmentNode.parse({
    id: 'rseg_toit', roofType: 'gable', width: 8, depth: 6, pitch: 35, overhang: 0.5 / Math.cos((35 * Math.PI) / 180), wallThickness: 0, gableOverhang: 0.5,
  })
  const roof = RoofNode.parse({ id: 'roof_toit', parentId: 'level_L1', name: 'Toit', children: [segment.id] })
  const scene = sceneWith(roof, { ...segment, parentId: roof.id })

  it('deux pans 8000 × 6000, 35°, débord 500 mm → 76,91 m² sur le niveau de la toiture', () => {
    const building = computeBuildingMeasurements(sceneToFabricsView(scene))
    const [rdc, etage] = building.levels
    expect(rdc.measurements.roofs).toEqual([])
    const [m] = etage.measurements.roofs
    expect(m).toMatchObject({ id: 'rseg_toit', name: 'Toit', shape: 'gable', pitch: 35, gableCount: 2, problem: null })
    expect(Math.round(m.realArea / 1e4) / 100).toBe(76.91)
    expect(Math.round(m.projectedArea / 1e4) / 100).toBe(63)
    expect(m.ridgeLength).toBeCloseTo(9000, 3)
    expect(m.overhang).toBeCloseTo(500, 3)
    expect(Math.round(etage.measurements.totals.roofRealArea / 1e4) / 100).toBe(76.91)
  })
})

describe('escalier de Pascal dans les métrés', () => {
  it('escalier droit de 16 marches, 2700 mm, volée de 4000 mm', () => {
    const flight = StairSegmentNode.parse({ id: 'sseg_vol', segmentType: 'stair', width: 0.9, length: 4, height: 2.7, stepCount: 16 })
    const stair = StairNode.parse({ id: 'stair_esc', parentId: 'level_L0', name: 'Escalier', stairType: 'straight', children: [flight.id] })
    const building = computeBuildingMeasurements(sceneToFabricsView(sceneWith(stair, { ...flight, parentId: stair.id })))
    const [m] = building.levels[0].measurements.stairs
    expect(m).toMatchObject({ id: 'stair_esc', shape: 'straight', width: 900, rise: 2700, risers: 16, treads: 15, treadDepth: 250, status: 'ok' })
    expect(m.riserHeight).toBeCloseTo(168.75, 9)
  })

  it('escalier en L : deux volées et un palier tournant', () => {
    const a = StairSegmentNode.parse({ id: 'sseg_a', segmentType: 'stair', width: 1, length: 2, height: 1.35, stepCount: 8 })
    const landing = StairSegmentNode.parse({ id: 'sseg_p', segmentType: 'landing', width: 1, length: 1, height: 0, stepCount: 1, attachmentSide: 'front' })
    const b = StairSegmentNode.parse({ id: 'sseg_b', segmentType: 'stair', width: 1, length: 2, height: 1.35, stepCount: 8, attachmentSide: 'left' })
    const stair = StairNode.parse({ id: 'stair_l', parentId: 'level_L0', stairType: 'straight', children: [a.id, landing.id, b.id] })
    const scene = sceneWith(stair, { ...a, parentId: stair.id }, { ...landing, parentId: stair.id }, { ...b, parentId: stair.id })
    const [m] = computeBuildingMeasurements(sceneToFabricsView(scene)).levels[0].measurements.stairs
    expect(m).toMatchObject({ shape: 'l', risers: 16, treads: 14, rise: 2700, treadDepth: 250 })
  })
})
