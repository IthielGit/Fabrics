/** Recherche dans la bibliothèque de prix : chaque mot doit apparaître (sans tenir compte des accents). */

function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

export interface Searchable {
  code: string
  designation: string
  category: string
  supplier?: string
}

export function matchesQuery(item: Searchable, query: string): boolean {
  const words = fold(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) return true
  const haystack = fold(`${item.code} ${item.designation} ${item.category} ${item.supplier ?? ''}`)
  return words.every((word) => haystack.includes(word))
}

/** Lignes qui correspondent, au plus `limit` affichées (une grande liste reste fluide). */
export function searchItems<T extends Searchable>(items: readonly T[], query: string, limit: number) {
  const matches = items.filter((item) => matchesQuery(item, query))
  return { shown: matches.slice(0, limit), matchCount: matches.length }
}
