import { ColumnNode, ItemNode, SeparatorNode } from '@pascal-app/core'
import type { CanvasElement, FabricsDocument, Level, WallMaterial } from '../../types/document'
import { fabricsToScene } from './migrate/fromFabrics'
import type { PlanScene, SceneNodeData } from './sceneTypes'
import { settleScene } from './settle'
import { levelNodeIdOf } from './view/levelPlanSymbols'

/**
 * Plan Fabrics construit à partir d'un exemple `fixtures/<id>/spec.json` (murs à l'axe, ouvertures,
 * pièces, un niveau, tout en mm). Sert aux tests de précision (T1, T2) et de comparaison (ROOMIT-RDC).
 */
export interface FixtureSpec {
  level: Level
  walls: { ref: string; thickness: number; height: number; axis: number[]; material?: WallMaterial }[]
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
  /** Escaliers au format de Fabrics (convertis en escaliers de Pascal), mm. */
  stairs?: { ref: string; x: number; y: number; rotation?: number; shape: 'straight' | 'l' | 'u'; width: number; length: number; length2?: number; mirrored?: boolean }[]
  /**
   * Objets du catalogue de Pascal (nœuds `item` natifs) : centre `x`, `y` (mm), rotation (degrés),
   * identifiant et nom d'objet du catalogue (ils décident du symbole de plan), largeur × hauteur × profondeur (mm).
   */
  /** Poteaux de Pascal (section carrée ou rectangulaire), centre `x`, `y` et `width` × `depth` en mm. */
  columns?: { ref: string; x: number; y: number; width: number; depth: number }[]
  items?: { ref: string; assetId: string; name: string; x: number; y: number; rotation?: number; size: [number, number, number] }[]
}

const BASE = { rotation: 0, opacity: 1, locked: false, hidden: false, x: 0, y: 0 }

/** Éléments Fabrics d'un niveau de l'exemple ; `prefix` rend les ids uniques quand plusieurs niveaux sont réunis. */
function fixtureElements(s: FixtureSpec, prefix: string): CanvasElement[] {
  const levelId = s.level.id
  const id = (ref: string) => `${prefix}${ref}`
  const elements: CanvasElement[] = []
  for (const w of s.walls) {
    elements.push({ ...BASE, id: id(w.ref), levelId, type: 'wall', name: w.ref, points: w.axis, thickness: w.thickness, height: w.height, fill: '#475569', ...(w.material ? { material: w.material } : {}) })
  }
  for (const o of s.openings) {
    elements.push({
      ...BASE, id: id(o.ref), levelId, type: 'opening', name: o.ref, kind: o.kind, wallId: id(o.wall), segmentIndex: o.segment,
      offset: o.offset, width: o.width, height: o.height, sillHeight: o.sillHeight, hinge: 'start', side: 'left',
    })
  }
  s.rooms.forEach((r, i) =>
    elements.push({ ...BASE, id: id(`room${i}`), levelId, type: 'room', name: r.name, points: r.polygon, fill: '#eef', showLabel: true }),
  )
  for (const st of s.stairs ?? []) {
    elements.push({
      ...BASE, id: id(st.ref), levelId, type: 'stair', name: st.ref, x: st.x, y: st.y, rotation: st.rotation ?? 0,
      shape: st.shape, width: st.width, length: st.length, ...(st.length2 !== undefined ? { length2: st.length2 } : {}),
      ...(st.mirrored ? { mirrored: true } : {}), voidMargin: 50,
    })
  }
  return elements
}

function planOf(specs: readonly FixtureSpec[], prefixed: boolean): FabricsDocument {
  return {
    version: 4, unit: 'mm', page: { width: 42000, height: 29700, background: '#ffffff' },
    levels: specs.map((s) => ({ ...s.level })),
    elements: specs.flatMap((s) => fixtureElements(s, prefixed ? `${s.level.id}_` : '')),
  }
}

export function fixturePlan(s: FixtureSpec): FabricsDocument {
  return planOf([s], false)
}

/**
 * Scène Pascal de l'exemple, chargée comme dans l'éditeur (`settleScene`). Les séparations de pièces,
 * poteaux et objets du catalogue n'existent que dans Pascal : ils sont ajoutés au niveau comme le ferait son outil.
 */
export function fixtureScene(s: FixtureSpec): PlanScene {
  return sceneOf([s], false)
}

/**
 * Bâtiment de plusieurs niveaux (ex. ROOMIT-RDC + ROOMIT-R1) dans une seule scène, niveaux empilés
 * par leur altitude. Les ids sont préfixés par l'id du niveau (`R1_GAUCHE`), les noms gardent la référence.
 */
export function fixtureBuildingScene(specs: readonly FixtureSpec[]): PlanScene {
  return sceneOf(specs, true)
}

function sceneOf(specs: readonly FixtureSpec[], prefixed: boolean): PlanScene {
  const base = fabricsToScene(planOf(specs, prefixed)).scene
  const nodes: Record<string, SceneNodeData> = { ...base.nodes }
  for (const s of specs) {
    const levelId = levelNodeIdOf(nodes, s.level.id)!
    const p = prefixed ? `${s.level.id}_` : ''
    const add = (node: { id: string }) => {
      nodes[node.id] = node as unknown as SceneNodeData
      const level = nodes[levelId]
      nodes[levelId] = { ...level, children: [...(level.children ?? []), node.id] }
    }
    for (const sep of s.separators ?? []) {
      const [x1, y1, x2, y2] = sep.line
      add(SeparatorNode.parse({ id: `separator_${p}${sep.ref}`, parentId: levelId, start: [x1 / 1000, y1 / 1000], end: [x2 / 1000, y2 / 1000] }))
    }
    for (const c of s.columns ?? []) {
      add(
        ColumnNode.parse({
          id: `column_${p}${c.ref}`,
          parentId: levelId,
          position: [c.x / 1000, 0, c.y / 1000],
          crossSection: 'rectangular',
          width: c.width / 1000,
          depth: c.depth / 1000,
          height: s.level.height / 1000,
        }),
      )
    }
    for (const it of s.items ?? []) {
      const [w, h, d] = it.size.map((v) => v / 1000)
      add(
        ItemNode.parse({
          id: `item_${p}${it.ref}`,
          parentId: levelId,
          position: [it.x / 1000, 0, it.y / 1000],
          rotation: [0, ((it.rotation ?? 0) * Math.PI) / 180, 0],
          asset: { id: it.assetId, category: 'furniture', name: it.name, thumbnail: '', src: `/items/${it.assetId}.glb`, dimensions: [w, h, d] },
        }),
      )
    }
  }
  return settleScene({ nodes, rootNodeIds: base.rootNodeIds })
}
