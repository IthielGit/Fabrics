import { create } from 'zustand'

/**
 * État de la collaboration temps réel (M14) pour le projet ouvert.
 * `off` : pas de collaboration (mode local, serveur non configuré, projet non ouvert).
 */
export type CollabStatus = 'off' | 'connecting' | 'live' | 'offline'

interface CollabState {
  status: CollabStatus
  /** Vrai une fois la première synchronisation faite : annuler / rétablir passe alors par la collaboration. */
  active: boolean
  canUndo: boolean
  canRedo: boolean
  setStatus: (status: CollabStatus) => void
  setActive: (active: boolean) => void
  setHistory: (canUndo: boolean, canRedo: boolean) => void
  reset: () => void
}

export const useCollabStore = create<CollabState>((set) => ({
  status: 'off',
  active: false,
  canUndo: false,
  canRedo: false,
  setStatus: (status) => set({ status }),
  setActive: (active) => set({ active }),
  setHistory: (canUndo, canRedo) => set({ canUndo, canRedo }),
  reset: () => set({ status: 'off', active: false, canUndo: false, canRedo: false }),
}))
