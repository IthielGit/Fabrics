import { create } from 'zustand'
import { parseIdList, pushRecent, toggleFavorite } from '../../features/library/prefs'

const RECENTS_KEY = 'fabrics.library.recents'
const FAVORITES_KEY = 'fabrics.library.favorites'

function read(key: string): string[] {
  try {
    return parseIdList(window.localStorage.getItem(key))
  } catch {
    return [] // stockage indisponible (navigation privée, accès refusé)
  }
}

function write(key: string, ids: readonly string[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(ids))
  } catch {
    // Pas grave : les préférences ne survivront pas au rechargement.
  }
}

interface LibraryPrefs {
  recents: string[]
  favorites: string[]
  /** Note qu'un objet vient d'être posé (alimente « Récents »). */
  addRecent: (id: string) => void
  toggleFavorite: (id: string) => void
}

/** Récents et favoris de la bibliothèque : propres au navigateur, jamais enregistrés dans le projet. */
export const useLibraryPrefs = create<LibraryPrefs>()((set, get) => ({
  recents: read(RECENTS_KEY),
  favorites: read(FAVORITES_KEY),
  addRecent: (id) => {
    const recents = pushRecent(get().recents, id)
    write(RECENTS_KEY, recents)
    set({ recents })
  },
  toggleFavorite: (id) => {
    const favorites = toggleFavorite(get().favorites, id)
    write(FAVORITES_KEY, favorites)
    set({ favorites })
  },
}))
