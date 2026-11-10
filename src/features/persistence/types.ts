import type { Project } from '../../types/document'

/** Un projet sans son document : suffisant pour afficher la liste de l'accueil. */
export type ProjectSummary = Omit<Project, 'document'>

export interface ProjectRepository {
  list(): Promise<ProjectSummary[]>
  get(id: string): Promise<Project | null>
  save(project: Project): Promise<void>
  remove(id: string): Promise<void>
  putAsset(id: string, blob: Blob): Promise<void>
  getAssetUrl(id: string): Promise<string> // object URL (local) ou URL signée (cloud)
}
