import type { Project } from '../../types/document'
import { collectAssetIds } from './collectAssetIds'
import type { ProjectRepository, ProjectSummary } from './types'

/** Ce qu'il faut lire du stockage local du navigateur pour en exporter les projets. */
export interface LocalSource {
  list(): Promise<ProjectSummary[]>
  get(id: string): Promise<Project | null>
  getAssetBlob(id: string): Promise<Blob | null>
}

export interface ImportResult {
  imported: number
  /** Déjà présents dans le compte (même identifiant) : laissés tels quels, jamais écrasés. */
  skipped: number
  failed: number
}

/**
 * Copie les projets locaux (et leurs images) dans le compte. Les projets locaux ne sont pas supprimés.
 * Les images partent avant le projet : le compte ne contient jamais un projet qui référence une image absente.
 */
export async function importLocalProjects(
  local: LocalSource,
  cloud: ProjectRepository,
  onProgress?: (done: number, total: number) => void,
): Promise<ImportResult> {
  const summaries = await local.list()
  const result: ImportResult = { imported: 0, skipped: 0, failed: 0 }

  for (const [index, summary] of summaries.entries()) {
    try {
      if (await cloud.get(summary.id)) {
        result.skipped += 1
      } else {
        const project = await local.get(summary.id)
        if (!project) {
          result.failed += 1
        } else {
          for (const assetId of collectAssetIds(project.document)) {
            const blob = await local.getAssetBlob(assetId)
            if (blob) await cloud.putAsset(assetId, blob)
          }
          await cloud.save(project)
          result.imported += 1
        }
      }
    } catch {
      result.failed += 1
    }
    onProgress?.(index + 1, summaries.length)
  }
  return result
}
