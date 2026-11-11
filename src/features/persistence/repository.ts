import { LocalRepository } from './LocalRepository'
import type { ProjectRepository } from './types'

/**
 * Dépôt utilisé par l'application. Local pour l'instant ;
 * au jalon M13, le choix local / Supabase se fera ici.
 */
export const repository: ProjectRepository = new LocalRepository()
