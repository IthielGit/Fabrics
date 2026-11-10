import type { SymbolDef } from './types'

/** Textes d'un objet utilisés par la recherche (fournis par `src/i18n/fr.ts`). */
export interface SymbolSearchText {
  name: string
  keywords: readonly string[]
  /** Intitulé de la catégorie de l'objet. */
  category: string
}

/**
 * Texte comparable : sans accents, en minuscules, avec les tirets, apostrophes et autres signes
 * remplacés par des espaces (« Lave-vaisselle » → « lave vaisselle »).
 */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Points d'un mot de la recherche : nom (début > contenu), mot-clé, catégorie. `0` = pas de résultat. */
function scoreToken(token: string, name: string, keywords: readonly string[], category: string): number {
  if (name.split(' ').some((word) => word.startsWith(token))) return name.startsWith(token) ? 4 : 3
  if (name.includes(token)) return 2
  if (keywords.some((keyword) => keyword.includes(token))) return 2
  if (category.includes(token)) return 1
  return 0
}

/**
 * Objets qui correspondent à la recherche, les plus pertinents d'abord (à pertinence égale,
 * l'ordre du catalogue est gardé). Tous les mots saisis doivent être trouvés (nom, mots-clés ou
 * catégorie), sans tenir compte des accents ni de la casse. Une recherche vide renvoie tout.
 */
export function searchSymbols(
  symbols: readonly SymbolDef[],
  query: string,
  textOf: (symbol: SymbolDef) => SymbolSearchText,
): SymbolDef[] {
  const tokens = normalizeText(query).split(' ').filter(Boolean)
  if (tokens.length === 0) return [...symbols]

  const scored: { symbol: SymbolDef; score: number; index: number }[] = []
  symbols.forEach((symbol, index) => {
    const text = textOf(symbol)
    const name = normalizeText(text.name)
    const keywords = text.keywords.map(normalizeText)
    const category = normalizeText(text.category)
    let total = 0
    for (const token of tokens) {
      const score = scoreToken(token, name, keywords, category)
      if (score === 0) return
      total += score
    }
    scored.push({ symbol, score: total, index })
  })
  return scored.sort((a, b) => b.score - a.score || a.index - b.index).map((entry) => entry.symbol)
}
