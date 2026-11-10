import type { SymbolSearchText } from '../../features/library/search'
import type { SymbolDef } from '../../features/library/types'
import { fr } from '../../i18n/fr'

/** Nom français d'un objet du catalogue (son identifiant si le texte manque). */
export function symbolName(id: string): string {
  return fr.library.symbols[id]?.name ?? id
}

/** Intitulé français d'une catégorie. */
export function categoryName(category: string): string {
  return fr.library.categories[category] ?? category
}

/** Textes de recherche d'un objet : nom, mots-clés, catégorie. */
export function symbolSearchText(symbol: SymbolDef): SymbolSearchText {
  return {
    name: symbolName(symbol.id),
    keywords: fr.library.symbols[symbol.id]?.keywords ?? [],
    category: categoryName(symbol.category),
  }
}
