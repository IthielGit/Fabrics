/**
 * Bibliothèque de prix dans Supabase (M23, 23.1). Les règles d'accès sont dans la base (RLS,
 * `supabase/m23-pricing.sql`) : lecture par les membres présents, écriture par les admins.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { PriceItemFields, WorkItemFields, WorkspaceRole } from './model'
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
  rowToInvite,
  rowToLibrary,
  rowToMember,
  rowToPriceItem,
  rowToWorkItem,
  rowToWorkspace,
  workItemToRow,
  type HistoryRow,
  type ImportBatchRow,
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
