import type { SceneNodeData } from './sceneTypes'

type Nodes = Readonly<Record<string, SceneNodeData>>

/** Nœud de niveau ancêtre d'un nœud de la scène (lui-même s'il est un niveau), ou `undefined`. */
export function levelNodeOf(node: SceneNodeData, nodes: Nodes): SceneNodeData | undefined {
  let current: SceneNodeData | undefined = node
  while (current && current.type !== 'level') current = current.parentId ? nodes[current.parentId] : undefined
  return current
}

/**
 * Niveau Fabrics d'un nœud : identifiant du niveau Fabrics de son niveau ancêtre, sinon celui du
 * nœud de niveau de Pascal ; `null` hors de tout niveau.
 */
export function fabricsLevelIdOf(node: SceneNodeData, nodes: Nodes): string | null {
  const level = levelNodeOf(node, nodes)
  if (!level) return null
  return (level.metadata?.fabrics as { id?: string } | undefined)?.id ?? level.id
}
