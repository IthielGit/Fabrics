import { supabase } from '../../lib/supabase'
import { LocalRepository } from './LocalRepository'
import { SupabaseRepository } from './SupabaseRepository'
import type { ProjectRepository } from './types'

const local = new LocalRepository()
let active: ProjectRepository = local
let activeUserId: string | null = null

/**
 * Choisit le dépôt utilisé : celui du compte (Supabase) si une personne est connectée,
 * sinon le dépôt local du navigateur. Appelée par le store de connexion.
 */
export function selectRepository(userId: string | null): void {
  if (userId === activeUserId) return
  activeUserId = userId
  active = userId && supabase ? new SupabaseRepository(supabase, userId) : local
}

/**
 * Dépôt utilisé par l'application. Il suit le choix de `selectRepository` :
 * le reste du code n'a pas à savoir si les projets sont locaux ou dans le cloud.
 */
export const repository: ProjectRepository = {
  list: () => active.list(),
  get: (id) => active.get(id),
  save: (project) => active.save(project),
  remove: (id) => active.remove(id),
  putAsset: (id, blob) => active.putAsset(id, blob),
  getAssetUrl: (id) => active.getAssetUrl(id),
}
