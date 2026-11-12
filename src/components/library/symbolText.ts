import type { SymbolSearchText } from '../../features/library/search'
import type { SymbolCategory } from '../../features/library/types'
import { getUserSet } from '../../features/library/userRegistry'
import { fr } from '../../i18n/fr'

/** Nom français d'un objet du catalogue (son identifiant si le texte manque). */
export function symbolName(id: string): string {
  return getUserSet(id)?.name ?? fr.library.symbols[id]?.name ?? id
}

/** Intitulé français d'une catégorie. */
export function categoryName(category: string): string {
  return fr.library.categories[category] ?? category
}

/** Textes de recherche d'un objet : nom, mots-clés, catégorie. */
export function symbolSearchText(symbol: { id: string; category: SymbolCategory }): SymbolSearchText {
  return {
    name: symbolName(symbol.id),
    keywords: fr.library.symbols[symbol.id]?.keywords ?? [],
    category: categoryName(symbol.category),
  }
}
