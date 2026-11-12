import { del, delMany, get, getMany, keys, set, setMany } from 'idb-keyval'
import { migrateProject, type StoredProject } from '../documents/migrations'
import type { Project } from '../../types/document'
import { collectAssetIds } from './collectAssetIds'
import type { ProjectRepository, ProjectSummary } from './types'

// Clés IndexedDB :
//   project:<id>  → projet complet (avec son document)
//   meta:<id>     → résumé sans document (la liste de l'accueil reste légère)
//   asset:<id>    → image (Blob)
const projectKey = (id: string) => `project:${id}`
const metaKey = (id: string) => `meta:${id}`
const assetKey = (id: string) => `asset:${id}`

function toSummary(project: Project): ProjectSummary {
  const { document: _document, ...summary } = project
  return summary
}

export class LocalRepository implements ProjectRepository {
  private objectUrls = new Map<string, string>()

  async list(): Promise<ProjectSummary[]> {
    const allKeys = await keys()
    const metaKeys = allKeys.filter(
      (key): key is string => typeof key === 'string' && key.startsWith('meta:'),
    )
    const summaries = await getMany<ProjectSummary>(metaKeys)
    return summaries
      .filter((summary): summary is ProjectSummary => summary !== undefined)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  async get(id: string): Promise<Project | null> {
    // Les projets enregistrés par une ancienne version sont mis au format actuel à la lecture.
    const stored = await get<StoredProject>(projectKey(id))
    return stored ? migrateProject(stored) : null
  }

  async save(project: Project): Promise<void> {
    await setMany([
      [projectKey(project.id), project],
      [metaKey(project.id), toSummary(project)],
    ])
  }

  async remove(id: string): Promise<void> {
    const project = await this.get(id)
    await delMany([projectKey(id), metaKey(id)])
    if (!project) return

    // Une image n'est supprimée que si plus aucun projet restant ne l'utilise.
    const candidates = collectAssetIds(project.document)
    if (candidates.size === 0) return

    const allKeys = await keys()
    const projectKeys = allKeys.filter(
      (key): key is string => typeof key === 'string' && key.startsWith('project:'),
    )
    const others = await getMany<StoredProject>(projectKeys)
    for (const other of others) {
      if (!other) continue
      for (const assetId of collectAssetIds(other.document)) candidates.delete(assetId)
    }

    for (const assetId of candidates) {
      await del(assetKey(assetId))
      this.revokeUrl(assetId)
    }
  }

  async putAsset(id: string, blob: Blob): Promise<void> {
    await set(assetKey(id), blob)
    this.revokeUrl(id)
  }

  async getAssetUrl(id: string): Promise<string> {
    const cached = this.objectUrls.get(id)
    if (cached) return cached
    const blob = await get<Blob>(assetKey(id))
    if (!blob) throw new Error(`Image introuvable : ${id}`)
    const url = URL.createObjectURL(blob)
    this.objectUrls.set(id, url)
    return url
  }

  /** Le fichier d'une image (pour l'envoyer vers un compte) ; `null` s'il n'existe pas. */
  async getAssetBlob(id: string): Promise<Blob | null> {
    return (await get<Blob>(assetKey(id))) ?? null
  }

  private revokeUrl(id: string): void {
    const url = this.objectUrls.get(id)
    if (url) {
      URL.revokeObjectURL(url)
      this.objectUrls.delete(id)
    }
  }
}
