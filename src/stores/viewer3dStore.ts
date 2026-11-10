import { create } from 'zustand'
import { VIEWER_DEFAULT_WIDTH, clampViewerWidth } from '../features/building/panelWidth'

/** État d'interface de la vue 3D : hors document, hors historique, jamais enregistré. */
interface Viewer3DState {
  open: boolean
  /** Largeur du panneau, en pixels. */
  width: number
  /** Vue « étage ouvert » : seulement jusqu'au niveau actif, sans toit. */
  openFloor: boolean
  toggleOpen: () => void
  setOpen: (open: boolean) => void
  setWidth: (width: number, viewportWidth: number) => void
  setOpenFloor: (openFloor: boolean) => void
}

export const useViewer3DStore = create<Viewer3DState>()((set) => ({
  open: false,
  width: VIEWER_DEFAULT_WIDTH,
  openFloor: false,
  toggleOpen: () => set((state) => ({ open: !state.open })),
  setOpen: (open) => set({ open }),
  setWidth: (width, viewportWidth) => set({ width: clampViewerWidth(width, viewportWidth) }),
  setOpenFloor: (openFloor) => set({ openFloor }),
}))
