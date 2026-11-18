/**
 * Commentaires ancrés sur les nœuds de la scène Pascal (M18, lot E ; plan, point 5 A).
 *
 * Un commentaire posé sur un élément d'un projet Plan est enregistré sur l'identifiant du nœud qui
 * le porte (`wall_<id>__0`, `door_<id>`, `zone_<id>`…). Un mur à plusieurs côtés : le premier côté.
 * L'éditeur actuel travaille sur les éléments Fabrics : à la lecture, l'ancre redevient l'identifiant
 * de l'élément. Les commentaires d'avant M18 (ancrés sur l'élément) restent valables tels quels.
 */
import type { PlanScene } from './sceneTypes'

/** Nœud qui porte l'élément Fabrics `elementId` dans la scène ; l'élément lui-même s'il n'y est pas. */
export function anchorOfElement(scene: PlanScene | null | undefined, elementId: string): string {
  if (!scene) return elementId
  let anchor: { id: string; segment: number } | null = null
  for (const node of Object.values(scene.nodes)) {
    const meta = node.metadata?.fabrics as { id?: string; segment?: number } | undefined
    if (meta?.id !== elementId || node.type === 'level') continue
    const segment = meta.segment ?? 0
    if (!anchor || segment < anchor.segment) anchor = { id: node.id, segment }
  }
  return anchor?.id ?? elementId
}

/** Préfixes des nœuds créés depuis un plan Fabrics (`migrate/fromFabrics.ts`, `nodes/fabricsNodes.ts`). */
const NODE_ANCHOR = /^(?:wall|door|window|zone|item|structural-grid|construction-dimension|fx[a-z]+)_(.+?)(?:__\d+)?$/

/** Élément Fabrics d'une ancre de commentaire (nœud de la scène ou, avant M18, élément lui-même). */
export function elementOfAnchor(anchor: string): string {
  return NODE_ANCHOR.exec(anchor)?.[1] ?? anchor
}
