import type { SymbolCategory, SymbolDef } from '../types'
import { BEDROOM_SYMBOLS } from './bedroom'
import { DINING_SYMBOLS } from './dining'
import { LIVING_SYMBOLS } from './living'

/** Tous les objets du catalogue, dans l'ordre d'affichage. Chaque catégorie a son fichier. */
export const SYMBOLS: readonly SymbolDef[] = [
  ...LIVING_SYMBOLS,
  ...DINING_SYMBOLS,
  ...BEDROOM_SYMBOLS,
]

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

const BY_ID = new Map(SYMBOLS.map((symbol) => [symbol.id, symbol]))

/** Objet du catalogue par son identifiant, ou `undefined` (identifiant inconnu : projet plus récent). */
export function getSymbol(id: string): SymbolDef | undefined {
  return BY_ID.get(id)
}

export function symbolsOfCategory(category: SymbolCategory): SymbolDef[] {
  return SYMBOLS.filter((symbol) => symbol.category === category)
}
