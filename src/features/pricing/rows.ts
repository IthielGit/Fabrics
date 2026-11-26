/**
 * Conversion entre les lignes Supabase (`supabase/m23-pricing.sql`) et le modèle (M23, 23.1).
 * Les montants passent en texte vers la base et sont relus en `bigint` : jamais de flottant.
 */
import {
  isPriceKind,
  isWorkspaceRole,
  type ComponentGroup,
  type HistoryAction,
  type PriceHistoryEntry,
  type PriceItem,
  type PriceItemFields,
  type PriceLibrary,
  type WorkComponent,
  type WorkItem,
  type WorkItemFields,
  type WorkspaceInvite,
  type WorkspaceMember,
  type WorkspaceSummary,
} from './model'
import { tenthsFromStored, tenthsToText } from './money'

export interface WorkspaceRow {
  id: string
  name: string
  role: string
}

export function rowToWorkspace(row: WorkspaceRow): WorkspaceSummary {
  // Rôle inattendu : lecture seule, par prudence.
  return { id: row.id, name: row.name, role: isWorkspaceRole(row.role) ? row.role : 'member' }
}

export interface MemberRow {
  user_id: string
  email: string
  role: string
  joined_at: string
}

export function rowToMember(row: MemberRow): WorkspaceMember {
  return {
    userId: row.user_id,
    email: row.email,
    role: isWorkspaceRole(row.role) ? row.role : 'member',
    joinedAt: row.joined_at,
  }
}

export interface InviteRow {
  id: string
  workspace_id: string
  token: string
  role: string
  active: boolean
  expires_at: string | null
  created_at: string
}

export function rowToInvite(row: InviteRow): WorkspaceInvite {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    token: row.token,
    role: isWorkspaceRole(row.role) ? row.role : 'member',
    active: row.active,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  }
}

export interface LibraryRow {
  id: string
  workspace_id: string
  name: string
  version: number
  currency: string
  vat_rate_bp: number
  price_date: string | null
  updated_at: string
}

export function rowToLibrary(row: LibraryRow): PriceLibrary {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    version: row.version,
    currency: 'MGA',
    vatRateBp: row.vat_rate_bp,
    priceDate: row.price_date,
    updatedAt: row.updated_at,
  }
}

export interface PriceItemRow {
  id: string
  library_id: string
  kind: string
  code: string
  category: string
  designation: string
  unit: string
  source_basis: string
  source_price: number | string | null
  price_ht: number | string | null
  supplier: string
  region: string
  effective_date: string | null
  details: Record<string, unknown> | null
  source_row: string
  updated_by_email: string
  updated_at: string
}

function stringRecord(value: Record<string, unknown> | null): Record<string, string> {
  if (!value) return {}
  return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, String(v)]))
}

export function rowToPriceItem(row: PriceItemRow): PriceItem {
  if (!isPriceKind(row.kind)) throw new Error(`unknown price kind: ${row.kind}`)
  return {
    id: row.id,
    libraryId: row.library_id,
    kind: row.kind,
    code: row.code,
    category: row.category,
    designation: row.designation,
    unit: row.unit,
    sourceBasis: row.source_basis === 'ttc_delivered' ? 'ttc_delivered' : 'ht',
    sourcePrice: tenthsFromStored(row.source_price),
    priceHt: tenthsFromStored(row.price_ht),
    supplier: row.supplier,
    region: row.region,
    effectiveDate: row.effective_date,
    details: stringRecord(row.details),
    sourceRow: row.source_row,
    updatedByEmail: row.updated_by_email,
    updatedAt: row.updated_at,
  }
}

/** Colonnes écrites par le navigateur (l'espace, l'auteur et la date sont posés par la base). */
export function priceItemToRow(libraryId: string, fields: PriceItemFields) {
  return {
    library_id: libraryId,
    kind: fields.kind,
    code: fields.code.trim(),
    category: fields.category.trim(),
    designation: fields.designation.trim(),
    unit: fields.unit.trim(),
    source_basis: fields.sourceBasis,
    source_price: tenthsToText(fields.sourcePrice),
    price_ht: tenthsToText(fields.priceHt),
    supplier: fields.supplier.trim(),
    region: fields.region.trim(),
    effective_date: fields.effectiveDate,
    details: fields.details,
    source_row: fields.sourceRow,
  }
}

const GROUPS: readonly ComponentGroup[] = ['equipment', 'material', 'labour', 'other']

function componentFromJson(value: unknown): WorkComponent {
  const raw = (value ?? {}) as Record<string, unknown>
  const group = GROUPS.includes(raw.group as ComponentGroup) ? (raw.group as ComponentGroup) : 'other'
  return {
    group,
    designation: String(raw.designation ?? ''),
    unit: String(raw.unit ?? ''),
    quantity: String(raw.quantity ?? '0'),
    unitPriceHt: tenthsFromStored(raw.unitPriceHt ?? '0') ?? 0n,
    amountHt: tenthsFromStored(raw.amountHt ?? '0') ?? 0n,
  }
}

export function componentToJson(component: WorkComponent) {
  return {
    group: component.group,
    designation: component.designation,
    unit: component.unit,
    quantity: component.quantity,
    unitPriceHt: component.unitPriceHt.toString(),
    amountHt: component.amountHt.toString(),
  }
}

export interface WorkItemRow {
  id: string
  library_id: string
  code: string
  category: string
  designation: string
  unit: string
  price_ht: number | string | null
  reference_price: number | string | null
  source_coefficient: string
  output: string
  components: unknown[] | null
  source_row: string
  updated_by_email: string
  updated_at: string
}

export function rowToWorkItem(row: WorkItemRow): WorkItem {
  return {
    id: row.id,
    libraryId: row.library_id,
    code: row.code,
    category: row.category,
    designation: row.designation,
    unit: row.unit,
    priceHt: tenthsFromStored(row.price_ht),
    referencePrice: tenthsFromStored(row.reference_price),
    sourceCoefficient: row.source_coefficient,
    output: row.output,
    components: (row.components ?? []).map(componentFromJson),
    sourceRow: row.source_row,
    updatedByEmail: row.updated_by_email,
    updatedAt: row.updated_at,
  }
}

export function workItemToRow(libraryId: string, fields: WorkItemFields) {
  return {
    library_id: libraryId,
    code: fields.code.trim(),
    category: fields.category.trim(),
    designation: fields.designation.trim(),
    unit: fields.unit.trim(),
    price_ht: tenthsToText(fields.priceHt),
    reference_price: tenthsToText(fields.referencePrice),
    source_coefficient: fields.sourceCoefficient,
    output: fields.output,
    components: fields.components.map(componentToJson),
    source_row: fields.sourceRow,
  }
}

export interface HistoryRow {
  id: number | string
  item_id: string
  code: string
  designation: string
  action: string
  old_price_ht: number | string | null
  new_price_ht: number | string | null
  changed_by_email: string
  changed_at: string
}

export function rowToHistory(row: HistoryRow): PriceHistoryEntry {
  const action: HistoryAction = row.action === 'insert' || row.action === 'delete' ? row.action : 'update'
  return {
    id: String(row.id),
    itemId: row.item_id,
    code: row.code,
    designation: row.designation,
    action,
    oldPriceHt: tenthsFromStored(row.old_price_ht),
    newPriceHt: tenthsFromStored(row.new_price_ht),
    changedByEmail: row.changed_by_email,
    changedAt: row.changed_at,
  }
}

export function parseAcceptWorkspaceInvite(
  data: unknown,
): { status: 'ok'; workspaceId: string; role: 'admin' | 'member' } | { status: 'unavailable' } {
  const raw = (data ?? {}) as Record<string, unknown>
  if (raw.status === 'ok' && typeof raw.workspace_id === 'string' && isWorkspaceRole(raw.role)) {
    return { status: 'ok', workspaceId: raw.workspace_id, role: raw.role }
  }
  return { status: 'unavailable' }
}
