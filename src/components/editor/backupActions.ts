import { backupEstimate, backupFileName, buildBackup, type BackupEstimate } from '../../features/backup/backup'
import { toStoredProject } from '../../features/documents/migrations'
import { collectAssetIds } from '../../features/persistence/collectAssetIds'
import { repository } from '../../features/persistence/repository'
import { downloadBlob } from '../../lib/download'
import { usePricingStore } from '../../stores/pricingStore'
import type { Project } from '../../types/document'

/** Images du projet lues depuis le dépôt ; une image illisible est laissée de côté. */
async function projectAssets(project: Project): Promise<Record<string, Uint8Array>> {
  const assets: Record<string, Uint8Array> = {}
  for (const id of collectAssetIds(toStoredProject(project).document as never)) {
    try {
      const response = await fetch(await repository.getAssetUrl(id))
      if (response.ok) assets[id] = new Uint8Array(await response.arrayBuffer())
    } catch {
      // image absente : la sauvegarde reste utilisable sans elle
    }
  }
  return assets
}

/** Devis du projet dans l'espace ouvert ; prix seulement pour un admin de l'espace (D24-3). */
async function projectEstimatePart(projectId: string): Promise<BackupEstimate | null> {
  const { repository: pricing, library, workspace } = usePricingStore.getState()
  if (!pricing || !library || !workspace) return null
  const record = await pricing.getProjectEstimate(library.id, projectId)
  if (!record) return null
  const versions = await pricing.listEstimateVersions(record.id)
  return backupEstimate({ libraryId: library.id, workspaceName: workspace.name, withPrices: workspace.role === 'admin', record, versions })
}

/**
 * Télécharge la sauvegarde `.fabrics` d'un projet (M24, 24.3). Le fichier est fabriqué en entier avant
 * d'être proposé : une erreur en cours de route ne télécharge rien (D24-9).
 */
export async function downloadProjectBackup(project: Project, options: { withEstimate?: boolean } = {}): Promise<void> {
  const estimate = options.withEstimate === false ? null : await projectEstimatePart(project.id).catch(() => null)
  const bytes = await buildBackup({ project, estimate, assets: await projectAssets(project) })
  downloadBlob(new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'application/zip' }), backupFileName(project.name))
}
