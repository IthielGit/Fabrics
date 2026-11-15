import { create } from 'zustand'

/**
 * Boussole du plan (M15 bis, lot C) : une petite fenêtre ouverte depuis « N 0° » dans la barre
 * d'état, fermée au clic ailleurs ou avec Échap. Fermée à l'ouverture d'un projet.
 */
interface CompassState {
  visible: boolean
  toggle: () => void
  setVisible: (visible: boolean) => void
}

export const useCompassStore = create<CompassState>((set, get) => ({
  visible: false,
  toggle: () => set({ visible: !get().visible }),
  setVisible: (visible) => set({ visible }),
}))
