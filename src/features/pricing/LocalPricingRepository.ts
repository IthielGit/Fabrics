/**
 * Bibliothèque de prix sans compte (mode local) : un seul espace, dont la personne est admin, gardé
 * dans IndexedDB. Les montants restent des `bigint` (IndexedDB les conserve tels quels).
 */
import { get, set } from 'idb-keyval'
import type {
  PriceHistoryEntry,
  PriceItem,
  PriceItemFields,
  PriceLibrary,
  WorkItem,
  WorkItemFields,
  WorkspaceInvite,
  WorkspaceMember,
  WorkspaceSummary,
} from './model'
import { DEFAULT_VAT_BP, htFromTtc } from './money'
import {
  StaleLibraryError,
  type AcceptWorkspaceInviteResult,
  type ApplyImportInput,
  type ImportBatch,
  type LibraryPatch,
  type PricingRepository,
} from './repository'
import type { PricingRule, PricingRuleFields } from './rules'

/** Tout l'état local, enregistré sous une seule clé (lectures et écritures atomiques). */
export interface LocalPricingState {
  workspace: WorkspaceSummary | null
  library: PriceLibrary | null
  priceItems: PriceItem[]
  workItems: WorkItem[]
  history: PriceHistoryEntry[]
  /** Journal des imports (absent des états enregistrés avant 23.2). */
  imports?: ImportBatch[]
  /** Règles de l'espace (absentes des états enregistrés avant 23.3). */
  rules?: PricingRule[]
}

export interface LocalPricingStorage {
  load(): Promise<LocalPricingState | undefined>
  save(state: LocalPricingState): Promise<void>
}

const KEY = 'pricing:local'

export const indexedDbPricingStorage: LocalPricingStorage = {
  load: () => get<LocalPricingState>(KEY),
  save: (state) => set(KEY, state),
}

/** Stockage en mémoire (tests). */
export function memoryPricingStorage(): LocalPricingStorage {
  let state: LocalPricingState | undefined
  return {
    load: async () => (state ? structuredClone(state) : undefined),
    save: async (next) => {
      state = structuredClone(next)
    },
  }
}

const EMPTY: LocalPricingState = { workspace: null, library: null, priceItems: [], workItems: [], history: [] }

/** Adresse affichée comme auteur des modifications en mode local. */
const LOCAL_AUTHOR = 'Moi (cet appareil)'

export class LocalPricingRepository implements PricingRepository {
  readonly shared = false

  private readonly storage: LocalPricingStorage
  private readonly now: () => string
  private readonly newId: () => string

  constructor(
    storage: LocalPricingStorage = indexedDbPricingStorage,
    now: () => string = () => new Date().toISOString(),
    newId: () => string = () => crypto.randomUUID(),
  ) {
    this.storage = storage
    this.now = now
    this.newId = newId
  }

  private async read(): Promise<LocalPricingState> {
    return (await this.storage.load()) ?? structuredClone(EMPTY)
  }

  private async update<T>(change: (state: LocalPricingState) => T): Promise<T> {
    const state = await this.read()
    const result = change(state)
    await this.storage.save(state)
    return result
  }

  async listWorkspaces(): Promise<WorkspaceSummary[]> {
    const { workspace } = await this.read()
    return workspace ? [workspace] : []
  }

  async createWorkspace(name: string): Promise<WorkspaceSummary> {
    return this.update((state) => {
      if (state.workspace) return state.workspace
      const workspace: WorkspaceSummary = { id: this.newId(), name: name.trim(), role: 'admin' }
      state.workspace = workspace
      state.library = {
        id: this.newId(),
        workspaceId: workspace.id,
        name: 'Bibliothèque de prix',
        version: 1,
        currency: 'MGA',
        vatRateBp: DEFAULT_VAT_BP,
        priceDate: null,
        updatedAt: this.now(),
      }
      return workspace
    })
  }

  async renameWorkspace(workspaceId: string, name: string): Promise<void> {
    await this.update((state) => {
      if (state.workspace?.id === workspaceId) state.workspace.name = name.trim()
    })
  }

  async getLibrary(workspaceId: string): Promise<PriceLibrary> {
    const { library } = await this.read()
    if (!library || library.workspaceId !== workspaceId) throw new Error('library not found')
    return library
  }

  async updateLibrary(libraryId: string, patch: LibraryPatch): Promise<void> {
    await this.update((state) => {
      if (!state.library || state.library.id !== libraryId) throw new Error('library not found')
      state.library = { ...state.library, ...definedOnly(patch), updatedAt: this.now() }
    })
  }

  async setVatRate(libraryId: string, vatRateBp: number): Promise<void> {
    await this.update((state) => {
      if (!state.library || state.library.id !== libraryId) throw new Error('library not found')
      state.library = { ...state.library, vatRateBp, updatedAt: this.now() }
      state.priceItems = state.priceItems.map((item) => {
        if (item.libraryId !== libraryId || item.sourceBasis !== 'ttc_delivered' || item.sourcePrice === null) return item
        if (item.vatExempt) return item
        const next = { ...item, priceHt: htFromTtc(item.sourcePrice, vatRateBp) }
        this.record(state, item, next)
        return next
      })
    })
  }

  async listPriceItems(libraryId: string): Promise<PriceItem[]> {
    const { priceItems } = await this.read()
    return priceItems.filter((item) => item.libraryId === libraryId)
  }

  async savePriceItem(libraryId: string, fields: PriceItemFields, id?: string): Promise<PriceItem> {
    return this.update((state) => {
      const saved: PriceItem = {
        ...fields,
        id: id ?? this.newId(),
        libraryId,
        updatedByEmail: LOCAL_AUTHOR,
        updatedAt: this.now(),
      }
      const index = state.priceItems.findIndex((item) => item.id === saved.id)
      const previous = index >= 0 ? state.priceItems[index] : null
      if (previous) state.priceItems[index] = saved
      else state.priceItems.push(saved)
      this.record(state, previous, saved)
      return saved
    })
  }

  async deletePriceItem(id: string): Promise<void> {
    await this.update((state) => {
      const previous = state.priceItems.find((item) => item.id === id)
      if (!previous) return
      state.priceItems = state.priceItems.filter((item) => item.id !== id)
      this.record(state, previous, null)
    })
  }

  async listWorkItems(libraryId: string): Promise<WorkItem[]> {
    const { workItems } = await this.read()
    return workItems.filter((item) => item.libraryId === libraryId)
  }

  async saveWorkItem(libraryId: string, fields: WorkItemFields, id?: string): Promise<WorkItem> {
    return this.update((state) => {
      const saved: WorkItem = {
        ...fields,
        id: id ?? this.newId(),
        libraryId,
        updatedByEmail: LOCAL_AUTHOR,
        updatedAt: this.now(),
      }
      const index = state.workItems.findIndex((item) => item.id === saved.id)
      const previous = index >= 0 ? state.workItems[index] : null
      if (previous) state.workItems[index] = saved
      else state.workItems.push(saved)
      this.record(state, previous, saved)
      return saved
    })
  }

  async deleteWorkItem(id: string): Promise<void> {
    await this.update((state) => {
      const previous = state.workItems.find((item) => item.id === id)
      if (!previous) return
      state.workItems = state.workItems.filter((item) => item.id !== id)
      this.record(state, previous, null)
      state.rules = (state.rules ?? []).map((rule) => (rule.workItemId === id ? { ...rule, workItemId: null } : rule))
    })
  }

  async listRules(libraryId: string): Promise<PricingRule[]> {
    const { rules } = await this.read()
    return (rules ?? []).filter((rule) => rule.libraryId === libraryId).sort((a, b) => a.position - b.position)
  }

  async saveRule(libraryId: string, fields: PricingRuleFields, id?: string): Promise<PricingRule> {
    return this.update((state) => {
      const saved: PricingRule = {
        ...fields,
        name: fields.name.trim(),
        id: id ?? this.newId(),
        libraryId,
        updatedByEmail: LOCAL_AUTHOR,
        updatedAt: this.now(),
      }
      const rules = state.rules ?? []
      state.rules = rules.some((rule) => rule.id === saved.id)
        ? rules.map((rule) => (rule.id === saved.id ? saved : rule))
        : [...rules, saved]
      return saved
    })
  }

  async deleteRule(id: string): Promise<void> {
    await this.update((state) => {
      state.rules = (state.rules ?? []).filter((rule) => rule.id !== id)
    })
  }

  async applyImport(libraryId: string, input: ApplyImportInput): Promise<number> {
    return this.update((state) => {
      const library = state.library
      if (!library || library.id !== libraryId) throw new Error('library not found')
      if (library.version !== input.expectedVersion) throw new StaleLibraryError()
      const { plan } = input
      const stamp = { updatedByEmail: LOCAL_AUTHOR, updatedAt: this.now() }
      // Retraits (jamais une ligne saisie à la main), mises à jour, ajouts : même ordre que la base.
      const removePrice = new Set(plan.price.remove)
      for (const item of state.priceItems) {
        if (removePrice.has(item.id) && item.sourceKey !== '') this.record(state, item, null)
      }
      state.priceItems = state.priceItems.filter((item) => !(removePrice.has(item.id) && item.sourceKey !== ''))
      const removeWork = new Set(plan.work.remove)
      for (const item of state.workItems) {
        if (removeWork.has(item.id) && item.sourceKey !== '') this.record(state, item, null)
      }
      state.workItems = state.workItems.filter((item) => !(removeWork.has(item.id) && item.sourceKey !== ''))
      state.rules = (state.rules ?? []).map((rule) =>
        rule.workItemId && removeWork.has(rule.workItemId) ? { ...rule, workItemId: null } : rule,
      )
      for (const { id, fields } of plan.price.update) {
        const index = state.priceItems.findIndex((item) => item.id === id)
        if (index < 0) continue
        const next: PriceItem = { ...fields, id, libraryId, ...stamp }
        this.record(state, state.priceItems[index], next)
        state.priceItems[index] = next
      }
      for (const { id, fields } of plan.work.update) {
        const index = state.workItems.findIndex((item) => item.id === id)
        if (index < 0) continue
        const next: WorkItem = { ...fields, id, libraryId, ...stamp }
        this.record(state, state.workItems[index], next)
        state.workItems[index] = next
      }
      for (const fields of plan.price.insert) {
        const next: PriceItem = { ...fields, id: this.newId(), libraryId, ...stamp }
        state.priceItems.push(next)
        this.record(state, null, next)
      }
      for (const fields of plan.work.insert) {
        const next: WorkItem = { ...fields, id: this.newId(), libraryId, ...stamp }
        state.workItems.push(next)
        this.record(state, null, next)
      }
      const version = library.version + 1
      state.library = { ...library, version, priceDate: input.priceDate ?? library.priceDate, updatedAt: stamp.updatedAt }
      state.imports = [
        {
          id: this.newId(),
          version,
          fileName: input.fileName,
          sha256: input.sha256,
          importedByEmail: LOCAL_AUTHOR,
          importedAt: stamp.updatedAt,
          summary: input.summary,
        },
        ...(state.imports ?? []),
      ]
      return version
    })
  }

  async listImports(libraryId: string): Promise<ImportBatch[]> {
    const { library, imports } = await this.read()
    return library?.id === libraryId ? (imports ?? []) : []
  }

  async listHistory(itemId: string): Promise<PriceHistoryEntry[]> {
    const { history } = await this.read()
    return history.filter((entry) => entry.itemId === itemId).reverse()
  }

  /** Même règle que le déclencheur `price_rows_history` de Supabase. */
  private record(
    state: LocalPricingState,
    previous: PriceItem | WorkItem | null,
    next: PriceItem | WorkItem | null,
  ): void {
    const subject = next ?? previous
    if (!subject) return
    if (
      previous &&
      next &&
      previous.priceHt === next.priceHt &&
      previous.designation === next.designation &&
      previous.code === next.code &&
      previous.unit === next.unit
    ) {
      return
    }
    state.history.push({
      id: this.newId(),
      itemId: subject.id,
      code: subject.code,
      designation: subject.designation,
      action: previous && next ? 'update' : next ? 'insert' : 'delete',
      oldPriceHt: previous?.priceHt ?? null,
      newPriceHt: next?.priceHt ?? null,
      changedByEmail: LOCAL_AUTHOR,
      changedAt: this.now(),
    })
  }

  // Sans compte, l'espace n'est pas partagé : pas de membres ni d'invitations.
  async listMembers(): Promise<WorkspaceMember[]> {
    return []
  }
  async listInvites(): Promise<WorkspaceInvite[]> {
    return []
  }
  async createInvite(): Promise<WorkspaceInvite> {
    throw new Error('sharing requires an account')
  }
  async setInviteActive(): Promise<void> {
    throw new Error('sharing requires an account')
  }
  async acceptInvite(): Promise<AcceptWorkspaceInviteResult> {
    return { status: 'unavailable' }
  }
  async setMemberRole(): Promise<void> {
    throw new Error('sharing requires an account')
  }
  async removeMember(): Promise<void> {
    throw new Error('sharing requires an account')
  }
}

function definedOnly<T extends object>(patch: T): Partial<T> {
  return Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined)) as Partial<T>
}
