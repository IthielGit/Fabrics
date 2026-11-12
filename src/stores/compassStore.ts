import { create } from 'zustand'

const STORAGE_KEY = 'fabrics.compass'

/** Préférence mémorisée dans le navigateur (jamais dans le projet) ; masquée par défaut (à la demande). */
function readVisible(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'shown'
  } catch {
    return false // stockage indisponible (navigation privée…) : on garde le défaut
  }
}

interface CompassState {
  visible: boolean
  toggle: () => void
}

export const useCompassStore = create<CompassState>((set, get) => ({
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
