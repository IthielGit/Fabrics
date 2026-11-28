/**
 * Journal d'audit (M24, 24.3, D24-4) : une phrase lisible par événement (« b@… a figé la version 3 du
 * devis (définitif) »). Fonctions pures ; les événements viennent de `supabase/m24-audit.sql`.
 */

export type AuditKind =
  | 'export'
  | 'backup'
  | 'restore'
  | 'estimate_final'
  | 'estimate_draft'
  | 'workspace_member_joined'
  | 'workspace_member_left'
  | 'project_member_joined'
  | 'project_member_left'
  | 'price_import'

export interface AuditEvent {
  id: string
  occurredAt: string
  actorEmail: string
  kind: AuditKind
  details: Record<string, unknown>
}

export interface JournalLabels {
  someone: string
  sentence: Record<AuditKind, (who: string, details: Record<string, string>) => string>
}

const text = (value: unknown) => (typeof value === 'string' || typeof value === 'number' ? String(value) : '')

/** Phrases du journal, la plus récente d'abord. */
export function journalEntries(events: readonly AuditEvent[], labels: JournalLabels): { id: string; at: string; text: string }[] {
  return [...events]
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .map((event) => {
      const details = Object.fromEntries(Object.entries(event.details).map(([k, v]) => [k, text(v)]))
      return { id: event.id, at: event.occurredAt, text: labels.sentence[event.kind](event.actorEmail || labels.someone, details) }
    })
}
