/**
 * Escaliers et objets du catalogue de Pascal d'un niveau, prêts pour le plan de niveau de Fabrics
 * (ADR 0007). La géométrie vient de Pascal (`collectSheetGeometry`, réglages d'un document, sans
 * annotations) ; la conversion est faite par `floorplanToDrawing`.
 */
import { type AnyNode, type AnyNodeDefinition, type AnyNodeId, nodeRegistry, registerNode } from '@pascal-app/core'
import { collectSheetGeometry } from '@pascal-app/editor'
import { builtinPlugin } from '@pascal-app/nodes'
import type { SceneNodeData } from '../sceneTypes'
import { floorplanToDrawing, mergeSymbols, type PlanSymbols } from './planSymbols'

/** Types de nœuds dessinés par Pascal sur les feuilles de Fabrics. */
export const PASCAL_DRAWN_TYPES: ReadonlySet<string> = new Set(['stair', 'item', 'column'])

/** Types dessinés en matière coupée (noir plein, sur les murs). */
const CUT_TYPES: ReadonlySet<string> = new Set(['column'])

const NO_ANNOTATIONS = {
  automaticDimensions: false,
  contextualDimensions: false,
  manualDimensions: false,
  measurements: false,
  openingMarks: false,
  structuralGrids: false,
  roomLabels: false,
  roomDetails: false,
  roofPlan: false,
  stairAnnotations: false,
} as const

/**
 * Types de nœuds de Pascal (escalier, objet…) : enregistrés au démarrage de l'éditeur
 * (`src/pascal/bootstrap.ts`) ; ici aussi pour les exports et les tests lancés sans l'éditeur.
 */
function ensureBuiltinNodes(): void {
  for (const def of builtinPlugin.nodes ?? []) {
    if (!nodeRegistry.has((def as AnyNodeDefinition).kind)) registerNode(def as AnyNodeDefinition)
  }
}

/** Nœud de niveau de la scène qui porte ce niveau Fabrics (id Fabrics gardé en métadonnée, ou id du nœud). */
export function levelNodeIdOf(nodes: Readonly<Record<string, SceneNodeData>>, fabricsLevelId: string): string | null {
  for (const node of Object.values(nodes)) {
    if (node.type !== 'level') continue
    const meta = (node.metadata as { fabrics?: { id?: string } } | undefined)?.fabrics
    if (meta?.id === fabricsLevelId || node.id === fabricsLevelId) return node.id
  }
  return null
}

/** Montée d'un escalier de Pascal (m) : somme des hauteurs de ses volées. */
function stairRise(nodes: Readonly<Record<string, SceneNodeData>>, stair: SceneNodeData): number {
  return (stair.children ?? []).reduce((sum, id) => sum + (((nodes[id] as { height?: number } | undefined)?.height) ?? 0), 0)
}

/**
 * Niveau directement en dessous (nœud de niveau de Pascal, même parent, rang `level` juste inférieur).
 */
function levelBelow(nodes: Readonly<Record<string, SceneNodeData>>, levelId: string): SceneNodeData | null {
  const rank = (n: SceneNodeData) => (n as unknown as { level?: number }).level
  const level = nodes[levelId]
  const own = rank(level) ?? 0
  const candidates = Object.values(nodes).filter(
    (n) => n.type === 'level' && n.parentId === level.parentId && typeof rank(n) === 'number' && rank(n)! < own,
  )
  return candidates.sort((a, b) => rank(b)! - rank(a)!)[0] ?? null
}

/**
 * Escaliers qui arrivent sur ce niveau depuis le niveau du dessous (M20 20.1b) : comme sur les plans
 * de la référence (Villa ROOMIT, R+1), l'escalier qui monte du RDC est dessiné sur le plan du R+1.
 * Arrive ici un escalier du niveau du dessous dont `toLevelId` est ce niveau, ou, sans `toLevelId`,
 * qui monte d'au moins 90 % de la hauteur de son niveau (règle des escaliers convertis par Fabrics).
 */
function arrivingStairIds(nodes: Readonly<Record<string, SceneNodeData>>, levelId: string): Set<string> {
  const below = levelBelow(nodes, levelId)
  const ids = new Set<string>()
  if (!below) return ids
  const belowHeight = (below as { height?: number }).height ?? 0
  for (const node of Object.values(nodes)) {
    if (node.type !== 'stair' || node.parentId !== below.id) continue
    const to = (node as { toLevelId?: string | null }).toLevelId
    if (to === levelId || (to == null && belowHeight > 0 && stairRise(nodes, node) >= 0.9 * belowHeight)) ids.add(node.id)
  }
  return ids
}

/**
 * Symboles des escaliers et objets de Pascal d'un niveau Fabrics, en mm, plus les escaliers qui
 * arrivent du niveau du dessous ; `null` s'il n'y en a pas.
 */
export function pascalLevelSymbols(nodes: Readonly<Record<string, SceneNodeData>>, fabricsLevelId: string): PlanSymbols | null {
  const levelId = levelNodeIdOf(nodes, fabricsLevelId)
  if (!levelId) return null
  ensureBuiltinNodes()
  const collect = (id: string, accept: (node: AnyNode) => boolean) =>
    collectSheetGeometry({
      nodes: nodes as unknown as Record<string, AnyNode>,
      levelId: id as AnyNodeId,
      drawingType: 'floor-plan',
      annotationVisibility: NO_ANNOTATIONS,
      accept,
      unit: 'metric',
      metricNotation: 'millimeters',
    })
  const entries = collect(levelId, (node) => PASCAL_DRAWN_TYPES.has(node.type))
  const arriving = arrivingStairIds(nodes, levelId)
  if (arriving.size > 0) {
    const below = levelBelow(nodes, levelId)!
    entries.push(...collect(below.id, (node) => arriving.has(node.id)))
  }
  if (entries.length === 0) return null
  return mergeSymbols(entries.map((e) => floorplanToDrawing(e.model, { cut: CUT_TYPES.has(e.type) })))
}
