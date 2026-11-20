/**
 * M19 B6 — Toitures et escaliers des plans Fabrics convertis en nœuds de Pascal : même place en 3D
 * que sur le plan, aller-retour exact, et modification dans Pascal reprise par les métrés.
 */
import { computeSegmentTransforms, getRoofSegmentSurfaceY, rotateXZ, useScene } from '@pascal-app/core'
import { describe, expect, it } from 'vitest'
import { computeBuildingMeasurements } from '../../measurements/measurements'
import { stairFootprint } from '../../stairs/stairs'
import type { CanvasElement, FabricsDocument, RoofElement, StairElement } from '../../../types/document'
import type { PlanScene, SceneNodeData } from '../sceneTypes'
import { settleScene } from '../settle'
import { sceneToFabricsView } from '../view/toFabricsView'
import { fabricsToScene } from './fromFabrics'

const BASE = { opacity: 1, locked: false, hidden: false, levelId: 'L0' }

function plan(...elements: CanvasElement[]): FabricsDocument {
  return {
    version: 4, unit: 'mm', page: { width: 42000, height: 29700, background: '#ffffff' },
    levels: [
      { id: 'L0', name: 'Rez-de-chaussée', elevation: 0, height: 2700, slabThickness: 200 },
      { id: 'L1', name: 'Étage', elevation: 2700, height: 2700, slabThickness: 200 },
    ],
    elements,
  }
}

const sceneOf = (doc: FabricsDocument) => settleScene(fabricsToScene(doc).scene)

function stair(over: Partial<StairElement>): StairElement {
  return { ...BASE, id: 'S', type: 'stair', name: 'Escalier', x: 1000, y: 2000, rotation: 0, shape: 'straight', width: 1000, length: 3500, voidMargin: 50, ...over }
}

/** Sommets des volées et paliers de Pascal dans le plan (mm). */
function pascalStairCorners(scene: PlanScene, id: string): [number, number][] {
  const node = scene.nodes[`stair_${id}`]
  const segs = (node.children ?? []).map((c) => scene.nodes[c]) as never[]
  const transforms = computeSegmentTransforms(segs)
  const pos = node.position as number[]
  return segs.flatMap((seg: { width: number; length: number }, i) => {
    const t = transforms[i]
    return ([[-seg.width / 2, 0], [seg.width / 2, 0], [seg.width / 2, seg.length], [-seg.width / 2, seg.length]] as const).map(([x, z]) => {
      const [sx, sz] = rotateXZ(x, z, t.rotation)
      const [wx, wz] = rotateXZ(t.position[0] + sx, t.position[2] + sz, node.rotation as number)
      return [Math.round((pos[0] + wx) * 1000), Math.round((pos[2] + wz) * 1000)] as [number, number]
    })
  })
}

const inside = ([x, y]: [number, number], poly: { x: number; y: number }[]) => {
  const xs = poly.map((p) => p.x)
  const ys = poly.map((p) => p.y)
  // Contour orthogonal (droit, L, U) : la boîte englobante suffit pour le contrôle des sommets.
  return x >= Math.min(...xs) - 1 && x <= Math.max(...xs) + 1 && y >= Math.min(...ys) - 1 && y <= Math.max(...ys) + 1
}

describe('escaliers convertis', () => {
  it.each([
    ['droit', {}],
    ['droit tourné de 37°', { rotation: 37 }],
    ['en L', { shape: 'l', length: 2000, length2: 1800 }],
    ['en L retourné, tourné de 90°', { shape: 'l', length: 2000, length2: 1800, mirrored: true, rotation: 90 }],
    ['en U avec jour', { shape: 'u', length: 1800, length2: 1800, gap: 200 }],
    ['en U retourné sans jour', { shape: 'u', length: 1800, length2: 1600, gap: 0, mirrored: true, rotation: -30 }],
  ] as const)('%s : volées et paliers de Pascal sur l’emprise du plan, aller-retour exact', (_, over) => {
    const el = stair(over as Partial<StairElement>)
    const doc = plan(el)
    const scene = sceneOf(doc)
    expect(scene.nodes.stair_S.type).toBe('stair')
    const footprint = stairFootprint(el)
    const corners = pascalStairCorners(scene, 'S')
    for (const c of corners) expect(inside(c, footprint), `${c}`).toBe(true)
    // Les quatre coins extrêmes de l'emprise sont atteints par les volées et paliers de Pascal.
    const xs = corners.map((c) => c[0])
    const ys = corners.map((c) => c[1])
    expect(Math.min(...xs)).toBeCloseTo(Math.min(...footprint.map((p) => p.x)), 0)
    expect(Math.max(...ys)).toBeCloseTo(Math.max(...footprint.map((p) => p.y)), 0)
    expect(sceneToFabricsView(scene)).toStrictEqual(doc)
  })

  it('escalier élargi dans Pascal (1000 → 1200 mm) : emmarchement repris par les métrés', () => {
    const scene = sceneOf(plan(stair({})))
    settleScene(scene)
    const seg = (scene.nodes.stair_S.children ?? [])[0]
    useScene.getState().updateNode(seg as never, { width: 1.2 } as never)
    const s = useScene.getState()
    const edited = settleScene({ nodes: s.nodes as unknown as PlanScene['nodes'], rootNodeIds: [...(s.rootNodeIds as string[])] })
    const view = sceneToFabricsView(edited)
    const el = view.elements.find((e) => e.id === 'S') as StairElement
    expect(el.width).toBe(1200)
    expect(computeBuildingMeasurements(view).levels[0].measurements.stairs[0].width).toBe(1200)
  })
})

function roof(over: Partial<RoofElement>): RoofElement {
  return {
    ...BASE, levelId: 'L1', id: 'R', type: 'roof', name: 'Toit', x: 0, y: 0, rotation: 0,
    points: [0, 0, 8000, 0, 8000, 6000, 0, 6000], shape: 'gable', pitch: 35, overhang: 500, ridgeEdge: 0, ...over,
  }
}

describe('toitures converties', () => {
  it.each([
    ['deux pans', {}],
    ['deux pans, faîtage pivoté', { ridgeEdge: 1 }],
    ['un pan, côté haut au sud', { shape: 'shed', ridgeEdge: 2 }],
    ['croupe', { shape: 'hip' }],
    ['plat', { shape: 'flat', pitch: 0 }],
    ['deux pans en biais', { points: [0, 0, 6928.2032, 4000, 4928.2032, 7464.1016, -2000, 3464.1016] }],
  ] as const)('%s : aller-retour exact, mêmes métrés', (_, over) => {
    const doc = plan(roof(over as Partial<RoofElement>))
    const scene = sceneOf(doc)
    expect(scene.nodes.roof_R.type).toBe('roof')
    expect(sceneToFabricsView(scene)).toStrictEqual(doc)
  })

  it('un pan : le côté haut de Fabrics est le côté haut de Pascal', () => {
    const scene = sceneOf(plan(roof({ shape: 'shed', ridgeEdge: 2 })))
    const seg = scene.nodes.rseg_R as never
    // Côté haut : y = 6000 (côté 2) ; en repère local, z négatif doit être le plus haut.
    const node = scene.nodes.roof_R
    const yaw = node.rotation as number
    // Point à 2,9 m au sud du centre (près du côté y = 6 m), et son symétrique au nord, en repère local.
    const [x, z] = rotateXZ(0, 2.9, -yaw)
    expect(getRoofSegmentSurfaceY(seg, x, z)).toBeGreaterThan(getRoofSegmentSurfaceY(seg, -x, -z))
  })

  it('pente changée dans Pascal (35° → 45°) : surface réelle recalculée par les règles de Fabrics', () => {
    const scene = sceneOf(plan(roof({})))
    settleScene(scene)
    useScene.getState().updateNode('rseg_R' as never, { pitch: 45 } as never)
    const s = useScene.getState()
    const edited = settleScene({ nodes: s.nodes as unknown as PlanScene['nodes'], rootNodeIds: [...(s.rootNodeIds as string[])] })
    const [m] = computeBuildingMeasurements(sceneToFabricsView(edited)).levels[1].measurements.roofs
    expect(m.pitch).toBe(45)
    // 9000 × 7000 mm au sol ÷ cos 45° ; le débord reste 500 mm en plan seulement si Pascal le garde le long de la pente.
    expect(m.projectedArea).toBeGreaterThan(0)
    expect(m.realArea / m.projectedArea).toBeCloseTo(Math.SQRT2, 6)
  })

  it('toiture changée en mansarde dans Pascal : comptée par les formules de Pascal, gardée dans la scène', () => {
    const scene = sceneOf(plan(roof({})))
    const nodes: Record<string, SceneNodeData> = { ...scene.nodes, rseg_R: { ...scene.nodes.rseg_R, roofType: 'mansard' } }
    const edited = settleScene({ nodes, rootNodeIds: scene.rootNodeIds })
    const view = sceneToFabricsView(edited)
    expect(view.elements.find((e) => e.id === 'R')).toBeUndefined()
    const [m] = computeBuildingMeasurements(view).levels[1].measurements.roofs
    expect(m.shape).toBe('mansard')
  })

  it('toiture à contour libre : reste un nœud Fabrics', () => {
    const doc = plan(roof({ shape: 'flat', pitch: 0, points: [0, 0, 8000, 0, 8000, 6000, 3000, 8000, 0, 6000] }))
    const scene = sceneOf(doc)
    expect(scene.nodes.fxroof_R?.type).toBe('fabrics:roof')
    expect(sceneToFabricsView(scene)).toStrictEqual(doc)
  })
})

describe('plans enregistrés avant B6', () => {
  it('nœuds Fabrics de toiture et d’escalier convertis au chargement, plan et métrés identiques', () => {
    const doc = plan(stair({ shape: 'l', length: 2000, length2: 1800 }), roof({}))
    const converted = fabricsToScene(doc).scene
    // Scène telle qu'enregistrée en M18 : un nœud Fabrics par élément.
    const legacy: Record<string, SceneNodeData> = {}
    for (const [id, node] of Object.entries(converted.nodes)) {
      if (['roof', 'roof-segment', 'stair', 'stair-segment'].includes(node.type)) continue
      legacy[id] = node
    }
    const toLegacy = (old: SceneNodeData, kind: 'roof' | 'stair', prefix: string) => {
      const meta = old.metadata.fabrics as { id: string; order: number; levelId?: string; element: Record<string, unknown> }
      const node: SceneNodeData = {
        id: `${prefix}_${meta.id}`, type: `fabrics:${kind}`, parentId: old.parentId, name: old.name, visible: true,
        element: meta.element, metadata: { fabrics: { id: meta.id, order: meta.order } },
      }
      legacy[node.id] = node
      const parent = legacy[old.parentId!]
      legacy[parent.id] = { ...parent, children: (parent.children ?? []).map((c) => (c === old.id ? node.id : c)) }
    }
    toLegacy(converted.nodes.stair_S, 'stair', 'fxstair')
    toLegacy(converted.nodes.roof_R, 'roof', 'fxroof')
    const before = computeBuildingMeasurements(doc)
    const loaded = settleScene({ nodes: legacy, rootNodeIds: converted.rootNodeIds })
    expect(loaded.nodes.stair_S?.type).toBe('stair')
    expect(loaded.nodes.roof_R?.type).toBe('roof')
    expect(loaded.nodes.fxroof_R).toBeUndefined()
    expect(sceneToFabricsView(loaded)).toStrictEqual(doc)
    expect(computeBuildingMeasurements(sceneToFabricsView(loaded))).toStrictEqual(before)
  })
})
