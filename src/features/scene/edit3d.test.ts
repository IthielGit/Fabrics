/**
 * M19 B2 — Édition 2D / 3D par les commandes de Pascal, sur le **même** objet de la scène.
 *
 * Les poignées 3D et le plan 2D de Pascal modifient la scène par les mêmes commandes
 * (`setWallGeometry` pour un mur, `updateNode` pour une ouverture) ; Fabrics relit la scène
 * (`sceneToFabricsView`) pour ses métrés, cotes et exports. Ces tests jouent ces commandes comme le
 * ferait un geste, puis vérifient le plan et les métrés (critères G2).
 */
import {
  DoorNode,
  SlabNode,
  useScene,
  WallNode,
  ZoneNode,
} from '@pascal-app/core'
import { describe, expect, it } from 'vitest'
import { computeBuildingMeasurements } from '../measurements/measurements'
import type { CanvasElement, FabricsDocument } from '../../types/document'
import { fabricsToScene } from './migrate/fromFabrics'
import { rebuildScene } from './sceneBinding'
import type { PlanScene, SceneNodeData } from './sceneTypes'
import { settleScene } from './settle'
import { sceneToFabricsView } from './view/toFabricsView'

const BASE = { rotation: 0, opacity: 1, locked: false, hidden: false, x: 0, y: 0, levelId: 'L0' }

/** Deux murs en L (4000 et 3000 mm, raccordés), une porte de 900 × 2100 mm sur le premier. */
function plan(): FabricsDocument {
  const elements: CanvasElement[] = [
    { ...BASE, id: 'A', type: 'wall', name: 'A', points: [0, 0, 4000, 0], thickness: 200, height: 2700, fill: '#475569' },
    { ...BASE, id: 'B', type: 'wall', name: 'B', points: [4000, 0, 4000, 3000], thickness: 200, height: 2700, fill: '#475569' },
    {
      ...BASE, id: 'D', type: 'opening', name: 'P1', kind: 'door', wallId: 'A', segmentIndex: 0, offset: 2000,
      width: 900, height: 2100, sillHeight: 0, hinge: 'start', side: 'left',
    },
  ]
  return {
    version: 4, unit: 'mm', page: { width: 42000, height: 29700, background: '#ffffff' },
    levels: [{ id: 'L0', name: 'Rez-de-chaussée', elevation: 0, height: 2700, slabThickness: 200 }],
    elements,
  }
}

const WALL_A = 'wall_A__0'
const WALL_B = 'wall_B__0'
const DOOR = 'door_D'
const LEVEL = 'level_L0'

function sceneOf(doc: FabricsDocument): PlanScene {
  return settleScene(fabricsToScene(doc).scene)
}

/** `updateNode` du store de Pascal (poignées d'une ouverture, panneau), puis la scène telle qu'il la garde. */
function updateNode(scene: PlanScene, id: string, data: Record<string, unknown>): PlanScene {
  settleScene(scene)
  useScene.getState().updateNode(id as never, data as never)
  const { nodes, rootNodeIds } = useScene.getState()
  return settleScene({ nodes: nodes as unknown as PlanScene['nodes'], rootNodeIds: [...(rootNodeIds as string[])] })
}

function metres(scene: PlanScene) {
  return computeBuildingMeasurements(sceneToFabricsView(scene)).levels[0].measurements
}

const pt = (scene: PlanScene, id: string, key: 'start' | 'end') => (scene.nodes[id][key] as number[]).map((v) => Math.round(v * 1000))

/**
 * Geste « glisser l'extrémité d'un mur » de Pascal (`move-endpoint-tool`, en 2D comme en 3D) : le mur
 * et les murs raccordés au même coin sont écrits ensemble, en une étape d'annulation.
 */
function dragWallEnd(scene: PlanScene, wallId: string, to: [number, number]): PlanScene {
  settleScene(scene)
  const { nodes } = useScene.getState()
  const wall = nodes[wallId as never] as unknown as { start: [number, number]; end: [number, number]; parentId: string }
  const same = (p: number[], q: number[]) => p[0] === q[0] && p[1] === q[1]
  const linked = Object.values(nodes as unknown as Record<string, SceneNodeData>).filter(
    (n) => n.type === 'wall' && n.id !== wallId && n.parentId === wall.parentId && (same(n.start as number[], wall.end) || same(n.end as number[], wall.end)),
  )
  useScene.getState().updateNodes([
    { id: wallId as never, data: { end: to } as never },
    ...linked.map((n) => ({
      id: n.id as never,
      data: { start: same(n.start as number[], wall.end) ? to : n.start, end: same(n.end as number[], wall.end) ? to : n.end } as never,
    })),
  ])
  const state = useScene.getState()
  return settleScene({ nodes: state.nodes as unknown as PlanScene['nodes'], rootNodeIds: [...(state.rootNodeIds as string[])] })
}

describe('B2 : un mur allongé en 3D', () => {
  const before = sceneOf(plan())
  const after = dragWallEnd(before, WALL_A, [5, 0])

  it('critère G2 : 4000 → 5000 mm sur le plan et dans les métrés', () => {
    const view = sceneToFabricsView(after)
    const wall = view.elements.find((el) => el.id === 'A')
    expect(wall?.type === 'wall' && wall.points).toEqual([0, 0, 5000, 0])
    const a = metres(after).walls.find((w) => w.id === 'A')!
    expect(a.length).toBe(5000)
    expect(a.wallArea).toBe(5000 * 2700)
    expect(metres(before).walls.find((w) => w.id === 'A')!.length).toBe(4000)
  })

  it('jonction propre : le mur raccordé suit le coin déplacé', () => {
    expect(pt(after, WALL_B, 'start')).toEqual([5000, 0])
    expect(pt(after, WALL_B, 'end')).toEqual([4000, 3000])
    expect(metres(after).walls.find((w) => w.id === 'B')!.length).toBeCloseTo(Math.hypot(1000, 3000), 6)
  })

  it('panneau « Longueur » (5000 tapé) : même résultat sur le plan et dans les métrés', () => {
    const typed = updateNode(before, WALL_A, { end: [5, 0] })
    expect(metres(typed).walls.find((w) => w.id === 'A')!.length).toBe(5000)
    // Le panneau ne déplace que ce mur : le mur B reste en place, raccordé en T.
    expect(pt(typed, WALL_B, 'start')).toEqual([4000, 0])
  })

  it('même objet : identifiants des nœuds et des éléments inchangés, aucun élément fantôme', () => {
    expect(Object.keys(after.nodes).sort()).toEqual(Object.keys(before.nodes).sort())
    const ids = (s: PlanScene) => sceneToFabricsView(s).elements.map((el) => el.id).sort()
    expect(ids(after)).toEqual(ids(before))
  })
})

describe('B2 : ouvertures modifiées ou supprimées en 3D', () => {
  const scene = sceneOf(plan())

  it('porte élargie à 1200 mm : surface d’ouverture et surface nette recalculées', () => {
    const wider = updateNode(scene, DOOR, { width: 1.2 })
    const a = metres(wider).walls.find((w) => w.id === 'A')!
    expect(a.openingsArea).toBe(1200 * 2100)
    expect(a.netArea).toBe(a.wallArea - 1200 * 2100)
  })

  it('critère G2 : porte supprimée → surface nette = surface brute, aucune incohérence', () => {
    const before = metres(scene).walls.find((w) => w.id === 'A')!
    expect(before.netArea).toBe(before.wallArea - 900 * 2100)
    settleScene(scene)
    useScene.getState().deleteNode(DOOR as never)
    const { nodes, rootNodeIds } = useScene.getState()
    const without = settleScene({ nodes: nodes as unknown as PlanScene['nodes'], rootNodeIds: [...(rootNodeIds as string[])] })
    const a = metres(without).walls.find((w) => w.id === 'A')!
    expect(a.openingsArea).toBe(0)
    expect(a.netArea).toBe(a.wallArea)
    expect(metres(without).openings).toHaveLength(0)
    expect(a.volume).toBe(4000 * 200 * 2700)
  })
})

describe('B2 : objets dessinés avec les outils de Pascal', () => {
  /** Mur, porte et pièce créés par Pascal (sans `metadata.fabrics`), sur le niveau du plan. */
  function withNative(): PlanScene {
    const scene = sceneOf(plan())
    const wall = WallNode.parse({ id: 'wall_native1', parentId: LEVEL, name: 'Wall 1', start: [0, 3], end: [4, 3], thickness: 0.2, children: [] })
    const door = DoorNode.parse({ id: 'door_native1', parentId: wall.id, wallId: wall.id, position: [1, 1.05, 0], width: 0.8, height: 2.1 })
    const room = ZoneNode.parse({ id: 'zone_native1', parentId: LEVEL, name: 'Chambre', spaceRole: 'room', polygon: [[0, 0], [4, 0], [4, 3], [0, 3]] })
    // Terrasse hors de la pièce (une dalle sous une pièce est reprise par la pièce, modèle de Pascal).
    const slab = SlabNode.parse({ id: 'slab_native1', parentId: LEVEL, polygon: [[6, 0], [8, 0], [8, 2], [6, 2]] })
    const nodes = { ...scene.nodes }
    for (const node of [wall, door, room, slab]) nodes[node.id] = node as unknown as SceneNodeData
    nodes[wall.id] = { ...nodes[wall.id], children: [door.id] }
    const level = nodes[LEVEL]
    nodes[LEVEL] = { ...level, children: [...(level.children ?? []), wall.id, room.id, slab.id] }
    return settleScene({ nodes, rootNodeIds: scene.rootNodeIds })
  }

  it('comptent dans les métrés : mur (hauteur du niveau), porte, pièce', () => {
    const m = metres(withNative())
    const wall = m.walls.find((w) => w.id === 'wall_native1')!
    expect(wall).toMatchObject({ length: 4000, thickness: 200, height: 2700 })
    // « Wall 1 » (nom anglais écrit par Pascal) → nom automatique français de Fabrics.
    expect(wall.name).toMatch(/^Mur/)
    expect(wall.openingsArea).toBe(800 * 2100)
    expect(m.openings.map((o) => o.id)).toContain('door_native1')
    expect(m.rooms.find((r) => r.id === 'zone_native1')?.area).toBe(12_000_000)
  })

  it('restent intacts quand Fabrics réécrit le plan (cotation, version des métrés…)', () => {
    const scene = withNative()
    const view = sceneToFabricsView(scene)
    const changed: FabricsDocument = { ...view, page: { ...view.page, background: '#fafafa' } }
    const rebuilt = rebuildScene(scene, view, changed)
    for (const id of ['wall_native1', 'door_native1', 'zone_native1', 'slab_native1']) {
      expect(rebuilt.nodes[id], id).toBeDefined()
      expect(rebuilt.nodes[id].metadata?.fabrics, id).toBeUndefined()
    }
    expect(rebuilt.nodes.wall_native1.start).toEqual([0, 3])
    expect(rebuilt.nodes.slab_native1.polygon).toEqual(scene.nodes.slab_native1.polygon)
    expect(sceneToFabricsView(rebuilt).page.background).toBe('#fafafa')
  })

  it('un mur de Pascal déplacé par Fabrics garde son identité et ses propriétés propres', () => {
    const scene = withNative()
    const view = sceneToFabricsView(scene)
    const moved: FabricsDocument = {
      ...view,
      elements: view.elements.map((el) => (el.id === 'wall_native1' && el.type === 'wall' ? { ...el, points: [0, 3500, 4000, 3500] } : el)),
    }
    const rebuilt = rebuildScene(scene, view, moved)
    expect(rebuilt.nodes.wall_native1.start).toEqual([0, 3.5])
    expect(rebuilt.nodes.wall_native1.height).toBeUndefined()
    expect(rebuilt.nodes.wall_native1.metadata?.fabrics).toBeUndefined()
    expect(Object.keys(rebuilt.nodes).filter((id) => id.includes('native1') && id.startsWith('wall'))).toEqual(['wall_native1'])
  })
})
