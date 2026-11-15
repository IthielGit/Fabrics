// Restauration demandée depuis l'aperçu d'une version (M15, lot D), appliquée par l'éditeur une fois
// le projet ouvert et la collaboration prête. Gardée en mémoire seulement : un rechargement de la page
// l'abandonne (rien n'a encore été modifié à ce moment-là).

import type { FabricsDocument } from '../../types/document'

export interface PendingRestore {
  projectId: string
  versionId: string
  /** Document de la version, déjà au format actuel. */
  document: FabricsDocument
  /** Nom de la version, ou sa date, pour nommer la sauvegarde « Avant restauration ». */
  label: string
}

let pending: PendingRestore | null = null

export function setPendingRestore(restore: PendingRestore | null): void {
  pending = restore
}

/** Regarde, sans la retirer, la restauration en attente pour ce projet. */
export function peekPendingRestore(projectId: string): PendingRestore | null {
  return pending && pending.projectId === projectId ? pending : null
}

/** Retire et renvoie la restauration en attente pour ce projet. */
export function takePendingRestore(projectId: string): PendingRestore | null {
  const found = peekPendingRestore(projectId)
  if (found) pending = null
  return found
}
