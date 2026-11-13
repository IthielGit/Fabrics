import type { ProjectSummary } from '../persistence/types'

/** Rôle d'un compte sur un projet. `owner` : le propriétaire (jamais stocké dans `project_members`). */
export type ProjectRole = 'owner' | 'editor' | 'viewer'
/** Rôles qu'une invitation peut donner. */
export type InviteRole = 'editor' | 'viewer'

export function isProjectRole(value: unknown): value is ProjectRole {
  return value === 'owner' || value === 'editor' || value === 'viewer'
}

export function isInviteRole(value: unknown): value is InviteRole {
  return value === 'editor' || value === 'viewer'
}

/** Peut-on modifier le projet ? (le propriétaire et les éditeurs) */
export function canEdit(role: ProjectRole): boolean {
  return role === 'owner' || role === 'editor'
}

/** Rôle renvoyé par `my_project_role` ; tout ce qui est inattendu (ou `null`) : aucun accès. */
export function parseRole(data: unknown): ProjectRole | null {
  return isProjectRole(data) ? data : null
}

/** Une ligne de la table `project_invites` telle que le navigateur la lit. */
export interface InviteRow {
  id: string
  project_id: string
  token: string
  role: string
  active: boolean
  expires_at: string | null
  created_at: string
}

export interface Invite {
  id: string
  projectId: string
  token: string
  role: InviteRole
  active: boolean
  /** Date limite (ISO 8601) ; `null` : sans limite. */
  expiresAt: string | null
  createdAt: string
}

export function rowToInvite(row: InviteRow): Invite {
  return {
    id: row.id,
    projectId: row.project_id,
    token: row.token,
    // La base n'accepte que ces deux rôles ; par prudence, tout autre devient « lecteur ».
    role: isInviteRole(row.role) ? row.role : 'viewer',
    active: row.active,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  }
}

export function inviteUrl(origin: string, token: string): string {
  return `${origin}/i/${token}`
}

/** Une ligne renvoyée par `list_project_members`. */
export interface MemberRow {
  user_id: string
  email: string | null
  role: string
  created_at: string
}

export interface Member {
  userId: string
  /** Adresse du compte ; vide si la base ne la donne pas. */
  email: string
  role: InviteRole
  joinedAt: string
}

export function rowToMember(row: MemberRow): Member {
  return {
    userId: row.user_id,
    email: row.email ?? '',
    role: isInviteRole(row.role) ? row.role : 'viewer',
    joinedAt: row.created_at,
  }
}

/** Une ligne renvoyée par `my_shared_projects`. */
export interface SharedProjectRow {
  id: string
  name: string
  kind: string
  thumbnail_path: string | null
  created_at: string
  updated_at: string
  role: string
}

/** Projet d'un autre compte, avec le rôle de la personne connectée. */
export interface SharedProjectSummary extends ProjectSummary {
  role: InviteRole
}

/** Lignes inconnues (type de projet inattendu) ignorées : mieux vaut les cacher que casser l'accueil. */
export function rowsToSharedProjects(rows: readonly SharedProjectRow[]): SharedProjectSummary[] {
  const result: SharedProjectSummary[] = []
  for (const row of rows) {
    if (row.kind !== 'plan' && row.kind !== 'design') continue
    const summary: SharedProjectSummary = {
      id: row.id,
      name: row.name,
      kind: row.kind,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      role: isInviteRole(row.role) ? row.role : 'viewer',
    }
    if (row.thumbnail_path) summary.thumbnail = row.thumbnail_path
    result.push(summary)
  }
  return result
}

export type AcceptResult =
  | { status: 'ok'; projectId: string; role: InviteRole }
  /** La personne est déjà propriétaire du projet : on l'ouvre simplement. */
  | { status: 'owner'; projectId: string }
  | { status: 'unavailable' }

/** Lit la réponse de `accept_invite` ; tout ce qui est inattendu devient « unavailable ». */
export function parseAcceptResponse(data: unknown): AcceptResult {
  if (!data || typeof data !== 'object') return { status: 'unavailable' }
  const { status, project_id: projectId, role } = data as Record<string, unknown>
  if (typeof projectId !== 'string' || projectId === '') return { status: 'unavailable' }
  if (status === 'owner') return { status: 'owner', projectId }
  if (status === 'ok' && isInviteRole(role)) return { status: 'ok', projectId, role }
  return { status: 'unavailable' }
}
