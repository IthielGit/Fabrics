import { supabase } from '../../lib/supabase'
import { parseSharedResponse, rowToShare, type Share, type ShareRow, type SharedResult } from './shareLogic'

const SHARE_COLUMNS = 'id, project_id, token, active, has_password, expires_at, created_at'

function client() {
  if (!supabase) throw new Error('Supabase non configuré')
  return supabase
}

/** Liens de partage d'un projet (les plus récents d'abord). */
export async function listShares(projectId: string): Promise<Share[]> {
  const { data, error } = await client()
    .from('shares')
    .select(SHARE_COLUMNS)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .overrideTypes<ShareRow[], { merge: false }>()
  if (error) throw error
  return data.map(rowToShare)
}

export async function createShare(
  projectId: string,
  options: { password: string; expiresAt: string | null },
): Promise<Share> {
  const { data, error } = await client().rpc('create_share', {
    p_project_id: projectId,
    p_password: options.password || null,
    p_expires_at: options.expiresAt,
  })
  if (error) throw error
  return rowToShare(data as ShareRow)
}

export async function setShareActive(id: string, active: boolean): Promise<void> {
  const { error } = await client().from('shares').update({ active }).eq('id', id)
  if (error) throw error
}

export async function setShareExpiry(id: string, expiresAt: string | null): Promise<void> {
  const { error } = await client().from('shares').update({ expires_at: expiresAt }).eq('id', id)
  if (error) throw error
}

/** Mot de passe vide : le retire. */
export async function setSharePassword(id: string, password: string): Promise<void> {
  const { error } = await client().rpc('set_share_password', { p_share_id: id, p_password: password })
  if (error) throw error
}

export async function deleteShare(id: string): Promise<void> {
  const { error } = await client().from('shares').delete().eq('id', id)
  if (error) throw error
}

/** Lecture publique d'un projet partagé (visiteur sans compte). */
export async function fetchSharedProject(token: string, password: string): Promise<SharedResult> {
  const { data, error } = await client().rpc('get_shared_project', {
    p_token: token,
    p_password: password || null,
  })
  if (error) throw error
  return parseSharedResponse(data)
}
