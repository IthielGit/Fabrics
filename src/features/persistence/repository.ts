import { useSyncStore } from '../../stores/syncStore'
import { supabase } from '../../lib/supabase'
import { LocalRepository } from './LocalRepository'
import { ResilientRepository } from './ResilientRepository'
import { SupabaseRepository } from './SupabaseRepository'
import type { ProjectRepository } from './types'

/** Stockage du navigateur : utilisé hors connexion, et source de l'import vers le compte. */
export const localRepository = new LocalRepository()

let active: ProjectRepository = localRepository
let activeUserId: string | null = null
let activeResilient: ResilientRepository | null = null

/**
 * Choisit le dépôt utilisé : celui du compte (Supabase, avec mise en attente si le réseau
 * est coupé) si une personne est connectée, sinon le dépôt local du navigateur.
 * Appelée par le store de connexion.
 */
export function selectRepository(userId: string | null): void {
  if (userId === activeUserId) return
  activeUserId = userId
  activeResilient?.dispose()
  activeResilient = null
  useSyncStore.getState().setPending(0)

  if (userId && supabase) {
    activeResilient = new ResilientRepository(new SupabaseRepository(supabase, userId), userId, {
      onPendingChange: (count) => useSyncStore.getState().setPending(count),
    })
    active = activeResilient
  } else {
    active = localRepository
  }
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
