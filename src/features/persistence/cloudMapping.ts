import type { CanvasElement, Project } from '../../types/document'
import type { StoredProject } from '../documents/migrations'
import { collectAssetIds } from './collectAssetIds'
import type { ProjectSummary } from './types'

/** Une ligne de la table `projects` (voir supabase/schema.sql). */
export interface ProjectRow {
  id: string
  name: string
  kind: Project['kind']
  document: StoredProject['document']
  /** Miniature du projet (image encodée en texte). La colonne s'appelle « thumbnail_path » dans le schéma. */
  thumbnail_path: string | null
  created_at: string
  updated_at: string
}

/** Colonnes lues pour la liste de l'accueil : tout sauf le document. */
export const SUMMARY_COLUMNS = 'id, name, kind, thumbnail_path, created_at, updated_at'

export type SummaryRow = Omit<ProjectRow, 'document'>

export function rowToSummary(row: SummaryRow): ProjectSummary {
  const summary: ProjectSummary = {
    id: row.id,
    name: row.name,
    kind: row.kind,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
  if (row.thumbnail_path) summary.thumbnail = row.thumbnail_path
  return summary
}

export function rowToStoredProject(row: ProjectRow): StoredProject {
  return { ...rowToSummary(row), document: row.document }
}

/**
 * Ligne à enregistrer. `owner_id` n'y figure pas : la base le remplit avec le compte connecté.
 * `updated_at` non plus : la base le met à jour elle-même.
 */
export function projectToRow(project: Project) {
  return {
    id: project.id,
    name: project.name,
    kind: project.kind,
    document: project.document,
    thumbnail_path: project.thumbnail ?? null,
    created_at: project.createdAt,
  }
}

/** Chemin d'une image dans le bucket « assets » : <identifiant du compte>/<assetId>. */
export function assetPath(userId: string, assetId: string): string {
  return `${userId}/${assetId}`
}

/**
 * Images à supprimer quand un projet est supprimé : celles qu'il utilise
 * et qu'aucun des autres projets ne référence (une image peut être partagée).
 */
export function unusedAssetIds(
  removedElements: CanvasElement[],
  remainingProjects: { elements: CanvasElement[] }[],
): string[] {
  const candidates = collectAssetIds({ elements: removedElements })
  for (const other of remainingProjects) {
    for (const assetId of collectAssetIds({ elements: other.elements ?? [] })) {
      candidates.delete(assetId)
    }
  }
  return [...candidates]
}
