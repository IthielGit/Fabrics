import type { CanvasElement } from '../../types/document'

/**
 * Verrouillage des murs : un mur verrouillé reste sélectionnable (on voit ses propriétés et on le
 * déverrouille depuis le plan), mais il ne se déplace pas et ne se supprime pas.
 */

/** Vrai pour un mur verrouillé. */
export function isLockedWall(element: CanvasElement): boolean {
  return element.type === 'wall' && element.locked
}

/**
 * Sépare les éléments à supprimer : `ids` sans les murs verrouillés, et le nombre de murs
 * verrouillés écartés (pour prévenir l'utilisateur).
 */
export function removableIds(
  elements: readonly CanvasElement[],
  ids: readonly string[],
): { ids: string[]; lockedWalls: number } {
  const locked = new Set(elements.filter(isLockedWall).map((el) => el.id))
  const kept = ids.filter((id) => !locked.has(id))
  return { ids: kept, lockedWalls: ids.length - kept.length }
}

/** État de verrouillage d'un ensemble de murs : tous, aucun, ou un mélange. */
export function wallsLockState(walls: readonly CanvasElement[]): 'all' | 'none' | 'mixed' {
  const locked = walls.filter((el) => el.locked).length
  if (locked === 0) return 'none'
  return locked === walls.length ? 'all' : 'mixed'
}

/** Identifiants des murs visibles parmi `elements` (ceux du niveau actif, en pratique). */
export function wallIds(elements: readonly CanvasElement[]): string[] {
  return elements.filter((el) => el.type === 'wall' && !el.hidden).map((el) => el.id)
}
