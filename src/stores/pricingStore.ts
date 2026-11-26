import { create } from 'zustand'
import { LocalPricingRepository } from '../features/pricing/LocalPricingRepository'
import type {
  PriceItem,
  PriceItemFields,
  PriceLibrary,
  WorkItem,
  WorkItemFields,
  WorkspaceSummary,
} from '../features/pricing/model'
import type { LibraryPatch, PricingRepository } from '../features/pricing/repository'
import { SupabasePricingRepository } from '../features/pricing/SupabasePricingRepository'
import { supabase } from '../lib/supabase'

/** Dépôt de la bibliothèque : Supabase quand une personne est connectée, sinon cet appareil. */
export function pricingRepositoryFor(userId: string | null): PricingRepository {
  return supabase && userId ? new SupabasePricingRepository(supabase) : new LocalPricingRepository()
}

const SELECTED_KEY = 'fabrics:pricing:workspace'

function readSelected(): string | null {
  try {
    return localStorage.getItem(SELECTED_KEY)
  } catch {
    return null
  }
}

/** Mémorise l'espace à ouvrir (lien d'invitation rejoint, changement d'espace). */
export function rememberWorkspace(id: string): void {
  try {
    localStorage.setItem(SELECTED_KEY, id)
  } catch {
    // Stockage indisponible (navigation privée) : le choix n'est simplement pas mémorisé.
  }
}

type Status = 'idle' | 'loading' | 'ready' | 'error'

interface PricingState {
  status: Status
  repository: PricingRepository | null
  /** Identifiant de la personne pour laquelle le dépôt a été choisi. */
  userId: string | null
  workspaces: WorkspaceSummary[]
  workspace: WorkspaceSummary | null
  library: PriceLibrary | null
  priceItems: PriceItem[]
  workItems: WorkItem[]

  /** Charge les espaces et la bibliothèque de l'espace choisi. */
  load: (userId: string | null) => Promise<void>
  selectWorkspace: (workspaceId: string) => Promise<void>
  createWorkspace: (name: string) => Promise<void>
  renameWorkspace: (name: string) => Promise<void>
  updateLibrary: (patch: LibraryPatch) => Promise<void>
  /** Change le taux de TVA ; les prix HT tirés d'un TTC sont recalculés et relus. */
  setVatRate: (vatRateBp: number) => Promise<void>
  savePriceItem: (fields: PriceItemFields, id?: string) => Promise<void>
  deletePriceItem: (id: string) => Promise<void>
  saveWorkItem: (fields: WorkItemFields, id?: string) => Promise<void>
  deleteWorkItem: (id: string) => Promise<void>
}

function byCode<T extends { code: string; designation: string }>(a: T, b: T): number {
  return a.code.localeCompare(b.code, 'fr', { numeric: true }) || a.designation.localeCompare(b.designation, 'fr')
}

function upsert<T extends { id: string; code: string; designation: string }>(list: T[], item: T): T[] {
  const others = list.filter((other) => other.id !== item.id)
  return [...others, item].sort(byCode)
}

export const usePricingStore = create<PricingState>((set, get) => {
  /** Lit la bibliothèque d'un espace et ses lignes. */
  const openWorkspace = async (repository: PricingRepository, workspace: WorkspaceSummary) => {
    const library = await repository.getLibrary(workspace.id)
    const [priceItems, workItems] = await Promise.all([
      repository.listPriceItems(library.id),
      repository.listWorkItems(library.id),
    ])
    rememberWorkspace(workspace.id)
    set({
      workspace,
      library,
      priceItems: [...priceItems].sort(byCode),
      workItems: [...workItems].sort(byCode),
      status: 'ready',
    })
  }

  const requireLibrary = () => {
    const { repository, library } = get()
    if (!repository || !library) throw new Error('library not loaded')
    return { repository, library }
  }

  return {
    status: 'idle',
    repository: null,
    userId: null,
    workspaces: [],
    workspace: null,
    library: null,
    priceItems: [],
    workItems: [],

    load: async (userId) => {
      const repository = pricingRepositoryFor(userId)
      set({ status: 'loading', repository, userId, workspace: null, library: null, priceItems: [], workItems: [] })
      try {
        const workspaces = await repository.listWorkspaces()
        set({ workspaces })
        const selected = readSelected()
        const workspace = workspaces.find((ws) => ws.id === selected) ?? workspaces[0]
        if (workspace) await openWorkspace(repository, workspace)
        else set({ status: 'ready' })
      } catch (error) {
        console.error('Bibliothèque de prix :', error)
        set({ status: 'error' })
      }
    },

    selectWorkspace: async (workspaceId) => {
      const { repository, workspaces } = get()
      const workspace = workspaces.find((ws) => ws.id === workspaceId)
      if (!repository || !workspace) return
      set({ status: 'loading' })
      try {
        await openWorkspace(repository, workspace)
      } catch (error) {
        console.error('Bibliothèque de prix :', error)
        set({ status: 'error' })
      }
    },

    createWorkspace: async (name) => {
      const { repository } = get()
      if (!repository) return
      const workspace = await repository.createWorkspace(name)
      set({ workspaces: await repository.listWorkspaces() })
      await openWorkspace(repository, workspace)
    },

    renameWorkspace: async (name) => {
      const { repository, workspace } = get()
      if (!repository || !workspace) return
      await repository.renameWorkspace(workspace.id, name)
      const renamed = { ...workspace, name: name.trim() }
      set((state) => ({
        workspace: renamed,
        workspaces: state.workspaces.map((ws) => (ws.id === renamed.id ? renamed : ws)),
      }))
    },

    updateLibrary: async (patch) => {
      const { repository, library } = requireLibrary()
      await repository.updateLibrary(library.id, patch)
      set({ library: await repository.getLibrary(library.workspaceId) })
    },

    setVatRate: async (vatRateBp) => {
      const { repository, library } = requireLibrary()
      await repository.setVatRate(library.id, vatRateBp)
      const [updated, priceItems] = await Promise.all([
        repository.getLibrary(library.workspaceId),
        repository.listPriceItems(library.id),
      ])
      set({ library: updated, priceItems: [...priceItems].sort(byCode) })
    },

    savePriceItem: async (fields, id) => {
      const { repository, library } = requireLibrary()
      const saved = await repository.savePriceItem(library.id, fields, id)
      set((state) => ({ priceItems: upsert(state.priceItems, saved) }))
    },

    deletePriceItem: async (id) => {
      const { repository } = requireLibrary()
      await repository.deletePriceItem(id)
      set((state) => ({ priceItems: state.priceItems.filter((item) => item.id !== id) }))
    },

    saveWorkItem: async (fields, id) => {
      const { repository, library } = requireLibrary()
      const saved = await repository.saveWorkItem(library.id, fields, id)
      set((state) => ({ workItems: upsert(state.workItems, saved) }))
    },

    deleteWorkItem: async (id) => {
      const { repository } = requireLibrary()
      await repository.deleteWorkItem(id)
      set((state) => ({ workItems: state.workItems.filter((item) => item.id !== id) }))
    },
  }
})
