// Scène Pascal d'un projet Plan dans un `Y.Doc` (M18, lots C et E). Fonctions pures, testées.
//
// Structure :
//   sceneMeta   Y.Map   format (numéro du format de la scène), rootNodeIds (liste JSON),
//                       savedAt (heure serveur du dernier enregistrement dans Supabase)
//   sceneNodes  Y.Map   identifiant de nœud → Y.Map (une clé par propriété du nœud)
//
// Comme pour les documents (`collab/yDocument.ts`), chaque valeur est une valeur JSON « atomique » :
// deux personnes qui modifient deux propriétés différentes d'un même nœud ne s'écrasent pas. Les clés
// diffèrent de celles des documents Fabrics : une ancienne salle de collaboration n'est pas relue
// comme une scène.

import * as Y from 'yjs'
import { isLaterThan, sameValue, syncFlatMap } from '../collab/yDocument'
import type { PlanScene, SceneNodeData } from './sceneTypes'

type Json = unknown

/** Format de la scène enregistrée (augmenté si la forme change). */
export const SCENE_FORMAT = 1

export interface YSceneParts {
  meta: Y.Map<Json>
  nodes: Y.Map<Y.Map<Json>>
}

export function ySceneParts(ydoc: Y.Doc): YSceneParts {
  return { meta: ydoc.getMap('sceneMeta'), nodes: ydoc.getMap('sceneNodes') }
}

/** Vrai tant qu'aucune scène n'a été écrite dans ce `Y.Doc`. */
export function isYSceneEmpty(ydoc: Y.Doc): boolean {
  return ySceneParts(ydoc).meta.get('format') === undefined
}

// --- Écriture ---

/** Remplit un `Y.Doc` vide avec une scène complète. */
export function writeScene(ydoc: Y.Doc, scene: PlanScene, origin?: unknown): void {
  applySceneDiff(ydoc, { nodes: {}, rootNodeIds: [] }, scene, origin, true)
}

/**
 * Écrit dans le `Y.Doc` ce qui a changé entre deux scènes : nœuds ajoutés, supprimés, et seulement
 * les propriétés modifiées des autres. Les nœuds ajoutés par d'autres personnes et pas encore reçus
 * sont laissés en place.
 */
export function applySceneDiff(
  ydoc: Y.Doc,
  previous: PlanScene,
  next: PlanScene,
  origin?: unknown,
  full = false,
): void {
  if (previous === next && !full) return
  ydoc.transact(() => {
    const parts = ySceneParts(ydoc)
    if (parts.meta.get('format') !== SCENE_FORMAT) parts.meta.set('format', SCENE_FORMAT)
    if (full || !sameValue(previous.rootNodeIds, next.rootNodeIds)) parts.meta.set('rootNodeIds', [...next.rootNodeIds])
    for (const [id, node] of Object.entries(next.nodes)) {
      const before = previous.nodes[id]
      if (before === node && parts.nodes.has(id)) continue
      let entry = parts.nodes.get(id)
      if (!entry) {
        entry = new Y.Map<Json>()
        parts.nodes.set(id, entry)
        syncFlatMap(entry, undefined, node)
      } else {
        syncFlatMap(entry, before, node)
      }
    }
    for (const id of Object.keys(previous.nodes)) {
      if (!(id in next.nodes) && parts.nodes.has(id)) parts.nodes.delete(id)
    }
  }, origin)
}

// --- Lecture ---

/**
 * Relit la scène. Avec `previous` et `changedIds`, les nœuds non modifiés gardent le même objet.
 * Retourne `null` si aucune scène n'a encore été écrite.
 */
export function readScene(ydoc: Y.Doc, previous?: PlanScene | null, changedIds?: ReadonlySet<string>): PlanScene | null {
  const parts = ySceneParts(ydoc)
  if (parts.meta.get('format') === undefined) return null
  const nodes: Record<string, SceneNodeData> = {}
  for (const [id, entry] of parts.nodes) {
    const kept = previous && changedIds && !changedIds.has(id) ? previous.nodes[id] : undefined
    nodes[id] = kept ?? (entry.toJSON() as SceneNodeData)
  }
  const rootNodeIds = (parts.meta.get('rootNodeIds') as string[] | undefined) ?? []
  return { nodes, rootNodeIds: previous && sameValue(previous.rootNodeIds, rootNodeIds) ? previous.rootNodeIds : rootNodeIds }
}

/** Identifiants des nœuds touchés par une transaction (pour `readScene`). */
export function changedNodeIdsOf(ydoc: Y.Doc, transaction: Y.Transaction): Set<string> {
  const { nodes } = ySceneParts(ydoc)
  const ids = new Set<string>()
  for (const [type, keys] of transaction.changed) {
    if ((type as unknown) === nodes) {
      for (const key of keys) if (key !== null) ids.add(key)
    } else if ((type.parent as unknown) === nodes) {
      const key = type._item?.parentSub
      if (key) ids.add(key)
    }
  }
  return ids
}

// --- Marque d'enregistrement (même règle que `collab/yDocument.ts`) ---

const SAVED_AT_KEY = 'savedAt'

export function readSceneSavedAt(ydoc: Y.Doc): string | null {
  const value = ySceneParts(ydoc).meta.get(SAVED_AT_KEY)
  return typeof value === 'string' ? value : null
}

/** Note l'heure d'un enregistrement réussi ; ignorée si une heure plus récente est déjà notée. */
export function writeSceneSavedAt(ydoc: Y.Doc, savedAt: string, origin?: unknown): void {
  if (!isLaterThan(savedAt, readSceneSavedAt(ydoc))) return
  ydoc.transact(() => ySceneParts(ydoc).meta.set(SAVED_AT_KEY, savedAt), origin)
}

export function isSceneSavedAtOnly(ydoc: Y.Doc, transaction: Y.Transaction): boolean {
  const { meta } = ySceneParts(ydoc)
  if (transaction.changed.size !== 1) return false
  for (const [type, keys] of transaction.changed) {
    return (type as unknown) === meta && keys.size === 1 && keys.has(SAVED_AT_KEY)
  }
  return false
}
