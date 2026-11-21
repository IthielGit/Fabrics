import { SeparatorNode } from '@pascal-app/core'
import type { CanvasElement, FabricsDocument, Level } from '../../types/document'
import { fabricsToScene } from './migrate/fromFabrics'
import type { PlanScene, SceneNodeData } from './sceneTypes'
import { settleScene } from './settle'

/**
 * Plan Fabrics construit à partir d'un exemple `fixtures/<id>/spec.json` (murs à l'axe, ouvertures,
 * pièces, un niveau, tout en mm). Sert aux tests de précision (T1, T2) et de comparaison (ROOMIT-RDC).
 */
export interface FixtureSpec {
  level: Level
  walls: { ref: string; thickness: number; height: number; axis: number[] }[]
  openings: {
    ref: string
    kind: 'door' | 'window'
    wall: string
    segment: number
    offset: number
    width: number
    height: number
    sillHeight: number
  }[]
  rooms: { name: string; polygon: number[] }[]
  /** Lignes de séparation de pièces de Pascal (limite sans mur, comme dans Revit), `[x1, y1, x2, y2]` en mm. */
  separators?: { ref: string; line: [number, number, number, number] }[]
}

const BASE = { rotation: 0, opacity: 1, locked: false, hidden: false, x: 0, y: 0 }

export function fixturePlan(s: FixtureSpec): FabricsDocument {
  const levelId = s.level.id
  const elements: CanvasElement[] = []
  for (const w of s.walls) {
    elements.push({ ...BASE, id: w.ref, levelId, type: 'wall', name: w.ref, points: w.axis, thickness: w.thickness, height: w.height, fill: '#475569' })
  }
  for (const o of s.openings) {
    elements.push({
      ...BASE, id: o.ref, levelId, type: 'opening', name: o.ref, kind: o.kind, wallId: o.wall, segmentIndex: o.segment,
      offset: o.offset, width: o.width, height: o.height, sillHeight: o.sillHeight, hinge: 'start', side: 'left',
    })
  }
  s.rooms.forEach((r, i) =>
    elements.push({ ...BASE, id: `room${i}`, levelId, type: 'room', name: r.name, points: r.polygon, fill: '#eef', showLabel: true }),
  )
  return {
    version: 4, unit: 'mm', page: { width: 42000, height: 29700, background: '#ffffff' },
    levels: [{ ...s.level }],
    elements,
  }
}

/**
 * Scène Pascal de l'exemple, chargée comme dans l'éditeur (`settleScene`). Les séparations de pièces
 * n'existent que dans Pascal : elles sont ajoutées au niveau comme le ferait son outil.
 */
export function fixtureScene(s: FixtureSpec): PlanScene {
  const base = fabricsToScene(fixturePlan(s)).scene
  const separators = s.separators ?? []
  if (separators.length === 0) return settleScene(base)
  const levelId = Object.values(base.nodes).find((n) => n.type === 'level')!.id
  const nodes: Record<string, SceneNodeData> = { ...base.nodes }
  for (const sep of separators) {
    const [x1, y1, x2, y2] = sep.line
    const node = SeparatorNode.parse({ id: `separator_${sep.ref}`, parentId: levelId, start: [x1 / 1000, y1 / 1000], end: [x2 / 1000, y2 / 1000] })
    nodes[node.id] = node as unknown as SceneNodeData
    const level = nodes[levelId]
    nodes[levelId] = { ...level, children: [...(level.children ?? []), node.id] }
  }
  return settleScene({ nodes, rootNodeIds: base.rootNodeIds })
}
