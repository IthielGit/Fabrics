import { create } from 'zustand'
import type { Cardinal } from '../features/building/north'
import type { DimensioningMode } from '../features/dimensioning/types'

/** Onglets de l'écran « Vues » : le plan d'un niveau, le plan de toiture d'un niveau, une façade, une coupe (par son identifiant) ou la planche. */
export type ViewsTab =
  | { kind: 'level'; levelId: string }
  | { kind: 'roof'; levelId: string }
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
  /** Cotation du plan de chaque niveau sur la planche (identifiant du niveau → réglage) ; absent : aucune. */
  sheetDimensioning: Record<string, DimensioningMode>
  setSheetDimensioning: (levelId: string, mode: DimensioningMode) => void
  /** Surfaces de toiture sur le plan de toiture (D20-10 : seulement sur demande) ; non par défaut. */
  roofAreas: boolean
  setRoofAreas: (on: boolean) => void
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
}))
