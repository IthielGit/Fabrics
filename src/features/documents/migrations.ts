import type { FabricsDocument, Project } from '../../types/document'

/** Version actuelle du format de document (voir `FabricsDocument.version`). */
export const CURRENT_DOCUMENT_VERSION: FabricsDocument['version'] = 2

/** Document tel qu'il peut être lu depuis le stockage : version quelconque. */
export type StoredDocument = Omit<FabricsDocument, 'version'> & { version: number }

export type StoredProject = Omit<Project, 'document'> & { document: StoredDocument }

/** Erreur levée quand un document vient d'une version plus récente de Fabrics. */
export class UnsupportedDocumentVersionError extends Error {
  readonly version: number

  constructor(version: number) {
    super(`Version de document non prise en charge : ${version}`)
    this.name = 'UnsupportedDocumentVersionError'
    this.version = version
  }
}

/**
 * Met un document au format actuel, une version après l'autre.
 * Ne modifie pas le document reçu : renvoie une copie si une migration est nécessaire.
 */
export function migrateDocument(document: StoredDocument): FabricsDocument {
  const { version } = document
  if (!Number.isInteger(version) || version < 1 || version > CURRENT_DOCUMENT_VERSION) {
    throw new UnsupportedDocumentVersionError(version)
  }

  let current: StoredDocument = document
  // v1 → v2 (M5) : ajout du type d'élément « opening ». Les éléments existants ne changent pas.
  if (current.version === 1) current = { ...current, version: 2 }

  return current as FabricsDocument
}

/** Met le document d'un projet au format actuel (même objet si rien ne change). */
export function migrateProject(project: StoredProject): Project {
  const document = migrateDocument(project.document)
  if (document === project.document) return project as Project
  return { ...project, document }
}
