import { create } from 'zustand'
import type { VersionChanges } from '../features/versions/versionDiff'

/**
 * Aperçu d'une version (M15, lot C) : les changements à surligner sur le plan. `null` hors de la
 * page d'aperçu (l'éditeur n'affiche alors rien de plus).
 */
interface VersionPreviewState {
  changes: VersionChanges | null
  setChanges: (changes: VersionChanges | null) => void
}

export const useVersionPreviewStore = create<VersionPreviewState>((set) => ({
  changes: null,
  setChanges: (changes) => set({ changes }),
}))
