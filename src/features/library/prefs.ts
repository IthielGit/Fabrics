/** Nombre maximal d'objets gardés dans « Récents ». */
export const MAX_RECENTS = 12

/** Ajoute `id` en tête des récents (sans doublon), en gardant au plus `MAX_RECENTS` objets. */
export function pushRecent(recents: readonly string[], id: string, max = MAX_RECENTS): string[] {
  return [id, ...recents.filter((existing) => existing !== id)].slice(0, max)
}

/** Ajoute ou retire `id` des favoris (les plus récemment ajoutés en tête). */
export function toggleFavorite(favorites: readonly string[], id: string): string[] {
  return favorites.includes(id) ? favorites.filter((existing) => existing !== id) : [id, ...favorites]
}

/** Lit une liste d'identifiants enregistrée (JSON) ; toute valeur invalide donne une liste vide. */
export function parseIdList(raw: string | null): string[] {
  if (raw === null) return []
  try {
    const value: unknown = JSON.parse(raw)
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}
