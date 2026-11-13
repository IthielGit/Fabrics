import { supabase } from '../../lib/supabase'
import {
  parseAcceptResponse,
  parseRole,
  rowToInvite,
  rowToMember,
  rowsToSharedProjects,
  type AcceptResult,
  type Invite,
  type InviteRole,
  type InviteRow,
  type Member,
  type MemberRow,
  type ProjectRole,
  type SharedProjectRow,
  type SharedProjectSummary,
} from './membersLogic'

const INVITE_COLUMNS = 'id, project_id, token, role, active, expires_at, created_at'

function client() {
  if (!supabase) throw new Error('Supabase non configuré')
  return supabase
}

/**
 * Rôle de la personne connectée sur un projet. Sans Supabase (mode local), le projet est le sien :
 * `owner`. `null` : aucun accès.
 */
export async function fetchMyRole(projectId: string): Promise<ProjectRole | null> {
  if (!supabase) return 'owner'
  const { data, error } = await supabase.rpc('my_project_role', { p_project_id: projectId })
  if (error) throw error
  return parseRole(data)
}

/** Projets des autres comptes dont la personne connectée est membre. */
export async function listSharedWithMe(): Promise<SharedProjectSummary[]> {
  if (!supabase) return []
  const { data, error } = await supabase.rpc('my_shared_projects')
  if (error) throw error
  return rowsToSharedProjects((data ?? []) as SharedProjectRow[])
}

/** Rejoint un projet avec le jeton d'une invitation. */
export async function acceptInvite(token: string): Promise<AcceptResult> {
  const { data, error } = await client().rpc('accept_invite', { p_token: token })
  if (error) throw error
  return parseAcceptResponse(data)
}

/** Invitations d'un projet (les plus récentes d'abord) ; réservé au propriétaire. */
export async function listInvites(projectId: string): Promise<Invite[]> {
  const { data, error } = await client()
    .from('project_invites')
    .select(INVITE_COLUMNS)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .overrideTypes<InviteRow[], { merge: false }>()
  if (error) throw error
  return data.map(rowToInvite)
}

export async function createInvite(
  projectId: string,
  options: { role: InviteRole; expiresAt: string | null },
): Promise<Invite> {
  const { data, error } = await client().rpc('create_invite', {
    p_project_id: projectId,
    p_role: options.role,
    p_expires_at: options.expiresAt,
  })
  if (error) throw error
  return rowToInvite(data as InviteRow)
}

export async function setInviteActive(id: string, active: boolean): Promise<void> {
  const { error } = await client().from('project_invites').update({ active }).eq('id', id)
  if (error) throw error
}

export async function setInviteExpiry(id: string, expiresAt: string | null): Promise<void> {
  const { error } = await client().from('project_invites').update({ expires_at: expiresAt }).eq('id', id)
  if (error) throw error
}

export async function deleteInvite(id: string): Promise<void> {
  const { error } = await client().from('project_invites').delete().eq('id', id)
  if (error) throw error
}

/** Membres d'un projet ; réservé au propriétaire. */
export async function listMembers(projectId: string): Promise<Member[]> {
  const { data, error } = await client().rpc('list_project_members', { p_project_id: projectId })
  if (error) throw error
  return ((data ?? []) as MemberRow[]).map(rowToMember)
}

export async function setMemberRole(projectId: string, userId: string, role: InviteRole): Promise<void> {
  const { error } = await client()
    .from('project_members')
    .update({ role })
    .eq('project_id', projectId)
    .eq('user_id', userId)
  if (error) throw error
}

/** Retire un membre (propriétaire) ou quitte le projet (le membre lui-même). */
export async function removeMember(projectId: string, userId: string): Promise<void> {
  const { error } = await client()
    .from('project_members')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId)
  if (error) throw error
}
