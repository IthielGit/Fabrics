import { create } from 'zustand'
import type { SheetTab } from '../features/sheets/sheetViews'
import type { DimensioningMode } from '../features/dimensioning/types'
import type { VisibilityKey } from '../features/building/views/graphicStyles'

/** Onglets de l'écran « Vues » : une feuille du jeu (M20 20.7, `features/sheets/sheetViews.ts`). */
export type ViewsTab = SheetTab

/** État d'interface de l'écran « Vues » : hors document, hors historique, jamais enregistré. */
interface ViewsState {
  open: boolean
  tab: ViewsTab
  openViews: () => void
  closeViews: () => void
  setTab: (tab: ViewsTab) => void
  /** Cotation du plan de chaque niveau sur la planche (identifiant du niveau → réglage) ; absent : aucune. */
  sheetDimensioning: Record<string, DimensioningMode>
  setSheetDimensioning: (levelId: string, mode: DimensioningMode) => void
  /** Surfaces de toiture sur le plan de toiture (D20-10 : seulement sur demande) ; non par défaut. */
  roofAreas: boolean
  setRoofAreas: (on: boolean) => void
  /** Catégories masquées sur les plans et leurs PDF (M20 20.5) ; tout est visible par défaut. */
  hidden: VisibilityKey[]
  toggleHidden: (key: VisibilityKey) => void
}

export const useViewsStore = create<ViewsState>()((set) => ({
  open: false,
  tab: { kind: 'elevation', cardinal: 'N' },
  openViews: () => set({ open: true }),
  closeViews: () => set({ open: false }),
  setTab: (tab) => set({ tab }),
  sheetDimensioning: {},
  setSheetDimensioning: (levelId, mode) =>
    set((state) => ({ sheetDimensioning: { ...state.sheetDimensioning, [levelId]: mode } })),
  roofAreas: false,
  setRoofAreas: (on) => set({ roofAreas: on }),
  hidden: [],
  toggleHidden: (key) =>
    set((state) => ({ hidden: state.hidden.includes(key) ? state.hidden.filter((k) => k !== key) : [...state.hidden, key] })),
}))
