import type { Project } from '../../types/document'

/** Un projet sans son document : suffisant pour afficher la liste de l'accueil. */
export type ProjectSummary = Omit<Project, 'document'>

/** Ce que le dépôt sait dire d'un enregistrement réussi. */
export interface SaveResult {
  /** Heure d'enregistrement donnée par le serveur (`updated_at`) ; `null` si le projet n'a pas atteint le serveur. */
  updatedAt: string | null
}

export interface ProjectRepository {
  list(): Promise<ProjectSummary[]>
  get(id: string): Promise<Project | null>
  /** Ne renvoie rien quand le dépôt n'a pas d'heure serveur à donner (stockage local). */
  save(project: Project): Promise<SaveResult | void>
  remove(id: string): Promise<void>
  putAsset(id: string, blob: Blob): Promise<void>
  getAssetUrl(id: string): Promise<string> // object URL (local) ou URL signée (cloud)
}
