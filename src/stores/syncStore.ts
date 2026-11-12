import { create } from 'zustand'

interface SyncState {
  /** Projets et images gardés sur cet appareil, en attente d'être envoyés au compte (réseau coupé). */
  pending: number
  setPending: (count: number) => void
}

export const useSyncStore = create<SyncState>((set) => ({
  pending: 0,
  setPending: (pending) => set({ pending }),
}))
