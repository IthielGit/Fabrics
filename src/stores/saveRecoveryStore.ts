import { create } from 'zustand'
import type { SaveErrorReason } from '../features/persistence/rescue'
import type { Project } from '../types/document'

/** Enregistrement refusé en cours (M24, 24.3, D24-8) : raison, projet non enregistré, relance. */
interface SaveRecoveryState {
  reason: SaveErrorReason | null
  failed: Project | null
  retry: (() => Promise<void>) | null
  setFailure: (reason: SaveErrorReason, failed: Project, retry: () => Promise<void>) => void
  clear: () => void
}

export const useSaveRecoveryStore = create<SaveRecoveryState>((set) => ({
  reason: null,
  failed: null,
  retry: null,
  setFailure: (reason, failed, retry) => set({ reason, failed, retry }),
  clear: () => set({ reason: null, failed: null, retry: null }),
}))
