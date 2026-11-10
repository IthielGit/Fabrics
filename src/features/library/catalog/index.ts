import type { SymbolCategory, SymbolDef } from '../types'
import { defineSymbol } from './define'
import { DRAWS, FALLBACK_DRAW } from './draws'
import { SPECS } from './specs'

/** Catégories dans l'ordre d'affichage du panneau. */
export const CATEGORIES: readonly SymbolCategory[] = [
  'living',
  'dining',
  'bedroom',
  'office',
  'storage',
  'kitchen',
  'bathroom',
  'laundry',
  'stairs',
  'electrical',
  'hvac',
  'safety',
  'outdoor',
  'vehicles',
  'hospitality',
  'health-education',
  'leisure',
  'sets',
]

/** Tous les objets proposés, dans l'ordre du catalogue. */
export const SYMBOLS: readonly SymbolDef[] = SPECS.map((spec) =>
  defineSymbol(spec, DRAWS[spec.id] ?? FALLBACK_DRAW),
)

const BY_ID = new Map(SYMBOLS.map((symbol) => [symbol.id, symbol]))

/** Objet du catalogue par son identifiant, ou `undefined` (identifiant inconnu : projet plus récent). */
export function getSymbol(id: string): SymbolDef | undefined {
  return BY_ID.get(id)
}

export function symbolsOfCategory(category: SymbolCategory): SymbolDef[] {
  return SYMBOLS.filter((symbol) => symbol.category === category)
}
