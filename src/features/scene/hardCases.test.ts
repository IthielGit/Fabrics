/**
 * M19 B5 — Cas difficiles : jonctions, collisions, ouvertures, épaisseur nulle ou invalide.
 *
 * Deux défenses : les commandes de Pascal refusent une géométrie impossible (`setWallGeometry`), et
 * les métrés de Fabrics signalent ce qui est quand même dans la scène (murs importés, anciens plans,
 * nœuds modifiés à la main), sans jamais compter deux fois ni produire une valeur négative.
 */
import { DoorNode, setWallGeometry, WallNode, WindowNode } from '@pascal-app/core'
import { describe, expect, it } from 'vitest'
import { computeBuildingMeasurements } from '../measurements/measurements'
import { metresWarnings } from '../measurements/warnings'
import type { FabricsDocument } from '../../types/document'
import { fabricsToScene } from './migrate/fromFabrics'
import type { PlanScene, SceneNodeData } from './sceneTypes'
import { settleScene } from './settle'
import { sceneToFabricsView } from './view/toFabricsView'

const LEVEL = 'level_L0'
const mintId = (kind: 'zone' | 'wall' | 'separator') => `${kind}_hard${Math.random().toString(36).slice(2, 8)}`

function emptyPlan(): FabricsDocument {
  return {
    version: 4, unit: 'mm', page: { width: 42000, height: 29700, background: '#ffffff' },
    levels: [{ id: 'L0', name: 'Rez-de-chaussée', elevation: 0, height: 2500, slabThickness: 200 }],
    elements: [],
  }
}

/** Scène avec des nœuds posés tels quels (comme un import ou un ancien fichier les donnerait). */
function sceneWith(...nodes: { id: string; parentId: string | null }[]): PlanScene {
  const base = settleScene(fabricsToScene(emptyPlan()).scene)
  const all: Record<string, SceneNodeData> = { ...base.nodes }
  for (const node of nodes) all[node.id] = node as unknown as SceneNodeData
  for (const node of nodes) {
    const parent = node.parentId ? all[node.parentId] : undefined
    if (parent) all[parent.id] = { ...parent, children: [...(parent.children ?? []), node.id] }
  }
  return settleScene({ nodes: all, rootNodeIds: base.rootNodeIds })
}

function report(scene: PlanScene) {
  const view = sceneToFabricsView(scene)
  const building = computeBuildingMeasurements(view)
  return { m: building.levels[0].measurements, warnings: metresWarnings(view, building) }
}

const wall = (id: string, start: [number, number], end: [number, number], thickness = 0.2) =>
  WallNode.parse({ id, parentId: LEVEL, start, end, thickness, children: [] })

describe('épaisseur nulle ou invalide, longueur nulle', () => {
  const scene = sceneWith(wall('wall_ok', [0, 0], [4, 0]))

  it('la commande de Pascal refuse une épaisseur nulle et un mur de longueur nulle', () => {
    expect(() => setWallGeometry(scene.nodes as never, { wallId: 'wall_ok', thickness: 0, mintId })).toThrow(/Invalid wall geometry/)
    expect(() => setWallGeometry(scene.nodes as never, { wallId: 'wall_ok', end: [0, 0], mintId })).toThrow(/Invalid wall geometry/)
  })

  it('un mur sans épaisseur déjà dans la scène : volume 0 et avertissement', () => {
    const { m, warnings } = report(sceneWith(wall('wall_thin', [0, 0], [4, 0], 0)))
    expect(m.walls[0]).toMatchObject({ length: 4000, thickness: 0, volume: 0 })
    expect(warnings.map((w) => w.kind)).toContain('wallInvalidThickness')
  })

  it('un mur de Pascal réduit à un point est retiré par Pascal au chargement : aucun élément fantôme', () => {
    const dot = sceneWith(wall('wall_dot', [1, 1], [1, 1]))
    expect(dot.nodes.wall_dot).toBeUndefined()
    expect(report(dot).m.walls).toEqual([])
  })

  it('un mur de longueur nulle d’un ancien plan : retiré au chargement, il ne comptait rien', () => {
    const plan = emptyPlan()
    plan.elements.push({
      id: 'old', levelId: 'L0', type: 'wall', name: 'Ancien', rotation: 0, opacity: 1, locked: false, hidden: false,
      x: 0, y: 0, points: [1000, 1000, 1000, 1000], thickness: 200, height: 2500, fill: '#475569',
    })
    // Avant le chargement par Pascal (document seul) : compté à zéro et signalé.
    const building = computeBuildingMeasurements(plan)
    expect(building.levels[0].measurements.walls[0]).toMatchObject({ length: 0, wallArea: 0, volume: 0 })
    expect(metresWarnings(plan, building).map((w) => w.kind)).toContain('wallZeroLength')
    // Par la scène : Pascal ne garde pas un mur sans longueur ; les totaux ne changent pas.
    const { m } = report(settleScene(fabricsToScene(plan).scene))
    expect(m.totals.wallArea).toBe(0)
    expect(m.totals.wallVolume).toBe(0)
  })
})

describe('collisions de murs', () => {
  it('deux murs superposés sur 1000 mm : signalés, la partie commune annoncée', () => {
    const { warnings } = report(sceneWith(wall('wall_a', [0, 0], [4, 0]), wall('wall_b', [3, 0], [6, 0])))
    const overlap = warnings.find((w) => w.kind === 'wallOverlap')
    expect(overlap?.kind === 'wallOverlap' && overlap.length).toBe(1000)
  })
})

describe('jonctions', () => {
  it('raccord en T jusqu’à l’axe : la part de la cloison dans le mur n’est pas comptée deux fois', () => {
    // Cloison de 100 mm qui entre jusqu'à l'axe d'un mur de 200 mm : 100 mm de sa longueur sont dans le mur.
    const { m } = report(sceneWith(wall('wall_env', [0, 0], [6, 0]), wall('wall_part', [3, 0], [3, 3], 0.1)))
    const part = m.walls.find((w) => w.id === 'wall_part')!
    const env = m.walls.find((w) => w.id === 'wall_env')!
    expect(env.volume).toBe(6000 * 200 * 2500)
    expect(part.volume).toBe((3000 - 100) * 100 * 2500)
  })
})

describe('ouvertures', () => {
  it('fenêtre qui dépasse du bout de son mur : signalée, surface jamais négative', () => {
    const host = wall('wall_host', [0, 0], [2, 0])
    const win = WindowNode.parse({ id: 'window_out', parentId: host.id, wallId: host.id, position: [1.9, 1.5, 0], width: 1.2, height: 1 })
    const { m, warnings } = report(sceneWith(host, win))
    expect(warnings.map((w) => w.kind)).toContain('openingOutside')
    expect(m.walls[0].netArea).toBeGreaterThanOrEqual(0)
    expect(m.walls[0].netArea).toBeLessThanOrEqual(m.walls[0].wallArea)
  })

  it('deux ouvertures qui se chevauchent : signalées, surface commune déduite une seule fois', () => {
    const host = wall('wall_host', [0, 0], [6, 0])
    const a = WindowNode.parse({ id: 'window_a', parentId: host.id, wallId: host.id, position: [2, 1.5, 0], width: 1.2, height: 1 })
    const b = WindowNode.parse({ id: 'window_b', parentId: host.id, wallId: host.id, position: [2.6, 1.5, 0], width: 1.2, height: 1 })
    const { m, warnings } = report(sceneWith(host, a, b))
    expect(warnings.map((w) => w.kind)).toContain('openingOverlap')
    // Union : de 1,4 à 3,2 m, soit 1800 mm × 1000 mm (et non 2 × 1,20 m²).
    expect(m.walls[0].openingsArea).toBe(1800 * 1000)
  })

  it('porte plus haute que son mur : surface limitée à la hauteur du mur', () => {
    const host = wall('wall_low', [0, 0], [4, 0])
    const door = DoorNode.parse({ id: 'door_tall', parentId: host.id, wallId: host.id, position: [2, 1.5, 0], width: 1, height: 3 })
    const low = { ...host, height: 2 }
    const { m } = report(sceneWith(low, door))
    expect(m.walls[0].openingsArea).toBeLessThanOrEqual(1000 * 2000)
    expect(m.walls[0].netArea).toBeGreaterThanOrEqual(0)
  })
})
