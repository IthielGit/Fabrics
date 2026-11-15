// Représentation d'un document Fabrics dans un `Y.Doc` (M14, lot D). Fonctions pures, testées.
//
// Structure (voir docs/02-ARCHITECTURE.md, « Liaison Yjs et éditeur ») :
//   meta        Y.Map    version, unit, savedAt (heure serveur du dernier enregistrement dans Supabase)
//   page        Y.Map    une clé par propriété de la page
//   plan        Y.Map    une clé par réglage du plan (vide = pas de réglages, projet Visuel)
//   order       Y.Array  identifiants des éléments (ordre d'affichage)
//   elements    Y.Map    identifiant → Y.Map (une clé par propriété de l'élément)
//   levelOrder  Y.Array  identifiants des niveaux (ordre du document)
//   levels      Y.Map    identifiant → Y.Map (une clé par propriété du niveau)
//
// Les valeurs sont des valeurs JSON « atomiques » : une liste comme `points` est remplacée en entier.
// Deux personnes qui modifient deux propriétés différentes d'un même élément ne s'écrasent pas.

import * as Y from 'yjs'
import type { CanvasElement, FabricsDocument, Level } from '../../types/document'

interface Identified {
  id: string
}

type Json = unknown

export interface YDocumentParts {
  meta: Y.Map<Json>
  page: Y.Map<Json>
  plan: Y.Map<Json>
  order: Y.Array<string>
  elements: Y.Map<Y.Map<Json>>
  levelOrder: Y.Array<string>
  levels: Y.Map<Y.Map<Json>>
}

export function yParts(ydoc: Y.Doc): YDocumentParts {
  return {
    meta: ydoc.getMap('meta'),
    page: ydoc.getMap('page'),
    plan: ydoc.getMap('plan'),
    order: ydoc.getArray('order'),
    elements: ydoc.getMap('elements'),
    levelOrder: ydoc.getArray('levelOrder'),
    levels: ydoc.getMap('levels'),
  }
}

/** Vrai tant que personne n'a encore écrit de document dans ce `Y.Doc`. */
export function isYDocumentEmpty(ydoc: Y.Doc): boolean {
  return yParts(ydoc).meta.get('version') === undefined
}

// ---------------------------------------------------------------------------
// Marque d'enregistrement (lot F)
// ---------------------------------------------------------------------------

const SAVED_AT_KEY = 'savedAt'

/** Heure (serveur Supabase) du dernier enregistrement connu de la salle ; `null` si jamais notée. */
export function readSavedAt(ydoc: Y.Doc): string | null {
  const value = yParts(ydoc).meta.get(SAVED_AT_KEY)
  return typeof value === 'string' ? value : null
}

/** Note l'heure d'un enregistrement réussi ; ignorée si une heure plus récente est déjà notée. */
export function writeSavedAt(ydoc: Y.Doc, savedAt: string, origin?: unknown): void {
  if (!isLaterThan(savedAt, readSavedAt(ydoc))) return
  ydoc.transact(() => yParts(ydoc).meta.set(SAVED_AT_KEY, savedAt), origin)
}

/** Vrai si la transaction ne touche que la marque d'enregistrement (rien à afficher ni à enregistrer). */
export function isSavedAtOnly(ydoc: Y.Doc, transaction: Y.Transaction): boolean {
  const { meta } = yParts(ydoc)
  if (transaction.changed.size !== 1) return false
  for (const [type, keys] of transaction.changed) {
    return (type as unknown) === meta && keys.size === 1 && keys.has(SAVED_AT_KEY)
  }
  return false
}

/** `a` est strictement plus récente que `b` (dates ISO). Une date absente ou illisible n'est jamais plus récente. */
export function isLaterThan(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a) return false
  const left = Date.parse(a)
  if (Number.isNaN(left)) return false
  if (!b) return true
  const right = Date.parse(b)
  return Number.isNaN(right) ? true : left > right
}

// ---------------------------------------------------------------------------
// Écriture
// ---------------------------------------------------------------------------

/** Remplit un `Y.Doc` vide avec un document complet (premier arrivé sur le projet). */
export function writeDocument(ydoc: Y.Doc, document: FabricsDocument, origin?: unknown): void {
  ydoc.transact(() => {
    const parts = yParts(ydoc)
    parts.meta.set('version', document.version)
    parts.meta.set('unit', document.unit)
    syncFlatMap(parts.page, undefined, document.page)
    syncFlatMap(parts.plan, undefined, document.plan)
    syncCollection(parts.order, parts.elements, [], document.elements)
    syncCollection(parts.levelOrder, parts.levels, [], document.levels ?? [])
  }, origin)
}

/**
 * Écrit dans le `Y.Doc` ce qui a changé entre `previous` et `next` (modification locale).
 * Seules les propriétés modifiées sont écrites ; les ajouts et suppressions faits par d'autres
 * personnes et pas encore reçus par l'éditeur sont laissés en place.
 */
export function applyDocumentDiff(
  ydoc: Y.Doc,
  previous: FabricsDocument,
  next: FabricsDocument,
  origin?: unknown,
): void {
  if (previous === next) return
  ydoc.transact(() => {
    const parts = yParts(ydoc)
    if (previous.version !== next.version) parts.meta.set('version', next.version)
    if (previous.unit !== next.unit) parts.meta.set('unit', next.unit)
    if (previous.page !== next.page) syncFlatMap(parts.page, previous.page, next.page)
    if (previous.plan !== next.plan) syncFlatMap(parts.plan, previous.plan, next.plan)
    if (previous.elements !== next.elements) {
      syncCollection(parts.order, parts.elements, previous.elements, next.elements)
    }
    if (previous.levels !== next.levels) {
      syncCollection(parts.levelOrder, parts.levels, previous.levels ?? [], next.levels ?? [])
    }
  }, origin)
}

/** Écrit les clés d'un objet « plat » (une valeur JSON par clé) qui diffèrent de `previous`. */
function syncFlatMap(map: Y.Map<Json>, previous: object | undefined, next: object | undefined): void {
  const before = (previous ?? {}) as Record<string, Json>
  const after = (next ?? {}) as Record<string, Json>
  for (const [key, value] of Object.entries(after)) {
    if (value === undefined) {
      if (map.has(key)) map.delete(key)
    } else if (!sameValue(before[key], value) || !map.has(key)) {
      map.set(key, value)
    }
  }
  for (const key of Object.keys(before)) {
    if (!(key in after) && map.has(key)) map.delete(key)
  }
}

function sameValue(a: Json, b: Json): boolean {
  if (a === b) return true
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false
  return JSON.stringify(a) === JSON.stringify(b)
}

/** Synchronise une liste ordonnée d'objets identifiés (éléments ou niveaux). */
function syncCollection(
  order: Y.Array<string>,
  map: Y.Map<Y.Map<Json>>,
  previous: readonly Identified[],
  next: readonly Identified[],
): void {
  const previousById = new Map(previous.map((item) => [item.id, item]))
  const nextIds = new Set(next.map((item) => item.id))

  // 1. Propriétés : on n'écrit que les objets nouveaux ou modifiés.
  for (const item of next) {
    const before = previousById.get(item.id)
    if (before === item && map.has(item.id)) continue
    let entry = map.get(item.id)
    if (!entry) {
      entry = new Y.Map<Json>()
      map.set(item.id, entry)
      syncFlatMap(entry, undefined, item)
    } else {
      syncFlatMap(entry, before, item)
    }
  }

  // 2. Suppressions : seulement ce que l'éditeur a vraiment retiré.
  const removed = new Set(previous.filter((item) => !nextIds.has(item.id)).map((item) => item.id))
  for (const id of removed) map.delete(id)

  // 3. Ordre.
  syncOrder(order, removed, next.map((item) => item.id))
}

/**
 * Met l'ordre du `Y.Array` en accord avec `target` en touchant le moins d'entrées possible :
 * les identifiants retirés et les doublons sont supprimés, la plus longue suite déjà dans le bon
 * ordre est gardée, les autres identifiants (nouveaux ou déplacés) sont réinsérés à leur place.
 * Les identifiants inconnus de l'éditeur (ajoutés par une autre personne) restent où ils sont.
 */
function syncOrder(order: Y.Array<string>, removed: ReadonlySet<string>, target: readonly string[]): void {
  const current = order.toArray()
  const targetIndex = new Map(target.map((id, index) => [id, index]))

  // Première occurrence de chaque identifiant de la cible présent dans le tableau.
  const seen = new Set<string>()
  const candidates: { position: number; rank: number }[] = []
  const toDelete = new Set<number>()
  current.forEach((id, position) => {
    if (removed.has(id) && !targetIndex.has(id)) {
      toDelete.add(position)
      return
    }
    if (seen.has(id)) {
      toDelete.add(position) // doublon (deux personnes ont créé le même projet en même temps)
      return
    }
    seen.add(id)
    const rank = targetIndex.get(id)
    if (rank !== undefined) candidates.push({ position, rank })
  })

  const kept = longestIncreasing(candidates.map((candidate) => candidate.rank))
  const keptRanks = new Set(kept.map((index) => candidates[index].rank))
  for (const candidate of candidates) {
    if (!keptRanks.has(candidate.rank)) toDelete.add(candidate.position)
  }

  // Suppressions de la fin vers le début (les positions restent valables).
  const positions = [...toDelete].sort((a, b) => b - a)
  for (const position of positions) order.delete(position, 1)

  // Insertions : chaque identifiant manquant se place juste après l'identifiant de la cible qui le précède.
  const mirror = order.toArray()
  let cursor = 0
  for (const id of target) {
    if (keptRanks.has(targetIndex.get(id) as number)) {
      cursor = mirror.indexOf(id, cursor) + 1
      continue
    }
    order.insert(cursor, [id])
    mirror.splice(cursor, 0, id)
    cursor += 1
  }
}

/** Indices (dans `values`) d'une plus longue sous-suite strictement croissante. */
export function longestIncreasing(values: readonly number[]): number[] {
  const tails: number[] = [] // indice de la plus petite fin pour chaque longueur
  const parent: number[] = new Array<number>(values.length).fill(-1)
  values.forEach((value, index) => {
    let low = 0
    let high = tails.length
    while (low < high) {
      const middle = (low + high) >> 1
      if (values[tails[middle]] < value) low = middle + 1
      else high = middle
    }
    if (low > 0) parent[index] = tails[low - 1]
    tails[low] = index
  })
  const result: number[] = []
  let index = tails.length > 0 ? tails[tails.length - 1] : -1
  while (index !== -1) {
    result.push(index)
    index = parent[index]
  }
  return result.reverse()
}

// ---------------------------------------------------------------------------
// Lecture
// ---------------------------------------------------------------------------

/**
 * Relit le document complet. `previous` et `changedIds` permettent de garder les mêmes objets
 * pour les éléments et niveaux non modifiés (affichage plus rapide, comparaison par référence).
 * Retourne `null` si le `Y.Doc` est encore vide.
 */
export function readDocument(
  ydoc: Y.Doc,
  previous?: FabricsDocument | null,
  changedIds?: ReadonlySet<string>,
): FabricsDocument | null {
  const parts = yParts(ydoc)
  if (parts.meta.get('version') === undefined) return null
  const reuse = previous && changedIds ? previous : null

  const plan = parts.plan.size > 0 ? (parts.plan.toJSON() as FabricsDocument['plan']) : undefined
  const page = parts.page.toJSON() as FabricsDocument['page']
  const levels = readCollection<Level>(parts.levelOrder, parts.levels, reuse?.levels ?? [], changedIds)
  const elements = readCollection<CanvasElement>(parts.order, parts.elements, reuse?.elements ?? [], changedIds)
  const document: FabricsDocument = {
    version: parts.meta.get('version') as FabricsDocument['version'],
    unit: parts.meta.get('unit') as FabricsDocument['unit'],
    page: previous && sameValue(previous.page, page) ? previous.page : page,
    elements: previous && sameList(previous.elements, elements) ? previous.elements : elements,
  }
  if (plan) document.plan = previous?.plan && sameValue(previous.plan, plan) ? previous.plan : plan
  if (parts.levelOrder.length > 0) {
    document.levels = previous?.levels && sameList(previous.levels, levels) ? previous.levels : levels
  }
  return document
}

/** Mêmes objets dans le même ordre. */
function sameList<T>(a: readonly T[], b: readonly T[]): boolean {
  return a.length === b.length && a.every((item, index) => item === b[index])
}

function readCollection<T extends Identified>(
  order: Y.Array<string>,
  map: Y.Map<Y.Map<Json>>,
  previous: readonly T[],
  changedIds?: ReadonlySet<string>,
): T[] {
  const previousById = new Map(previous.map((item) => [item.id, item]))
  const seen = new Set<string>()
  const result: T[] = []
  for (const id of order) {
    if (seen.has(id)) continue
    seen.add(id)
    const entry = map.get(id)
    if (!entry) continue // supprimé par quelqu'un pendant qu'une autre personne le déplaçait
    const kept = changedIds && !changedIds.has(id) ? previousById.get(id) : undefined
    result.push(kept ?? (entry.toJSON() as T))
  }
  return result
}

/**
 * Identifiants d'éléments ou de niveaux touchés par une transaction Yjs (pour `readDocument`).
 */
export function changedIdsOf(ydoc: Y.Doc, transaction: Y.Transaction): Set<string> {
  const parts = yParts(ydoc)
  const ids = new Set<string>()
  const containers = new Set<unknown>([parts.elements, parts.levels])
  for (const [type, keys] of transaction.changed) {
    if (containers.has(type)) {
      for (const key of keys) if (key !== null) ids.add(key)
    } else if (containers.has(type.parent)) {
      const key = type._item?.parentSub
      if (key) ids.add(key)
    }
  }
  return ids
}
