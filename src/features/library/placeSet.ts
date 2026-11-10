import type { FurnitureElement } from '../../types/document'
import { createFurnitureElement } from '../documents/elements'
import type { SetDef } from './catalog/sets'

/**
 * Objets à créer pour poser un ensemble : chacun est placé relativement au coin haut-gauche
 * `origin` de l'ensemble. `nameOf` donne le nom de base d'un objet ; `existing` compte les objets
 * déjà posés par identifiant, pour numéroter les noms (« Chaise 3 »).
 */
export function elementsForSet(
  set: SetDef,
  origin: { x: number; y: number },
  nameOf: (symbol: string) => string,
  existing: ReadonlyMap<string, number> = new Map(),
): FurnitureElement[] {
  const counts = new Map(existing)
  return set.members.map((member) => {
    const count = (counts.get(member.symbol) ?? 0) + 1
    counts.set(member.symbol, count)
    const element = createFurnitureElement(
      `${nameOf(member.symbol)} ${count}`,
      member.symbol,
      origin.x + member.x,
      origin.y + member.y,
      member.width,
      member.depth,
    )
    return {
      ...element,
      rotation: member.rotation,
      ...(member.mirrored ? { mirrored: true } : {}),
    }
  })
}
