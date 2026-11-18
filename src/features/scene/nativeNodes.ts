/**
 * Nœuds natifs de Pascal (créés avec ses outils, sans `metadata.fabrics`) gardés quand Fabrics
 * reconstruit la scène depuis son document (M19 B2). Fabrics réécrit la scène quand il modifie le plan
 * lui-même (cotation Client / Exécution, version des métrés, restauration hors connexion) : sans cette
 * étape, tout ce que la vue Fabrics ne représente pas (dalles, plafonds, objets 3D, toitures et
 * escaliers de Pascal…) serait effacé, et les murs, portes, fenêtres et pièces de Pascal perdraient
 * leurs propriétés propres (couches, matériaux…). Fonction pure.
 */
import type { CanvasElement, FabricsDocument, Level } from '../../types/document'
import { deepEqual } from './deepEqual'
import type { PlanScene, SceneNodeData } from './sceneTypes'
import { isNativeElementNode } from './view/toFabricsView'

/** Champs d'un nœud recopiés depuis la scène reconstruite quand l'élément a changé dans Fabrics. */
const PLACEMENT_KEYS = ['start', 'end', 'position', 'width', 'polygon', 'name', 'visible', 'parentId', 'wallId'] as const
const LEVEL_KEYS = ['name', 'height', 'baseElevation'] as const

function isNative(node: SceneNodeData): boolean {
  return node.metadata?.fabrics === undefined
}

function pick(node: SceneNodeData, keys: readonly string[]): Partial<SceneNodeData> {
  return Object.fromEntries(keys.filter((key) => key in node).map((key) => [key, node[key]]))
}

/**
 * Scène reconstruite (`next`, depuis le document `current`) dans laquelle les nœuds natifs de
 * `previous` sont remis : tels quels si leur élément n'a pas changé entre `previousView` et `current`,
 * avec la nouvelle position sinon ; ceux que la vue ne représente pas, toujours tels quels. Un élément
 * natif retiré du document reste retiré.
 */
export function keepNativeNodes(
  previous: PlanScene,
  previousView: FabricsDocument,
  current: FabricsDocument,
  next: PlanScene,
): PlanScene {
  const nodes: Record<string, SceneNodeData> = { ...next.nodes }
  const before = new Map<string, CanvasElement | Level>()
  const after = new Map<string, CanvasElement | Level>()
  for (const item of [...previousView.elements, ...(previousView.levels ?? [])]) before.set(item.id, item)
  for (const item of [...current.elements, ...(current.levels ?? [])]) after.set(item.id, item)

  const carried: SceneNodeData[] = []
  for (const node of Object.values(previous.nodes)) {
    if (!isNative(node)) continue
    const represented = isNativeElementNode(node) || node.type === 'level'
    if (!represented) {
      if (!nodes[node.id]) carried.push(node)
      continue
    }
    const now = after.get(node.id)
    if (!now) {
      // Retiré du document : ses enfants natifs (ouvertures) partent avec lui.
      delete nodes[node.id]
      continue
    }
    const rebuilt = nodes[node.id]
    if (deepEqual(before.get(node.id), now) || !rebuilt) {
      nodes[node.id] = node
      continue
    }
    const changed = before.get(node.id) as Record<string, unknown> | undefined
    const edited = now as unknown as Record<string, unknown>
    const keys: string[] = node.type === 'level' ? [...LEVEL_KEYS] : [...PLACEMENT_KEYS]
    // Épaisseur et hauteur d'un mur : reprises seulement si elles ont changé dans Fabrics (un mur de
    // Pascal sans hauteur suit celle de son niveau).
    if (node.type === 'wall') {
      if (changed?.thickness !== edited.thickness) keys.push('thickness')
      if (changed?.height !== edited.height) keys.push('height')
    } else if (node.type === 'door' || node.type === 'window') keys.push('height')
    nodes[node.id] = { ...node, ...pick(rebuilt, keys), metadata: node.metadata, children: node.children }
  }

  // Nœuds que la vue ne représente pas : gardés si leur parent est toujours là (un parent gardé peut
  // venir après son enfant dans la liste : on répète jusqu'à ne plus rien ajouter).
  let pending = carried
  for (let progress = true; progress && pending.length > 0; ) {
    progress = false
    const rest: SceneNodeData[] = []
    for (const node of pending) {
      if (node.parentId === null || nodes[node.parentId]) {
        nodes[node.id] = node
        progress = true
      } else rest.push(node)
    }
    pending = rest
  }

  // Listes d'enfants : chaque nœud figure dans celle de son parent, et aucune ne garde un absent.
  for (const node of Object.values(nodes)) {
    const children = node.children
    if (Array.isArray(children) && children.some((id) => !nodes[id])) {
      nodes[node.id] = { ...node, children: children.filter((id) => nodes[id]) }
    }
  }
  for (const node of Object.values(nodes)) {
    const parent = node.parentId ? nodes[node.parentId] : undefined
    if (!parent || !Array.isArray(parent.children) || parent.children.includes(node.id)) continue
    nodes[parent.id] = { ...parent, children: [...parent.children, node.id] }
  }
  // Ouvertures natives d'un mur retiré : plus de parent, retirées aussi.
  for (const node of Object.values(nodes)) {
    if (node.parentId && !nodes[node.parentId]) delete nodes[node.id]
  }

  return { nodes, rootNodeIds: next.rootNodeIds }
}
