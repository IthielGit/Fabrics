import { create } from 'zustand'

const STORAGE_KEY = 'fabrics.minimap'

/** Préférence mémorisée dans le navigateur (jamais dans le projet) ; affichée par défaut. */
function readVisible(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'hidden'
  } catch {
    return true // stockage indisponible (navigation privée…) : on garde le défaut
  }
}

interface MinimapState {
  visible: boolean
  toggle: () => void
}

export const useMinimapStore = create<MinimapState>((set, get) => ({
  visible: readVisible(),
  toggle: () => {
    const visible = !get().visible
    try {
      localStorage.setItem(STORAGE_KEY, visible ? 'shown' : 'hidden')
    } catch {
      // sans stockage, le choix ne vaut que pour cette session
    }
    set({ visible })
  },
}))
