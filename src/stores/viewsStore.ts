import { create } from 'zustand'
import type { Cardinal } from '../features/building/north'

/** Onglets de l'écran « Vues » : une façade, une coupe (par son identifiant) ou la planche. */
export type ViewsTab =
  | { kind: 'elevation'; cardinal: Cardinal }
  | { kind: 'section'; sectionId: string }
  | { kind: 'sheet' }

/** État d'interface de l'écran « Vues » : hors document, hors historique, jamais enregistré. */
interface ViewsState {
  open: boolean
  tab: ViewsTab
  openViews: () => void
  closeViews: () => void
  setTab: (tab: ViewsTab) => void
}

export const useViewsStore = create<ViewsState>()((set) => ({
  open: false,
  tab: { kind: 'elevation', cardinal: 'N' },
  openViews: () => set({ open: true }),
  closeViews: () => set({ open: false }),
  setTab: (tab) => set({ tab }),
}))
