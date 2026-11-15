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
  /** Position de ma souris dans le document, `null` hors du canevas ; publiée par `useCollaboration`. */
  localCursor: PresenceCursor | null
  setStatus: (status: CollabStatus) => void
  setActive: (active: boolean) => void
  setHistory: (canUndo: boolean, canRedo: boolean) => void
  setPeers: (peers: Peer[]) => void
  setLocalCursor: (cursor: PresenceCursor | null) => void
  reset: () => void
}

export const useCollabStore = create<CollabState>((set) => ({
  status: 'off',
  active: false,
  canUndo: false,
  canRedo: false,
  peers: [],
  localCursor: null,
  setStatus: (status) => set({ status }),
  setActive: (active) => set({ active }),
  setHistory: (canUndo, canRedo) => set({ canUndo, canRedo }),
  setPeers: (peers) => set({ peers }),
  setLocalCursor: (localCursor) => set({ localCursor }),
  reset: () => set({ status: 'off', active: false, canUndo: false, canRedo: false, peers: [], localCursor: null }),
}))
