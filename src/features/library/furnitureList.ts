import type { CanvasElement } from '../../types/document'
import { CATEGORIES, getSymbol } from './catalog'
import type { SymbolCategory } from './types'

/** Famille d'un objet dans la liste : mobilier réel, symbole conventionnel (non à l'échelle) ou zone de référence. */
export type FurnitureKind = 'furniture' | 'nominal' | 'zone'

export interface FurnitureGroup {
  symbol: string
  /** Catégorie du catalogue, ou `null` pour un objet inconnu (projet plus récent). */
  category: SymbolCategory | null
  kind: FurnitureKind
  width: number
  depth: number
  count: number
}

/**
 * Objets de la bibliothèque posés sur le plan, regroupés par objet et par taille : un lit 160 × 200
 * posé trois fois donne une ligne « 3 ». Ils ne comptent dans aucun métré (surfaces, longueurs).
 * Tri : ordre des catégories du catalogue, puis identifiant, puis taille.
 */
export function groupFurniture(elements: readonly CanvasElement[]): FurnitureGroup[] {
  const groups = new Map<string, FurnitureGroup>()
  for (const element of elements) {
    if (element.type !== 'furniture') continue
    const def = getSymbol(element.symbol)
    const key = `${element.symbol}|${element.width}|${element.depth}`
    const existing = groups.get(key)
    if (existing) {
      existing.count += 1
      continue
    }
    groups.set(key, {
      symbol: element.symbol,
      category: def?.category ?? null,
      kind: def?.zone ? 'zone' : def?.nominal ? 'nominal' : 'furniture',
      width: element.width,
      depth: element.depth,
      count: 1,
    })
  }
  const rank = (group: FurnitureGroup) => (group.category === null ? CATEGORIES.length : CATEGORIES.indexOf(group.category))
  return [...groups.values()].sort(
    (a, b) =>
      rank(a) - rank(b) ||
      a.symbol.localeCompare(b.symbol) ||
      a.width - b.width ||
      a.depth - b.depth,
  )
}
