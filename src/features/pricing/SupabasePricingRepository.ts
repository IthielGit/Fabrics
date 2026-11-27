/**
 * Bibliothèque de prix dans Supabase (M23, 23.1). Les règles d'accès sont dans la base (RLS,
 * `supabase/m23-pricing.sql`) : lecture par les membres présents, écriture par les admins.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { PriceItemFields, WorkItemFields, WorkspaceRole } from './model'
import type { PricingRuleFields } from './rules'
import {
  canFinalize,
  EstimateNotFinalError,
  type FreezeInput,
  type OutlineLine,
  type ProjectEstimatePatch,
} from './estimateVersions'
import {
  LastAdminError,
  StaleLibraryError,
  type ApplyImportInput,
  type ImportBatch,
  type LibraryPatch,
  type PricingRepository,
} from './repository'
import {
  parseAcceptWorkspaceInvite,
  priceItemToRow,
  rowToHistory,
  rowToImportBatch,
  rowToRule,
  rowToEstimate,
  rowToEstimateVersion,
  ruleToRow,
  rowToInvite,
  rowToLibrary,
  rowToMember,
  rowToPriceItem,
  rowToWorkItem,
  rowToWorkspace,
  workItemToRow,
  type HistoryRow,
  type ImportBatchRow,
  type PricingRuleRow,
  type EstimateRow,
  type EstimateVersionRow,
  type InviteRow,
  type LibraryRow,
  type MemberRow,
  type PriceItemRow,
  type WorkItemRow,
  type WorkspaceRow,
} from './rows'

const LIBRARY_COLUMNS = 'id, workspace_id, name, version, currency, vat_rate_bp, price_date, updated_at'
const ITEM_COLUMNS =
  'id, library_id, kind, code, category, designation, unit, source_basis, source_price, vat_exempt, price_ht, supplier, region, effective_date, details, source_row, source_key, updated_by_email, updated_at'
const WORK_COLUMNS =
  'id, library_id, code, category, designation, unit, price_ht, reference_price, source_coefficient, output, components, source_row, source_key, updated_by_email, updated_at'
const HISTORY_COLUMNS =
  'id, item_id, code, designation, action, old_price_ht, new_price_ht, changed_by_email, changed_at'
const RULE_COLUMNS =
  'id, library_id, name, quantity_code, filter, work_item_id, waste_bp, enabled, position, updated_by_email, updated_at'
const ESTIMATE_COLUMNS = 'id, library_id, project_id, a1_bp, a2_bp, a3_bp, overrides, updated_by_email, updated_at'
const INVITE_COLUMNS = 'id, workspace_id, token, role, active, expires_at, created_at'

/** Supabase renvoie au plus 1 000 lignes par requête : on lit par pages. */
const PAGE = 1000

function rethrow(error: { message?: string } | null): void {
  if (!error) return
  if (error.message?.includes('last admin')) throw new LastAdminError()
  if (error.message?.includes('stale version')) throw new StaleLibraryError()
  throw error
}

export class SupabasePricingRepository implements PricingRepository {
  readonly shared = true

  private readonly client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  async listWorkspaces() {
    const { data, error } = await this.client.rpc('my_workspaces')
    rethrow(error)
    return ((data ?? []) as WorkspaceRow[]).map(rowToWorkspace)
  }

  async createWorkspace(name: string) {
    const { data, error } = await this.client.rpc('create_workspace', { p_name: name.trim() })
    rethrow(error)
    return rowToWorkspace(data as WorkspaceRow)
  }

  async renameWorkspace(workspaceId: string, name: string) {
    const { error } = await this.client.from('workspaces').update({ name: name.trim() }).eq('id', workspaceId)
    rethrow(error)
  }

  async getLibrary(workspaceId: string) {
    const { data, error } = await this.client
      .from('price_libraries')
      .select(LIBRARY_COLUMNS)
      .eq('workspace_id', workspaceId)
      .single()
    rethrow(error)
    return rowToLibrary(data as LibraryRow)
  }

  async updateLibrary(libraryId: string, patch: LibraryPatch) {
    const row: Record<string, unknown> = {}
    if (patch.name !== undefined) row.name = patch.name.trim()
    if (patch.priceDate !== undefined) row.price_date = patch.priceDate
    const { error } = await this.client.from('price_libraries').update(row).eq('id', libraryId)
    rethrow(error)
  }

  async setVatRate(libraryId: string, vatRateBp: number) {
    const { error } = await this.client.rpc('set_library_vat_rate', {
      p_library_id: libraryId,
      p_vat_rate_bp: vatRateBp,
    })
    rethrow(error)
  }

  private async readAll<T>(table: string, columns: string, libraryId: string): Promise<T[]> {
    const rows: T[] = []
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await this.client
        .from(table)
        .select(columns)
        .eq('library_id', libraryId)
        .order('code')
        .order('id')
        .range(from, from + PAGE - 1)
      rethrow(error)
      const page = (data ?? []) as T[]
      rows.push(...page)
      if (page.length < PAGE) return rows
    }
  }

  async listPriceItems(libraryId: string) {
    return (await this.readAll<PriceItemRow>('price_items', ITEM_COLUMNS, libraryId)).map(rowToPriceItem)
  }

  async savePriceItem(libraryId: string, fields: PriceItemFields, id?: string) {
    const row = priceItemToRow(libraryId, fields)
    const query = id
      ? this.client.from('price_items').update(row).eq('id', id)
      : this.client.from('price_items').insert(row)
    const { data, error } = await query.select(ITEM_COLUMNS).single()
    rethrow(error)
    return rowToPriceItem(data as unknown as PriceItemRow)
  }

  async deletePriceItem(id: string) {
    const { error } = await this.client.from('price_items').delete().eq('id', id)
    rethrow(error)
  }

  async listWorkItems(libraryId: string) {
    return (await this.readAll<WorkItemRow>('work_items', WORK_COLUMNS, libraryId)).map(rowToWorkItem)
  }

  async saveWorkItem(libraryId: string, fields: WorkItemFields, id?: string) {
    const row = workItemToRow(libraryId, fields)
    const query = id
      ? this.client.from('work_items').update(row).eq('id', id)
      : this.client.from('work_items').insert(row)
    const { data, error } = await query.select(WORK_COLUMNS).single()
    rethrow(error)
    return rowToWorkItem(data as unknown as WorkItemRow)
  }

  async deleteWorkItem(id: string) {
    const { error } = await this.client.from('work_items').delete().eq('id', id)
    rethrow(error)
  }

  async listRules(libraryId: string) {
    const { data, error } = await this.client
      .from('pricing_rules')
      .select(RULE_COLUMNS)
      .eq('library_id', libraryId)
      .order('position')
      .order('id')
    rethrow(error)
    return ((data ?? []) as PricingRuleRow[]).map(rowToRule)
  }

  async saveRule(libraryId: string, fields: PricingRuleFields, id?: string) {
    const row = ruleToRow(libraryId, fields)
    const query = id
      ? this.client.from('pricing_rules').update(row).eq('id', id)
      : this.client.from('pricing_rules').insert(row)
    const { data, error } = await query.select(RULE_COLUMNS).single()
    rethrow(error)
    return rowToRule(data as unknown as PricingRuleRow)
  }

  async deleteRule(id: string) {
    const { error } = await this.client.from('pricing_rules').delete().eq('id', id)
    rethrow(error)
  }

  async getProjectEstimate(libraryId: string, projectId: string) {
    const { data, error } = await this.client
      .from('estimates')
      .select(ESTIMATE_COLUMNS)
      .eq('library_id', libraryId)
      .eq('project_id', projectId)
      .maybeSingle()
    rethrow(error)
    return data ? rowToEstimate(data as unknown as EstimateRow) : null
  }

  async saveProjectEstimate(libraryId: string, projectId: string, patch: ProjectEstimatePatch, id?: string) {
    const row = { a1_bp: patch.a1Bp, a2_bp: patch.a2Bp, a3_bp: patch.a3Bp, overrides: patch.overrides }
    const query = id
      ? this.client.from('estimates').update(row).eq('id', id)
      : this.client.from('estimates').insert({ ...row, library_id: libraryId, project_id: projectId })
    const { data, error } = await query.select(ESTIMATE_COLUMNS).single()
    rethrow(error)
    return rowToEstimate(data as unknown as EstimateRow)
  }

  async listEstimateVersions(estimateId: string) {
    const { data, error } = await this.client
      .from('estimate_versions')
      .select('id, number, status, library_version, fingerprint, snapshot, created_by_email, created_at, note')
      .eq('estimate_id', estimateId)
      .order('number', { ascending: false })
    rethrow(error)
    return ((data ?? []) as EstimateVersionRow[]).map(rowToEstimateVersion)
  }

  async freezeEstimateVersion(estimateId: string, input: FreezeInput) {
    if (input.status === 'final' && !canFinalize(input.snapshot)) throw new EstimateNotFinalError()
    const { data, error } = await this.client.rpc('freeze_estimate_version', {
      p_estimate_id: estimateId,
      p_status: input.status,
      p_library_version: input.libraryVersion,
      p_fingerprint: input.fingerprint,
      p_snapshot: input.snapshot,
      p_note: input.note,
    })
    rethrow(error)
    return rowToEstimateVersion(data as EstimateVersionRow)
  }

  async projectEstimateOutline(projectId: string): Promise<OutlineLine[]> {
    const { data, error } = await this.client.rpc('project_estimate_outline', { p_project_id: projectId })
    rethrow(error)
    return (data ?? []) as OutlineLine[]
  }

  async applyImport(libraryId: string, input: ApplyImportInput) {
    const { plan } = input
    const { data, error } = await this.client.rpc('apply_price_import', {
      p_library_id: libraryId,
      p_expected_version: input.expectedVersion,
      p_price_date: input.priceDate,
      p_file_name: input.fileName,
      p_sha256: input.sha256,
      p_summary: input.summary,
      p_price_insert: plan.price.insert.map((fields) => priceItemToRow(libraryId, fields)),
      p_price_update: plan.price.update.map(({ id, fields }) => ({ id, ...priceItemToRow(libraryId, fields) })),
      p_price_delete: plan.price.remove,
      p_work_insert: plan.work.insert.map((fields) => workItemToRow(libraryId, fields)),
      p_work_update: plan.work.update.map(({ id, fields }) => ({ id, ...workItemToRow(libraryId, fields) })),
      p_work_delete: plan.work.remove,
    })
    rethrow(error)
    return Number(data)
  }

  async listImports(libraryId: string): Promise<ImportBatch[]> {
    const { data, error } = await this.client
      .from('price_import_batches')
      .select('id, version, file_name, sha256, imported_by_email, imported_at, summary')
      .eq('library_id', libraryId)
      .order('imported_at', { ascending: false })
    rethrow(error)
    return ((data ?? []) as ImportBatchRow[]).map(rowToImportBatch)
  }

  async listHistory(itemId: string) {
    const { data, error } = await this.client
      .from('price_history')
      .select(HISTORY_COLUMNS)
      .eq('item_id', itemId)
      .order('changed_at', { ascending: false })
      .order('id', { ascending: false })
    rethrow(error)
    return ((data ?? []) as HistoryRow[]).map(rowToHistory)
  }

  async listMembers(workspaceId: string) {
    const { data, error } = await this.client
      .from('workspace_members')
      .select('user_id, email, role, joined_at')
      .eq('workspace_id', workspaceId)
      .order('joined_at')
    rethrow(error)
    return ((data ?? []) as MemberRow[]).map(rowToMember)
  }

  async listInvites(workspaceId: string) {
    const { data, error } = await this.client
      .from('workspace_invites')
      .select(INVITE_COLUMNS)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
    rethrow(error)
    return ((data ?? []) as InviteRow[]).map(rowToInvite)
  }

  async createInvite(workspaceId: string, role: WorkspaceRole) {
    const { data, error } = await this.client.rpc('create_workspace_invite', {
      p_workspace_id: workspaceId,
      p_role: role,
    })
    rethrow(error)
    return rowToInvite(data as InviteRow)
  }

  async setInviteActive(inviteId: string, active: boolean) {
    const { error } = await this.client.from('workspace_invites').update({ active }).eq('id', inviteId)
    rethrow(error)
  }

  async acceptInvite(token: string) {
    const { data, error } = await this.client.rpc('accept_workspace_invite', { p_token: token })
    rethrow(error)
    return parseAcceptWorkspaceInvite(data)
  }

  async setMemberRole(workspaceId: string, userId: string, role: WorkspaceRole) {
    const { error } = await this.client.rpc('set_workspace_member_role', {
      p_workspace_id: workspaceId,
      p_user_id: userId,
      p_role: role,
    })
    rethrow(error)
  }

  async removeMember(workspaceId: string, userId: string) {
    const { error } = await this.client.rpc('remove_workspace_member', {
      p_workspace_id: workspaceId,
      p_user_id: userId,
    })
    rethrow(error)
  }
}
