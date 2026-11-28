// Journal d'audit (M24, 24.3, D24-4) : accès à Supabase. Sans Supabase (mode local), pas de journal.
import { supabase } from '../../lib/supabase'
import type { AuditEvent, AuditKind } from './journal'

interface AuditRow {
  id: number
  occurred_at: string
  actor_email: string
  kind: AuditKind
  details: Record<string, unknown> | null
}

const COLUMNS = 'id, occurred_at, actor_email, kind, details'
const toEvent = (row: AuditRow): AuditEvent => ({
  id: String(row.id),
  occurredAt: row.occurred_at,
  actorEmail: row.actor_email,
  kind: row.kind,
  details: row.details ?? {},
})

export function auditAvailable(): boolean {
  return supabase !== null
}

/**
 * Note un export, une sauvegarde ou une restauration. Ne bloque jamais l'action : un journal
 * indisponible (mode local, réseau coupé, script pas encore lancé) est simplement ignoré.
 */
export async function logAuditEvent(kind: 'export' | 'backup' | 'restore', projectId: string, details: Record<string, string> = {}): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.rpc('log_audit_event', { p_kind: kind, p_project_id: projectId, p_details: details })
  if (error) console.warn('Journal :', error.message)
}

async function list(column: 'project_id' | 'workspace_id', id: string): Promise<AuditEvent[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('audit_events')
    .select(COLUMNS)
    .eq(column, id)
    .order('occurred_at', { ascending: false })
    .limit(500)
    .overrideTypes<AuditRow[], { merge: false }>()
  if (error) throw error
  return (data ?? []).map(toEvent)
}

export const listProjectEvents = (projectId: string) => list('project_id', projectId)
export const listWorkspaceEvents = (workspaceId: string) => list('workspace_id', workspaceId)
