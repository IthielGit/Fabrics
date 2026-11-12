import type { Project } from '../../types/document'
import { migrateProject, type StoredProject } from '../documents/migrations'

/** Une ligne de la table `shares` telle que le navigateur peut la lire (sans mot de passe haché). */
export interface ShareRow {
  id: string
  project_id: string
  token: string
  active: boolean
  has_password: boolean
  expires_at: string | null
  created_at: string
}

export interface Share {
  id: string
  projectId: string
  token: string
  active: boolean
  hasPassword: boolean
  /** Date limite (ISO 8601) ; `null` : sans limite. */
  expiresAt: string | null
  createdAt: string
}

export function rowToShare(row: ShareRow): Share {
  return {
    id: row.id,
    projectId: row.project_id,
    token: row.token,
    active: row.active,
    hasPassword: row.has_password,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  }
}

export type ShareStatus = 'active' | 'disabled' | 'expired'

/** État affiché d'un lien : désactivé par son propriétaire, expiré, ou en service. */
export function shareStatus(share: Pick<Share, 'active' | 'expiresAt'>, now: Date): ShareStatus {
  if (!share.active) return 'disabled'
  if (share.expiresAt && new Date(share.expiresAt).getTime() <= now.getTime()) return 'expired'
  return 'active'
}

export function shareUrl(origin: string, token: string): string {
  return `${origin}/s/${token}`
}

/** « 2026-12-31 » (champ date) → fin de cette journée, en heure locale, au format ISO ; vide → `null`. */
export function dateInputToExpiry(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const end = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 23, 59, 59)
  return Number.isNaN(end.getTime()) ? null : end.toISOString()
}

/** Date limite ISO → valeur du champ date (jour local) ; `null` → vide. */
export function expiryToDateInput(expiresAt: string | null): string {
  if (!expiresAt) return ''
  const date = new Date(expiresAt)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export type SharedResult =
  | { status: 'ok'; project: Project }
  | { status: 'unavailable' | 'password_required' | 'wrong_password' | 'unsupported' }

/** Lit la réponse de la fonction `get_shared_project` ; tout ce qui est inattendu devient « unavailable ». */
export function parseSharedResponse(data: unknown): SharedResult {
  if (!data || typeof data !== 'object') return { status: 'unavailable' }
  const { status, project } = data as { status?: unknown; project?: unknown }
  if (status === 'password_required' || status === 'wrong_password') return { status }
  if (status !== 'ok' || !project || typeof project !== 'object') return { status: 'unavailable' }

  const { name, kind, document, updated_at } = project as Record<string, unknown>
  if (typeof name !== 'string' || (kind !== 'plan' && kind !== 'design')) return { status: 'unavailable' }
  if (!document || typeof document !== 'object') return { status: 'unavailable' }
  const stamp = typeof updated_at === 'string' ? updated_at : new Date(0).toISOString()

  const stored = {
    id: 'shared',
    name,
    kind,
    document,
    createdAt: stamp,
    updatedAt: stamp,
  } as StoredProject
  try {
    return { status: 'ok', project: migrateProject(stored) }
  } catch {
    return { status: 'unsupported' }
  }
}
