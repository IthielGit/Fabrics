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

/** Symboles des escaliers et objets de Pascal d'un niveau Fabrics, en mm ; `null` s'il n'y en a pas. */
export function pascalLevelSymbols(nodes: Readonly<Record<string, SceneNodeData>>, fabricsLevelId: string): PlanSymbols | null {
  const levelId = levelNodeIdOf(nodes, fabricsLevelId)
  if (!levelId) return null
  ensureBuiltinNodes()
  const entries = collectSheetGeometry({
    nodes: nodes as unknown as Record<string, AnyNode>,
    levelId: levelId as AnyNodeId,
    drawingType: 'floor-plan',
    annotationVisibility: NO_ANNOTATIONS,
    accept: (node) => PASCAL_DRAWN_TYPES.has(node.type),
    unit: 'metric',
    metricNotation: 'millimeters',
  })
  if (entries.length === 0) return null
  return mergeSymbols(entries.map((e) => floorplanToDrawing(e.model, { cut: CUT_TYPES.has(e.type) })))
}
