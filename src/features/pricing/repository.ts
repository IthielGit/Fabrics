/**
 * Accès à la bibliothèque de prix (M23, 23.1) : une version Supabase (espaces partagés, RLS) et une
 * version locale (mode sans compte : un seul espace, dont la personne est admin).
 */
import type {
  PriceHistoryEntry,
  PriceItem,
  PriceItemFields,
  PriceLibrary,
  WorkItem,
  WorkItemFields,
  WorkspaceInvite,
  WorkspaceMember,
  WorkspaceRole,
  WorkspaceSummary,
} from './model'
import type { ImportPlan, ImportSummary } from './importPlan'
import type { PricingRule, PricingRuleFields } from './rules'
import type {
  EstimateVersion,
  FreezeInput,
  OutlineLine,
  ProjectEstimatePatch,
  ProjectEstimateRecord,
} from './estimateVersions'

export type AcceptWorkspaceInviteResult =
  | { status: 'ok'; workspaceId: string; role: WorkspaceRole }
  | { status: 'unavailable' }

/** Un import appliqué (journal des imports). */
export interface ImportBatch {
  id: string
  version: number
  fileName: string
  sha256: string
  importedByEmail: string
  importedAt: string
  summary: Partial<ImportSummary>
}

export interface ApplyImportInput {
  /** Version lue avant de calculer le plan ; l'import est refusé si elle a changé entre-temps. */
  expectedVersion: number
  priceDate: string | null
  fileName: string
  sha256: string
  summary: ImportSummary
  plan: ImportPlan
}

export interface LibraryPatch {
  name?: string
  priceDate?: string | null
}

export interface PricingRepository {
  /** Vrai si les espaces se partagent (membres, invitations) : Supabase seulement. */
  readonly shared: boolean

  listWorkspaces(): Promise<WorkspaceSummary[]>
  createWorkspace(name: string): Promise<WorkspaceSummary>
  renameWorkspace(workspaceId: string, name: string): Promise<void>

  getLibrary(workspaceId: string): Promise<PriceLibrary>
  updateLibrary(libraryId: string, patch: LibraryPatch): Promise<void>
  /**
   * Change le taux de TVA et recalcule le prix HT de chaque ligne saisie en TTC (D23-10), en une seule
   * opération.
   */
  setVatRate(libraryId: string, vatRateBp: number): Promise<void>

  listPriceItems(libraryId: string): Promise<PriceItem[]>
  /** Ajoute (`id` absent) ou modifie une ligne ; renvoie la ligne enregistrée. */
  savePriceItem(libraryId: string, fields: PriceItemFields, id?: string): Promise<PriceItem>
  deletePriceItem(id: string): Promise<void>

  listWorkItems(libraryId: string): Promise<WorkItem[]>
  saveWorkItem(libraryId: string, fields: WorkItemFields, id?: string): Promise<WorkItem>
  deleteWorkItem(id: string): Promise<void>

  /** Règles de l'espace (élément → postes, D23-15), dans leur ordre d'application. */
  listRules(libraryId: string): Promise<PricingRule[]>
  saveRule(libraryId: string, fields: PricingRuleFields, id?: string): Promise<PricingRule>
  deleteRule(id: string): Promise<void>

  /** Devis d'un projet dans cette bibliothèque ; `null` s'il n'existe pas encore. */
  getProjectEstimate(libraryId: string, projectId: string): Promise<ProjectEstimateRecord | null>
  saveProjectEstimate(libraryId: string, projectId: string, patch: ProjectEstimatePatch, id?: string): Promise<ProjectEstimateRecord>
  /** Versions figées d'un devis, la plus récente d'abord. */
  listEstimateVersions(estimateId: string): Promise<EstimateVersion[]>
  /** Fige une version (jamais modifiée ensuite). Refus nommé si « définitif » avec un poste sans prix. */
  freezeEstimateVersion(estimateId: string, input: FreezeInput): Promise<EstimateVersion>
  /** Résumé sans prix de la dernière version d'un projet, pour une personne hors de l'espace (D23-8). */
  projectEstimateOutline(projectId: string): Promise<OutlineLine[]>

  /** Applique un import d'un bloc ; renvoie la nouvelle version de la bibliothèque. */
  applyImport(libraryId: string, input: ApplyImportInput): Promise<number>
  /** Imports de la bibliothèque, le plus récent d'abord. */
  listImports(libraryId: string): Promise<ImportBatch[]>

  /** Historique d'une ligne, le plus récent d'abord. */
  listHistory(itemId: string): Promise<PriceHistoryEntry[]>

  listMembers(workspaceId: string): Promise<WorkspaceMember[]>
  listInvites(workspaceId: string): Promise<WorkspaceInvite[]>
  createInvite(workspaceId: string, role: WorkspaceRole): Promise<WorkspaceInvite>
  setInviteActive(inviteId: string, active: boolean): Promise<void>
  acceptInvite(token: string): Promise<AcceptWorkspaceInviteResult>
  setMemberRole(workspaceId: string, userId: string, role: WorkspaceRole): Promise<void>
  /** Retire un membre, ou quitte l'espace si `userId` est la personne connectée. */
  removeMember(workspaceId: string, userId: string): Promise<void>
}

/** La bibliothèque a changé entre la lecture du fichier et l'application de l'import. */
export class StaleLibraryError extends Error {
  constructor() {
    super('stale version')
    this.name = 'StaleLibraryError'
  }
}

/** Erreur nommée renvoyée par la base : il doit toujours rester un admin dans l'espace. */
export class LastAdminError extends Error {
  constructor() {
    super('last admin')
    this.name = 'LastAdminError'
  }
}
