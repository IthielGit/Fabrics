import { create } from 'zustand'
import type { Peer, PresenceCursor } from '../features/collab/presence'

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
  /** Les autres connexions ouvertes sur ce projet (lot E). */
  peers: Peer[]
  /** Vrai si c'est à moi d'enregistrer les modifications des autres (lot F) ; vrai aussi sans collaboration. */
  saveLeader: boolean
  /** Compteur des reconnexions réussies après une coupure (lot F) : déclenche un enregistrement. */
  reconnections: number
  /** Position de ma souris dans le document, `null` hors du canevas ; publiée par `useCollaboration`. */
  localCursor: PresenceCursor | null
  setStatus: (status: CollabStatus) => void
  setActive: (active: boolean) => void
  setHistory: (canUndo: boolean, canRedo: boolean) => void
  setPeers: (peers: Peer[]) => void
  setLocalCursor: (cursor: PresenceCursor | null) => void
  setSaveLeader: (saveLeader: boolean) => void
  markReconnected: () => void
  reset: () => void
}

export const useCollabStore = create<CollabState>((set) => ({
  status: 'off',
  active: false,
  canUndo: false,
  canRedo: false,
  peers: [],
  saveLeader: true,
  reconnections: 0,
  localCursor: null,
  setStatus: (status) => set({ status }),
  setActive: (active) => set({ active }),
  setHistory: (canUndo, canRedo) => set({ canUndo, canRedo }),
  setPeers: (peers) => set({ peers }),
  setLocalCursor: (localCursor) => set({ localCursor }),
  setSaveLeader: (saveLeader) => set({ saveLeader }),
  markReconnected: () => set((state) => ({ reconnections: state.reconnections + 1 })),
  reset: () =>
    set({
      status: 'off',
      active: false,
      canUndo: false,
      canRedo: false,
      peers: [],
      saveLeader: true,
      localCursor: null,
    }),
}))
