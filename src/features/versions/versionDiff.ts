// Changements entre deux versions d'un document (M15, lot C). Fonctions pures, testées.
// Comparaison par identifiant d'élément : ajouté, modifié (une propriété au moins diffère), supprimé.

import type { CanvasElement, FabricsDocument } from '../../types/document'

export interface VersionChanges {
  added: ReadonlySet<string>
  modified: ReadonlySet<string>
  /** Éléments présents avant et absents ensuite : on les montre « en fantôme ». */
  removed: readonly CanvasElement[]
}

/** Couleurs des changements sur le plan et dans la légende du bandeau d'aperçu. */
export const CHANGE_COLORS = { added: '#059669', modified: '#d97706', removed: '#dc2626' } as const

export const NO_CHANGES: VersionChanges = { added: new Set(), modified: new Set(), removed: [] }

/** Égalité de valeurs JSON, sans tenir compte de l'ordre des clés (la base peut les réordonner). */
export function sameJson(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => sameJson(item, b[index]))
  }
  const left = a as Record<string, unknown>
  const right = b as Record<string, unknown>
  // Une clé absente et une clé `undefined` sont équivalentes (le JSON ne garde pas les `undefined`).
  const keys = new Set([...Object.keys(left), ...Object.keys(right)])
  for (const key of keys) if (!sameJson(left[key], right[key])) return false
  return true
}

/**
 * Ce qui a changé de `before` à `after`. Sans version précédente (`before` nul, première version du
 * projet), rien n'est marqué : tout serait « ajouté », ce qui n'apprend rien.
 */
export function diffVersions(before: FabricsDocument | null, after: FabricsDocument): VersionChanges {
  if (!before) return NO_CHANGES
  const previous = new Map(before.elements.map((element) => [element.id, element]))
  const current = new Set<string>()
  const added = new Set<string>()
  const modified = new Set<string>()
  for (const element of after.elements) {
    current.add(element.id)
    const old = previous.get(element.id)
    if (!old) added.add(element.id)
    else if (!sameJson(old, element)) modified.add(element.id)
  }
  const removed = before.elements.filter((element) => !current.has(element.id))
  return { added, modified, removed }
}

/** Nombre d'éléments ajoutés, modifiés, supprimés. */
export function countChanges(changes: VersionChanges): { added: number; modified: number; removed: number } {
  return { added: changes.added.size, modified: changes.modified.size, removed: changes.removed.length }
}
