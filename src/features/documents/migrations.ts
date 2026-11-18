import { fr } from '../../i18n/fr'
import type { FabricsDocument, PlanSettings, Project } from '../../types/document'
import { isSceneDocument, toStoredDocument, viewOfStoredScene, type SceneDocument } from '../scene/storedScene'
import { createLevel, DEFAULT_LEVEL_HEIGHT } from './levels'

/** Version actuelle du format de document (voir `FabricsDocument.version`). */
export const CURRENT_DOCUMENT_VERSION: FabricsDocument['version'] = 4

/** Document Fabrics tel qu'il peut être lu depuis le stockage : version quelconque. */
export type StoredDocument = Omit<FabricsDocument, 'version'> & { version: number }

/** Projet tel qu'enregistré : document Fabrics (Visuel, ancien plan) ou scène Pascal (plan, M18). */
export type StoredProject = Omit<Project, 'document' | 'scene'> & { document: StoredDocument | SceneDocument }

/** Projet à enregistrer : un projet Plan l'est par sa scène Pascal (M18, ADR 0001), jamais par sa vue. */
export function toStoredProject(project: Project): StoredProject {
  const { scene: _scene, ...rest } = project
  return { ...rest, document: toStoredDocument(project) }
}

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
export function migrateDocument(document: StoredDocument | SceneDocument): FabricsDocument {
  // M18 : un plan enregistré en scène Pascal s'affiche par sa vue calculée (ADR 0004).
  if (isSceneDocument(document)) return viewOfStoredScene(document)
  const { version } = document
  if (!Number.isInteger(version) || version < 1 || version > CURRENT_DOCUMENT_VERSION) {
    throw new UnsupportedDocumentVersionError(version)
  }

  let current: StoredDocument = document
  // v1 → v2 (M5) : ajout du type d'élément « opening ». Les éléments existants ne changent pas.
  if (current.version === 1) current = { ...current, version: 2 }
  // v2 → v3 (M6) : un plan reçoit un niveau « Rez-de-chaussée » qui porte tous ses éléments.
  if (current.version === 2) current = migrateV2ToV3(current)
  // v3 → v4 (M8) : un plan reçoit l'orientation du nord (0 = en haut du plan).
  if (current.version === 3) current = migrateV3ToV4(current)

  return current as FabricsDocument
}

/**
 * v2 → v3 (M6). Un plan (document avec réglages de plan) reçoit un niveau « Rez-de-chaussée » à
 * l'altitude 0, dont la hauteur reprend l'ancienne hauteur de mur par défaut (les murs existants
 * gardent leur hauteur) ; tous ses éléments y sont rattachés. Un visuel ne change que de version.
 */
function migrateV2ToV3(document: StoredDocument): StoredDocument {
  if (!document.plan) return { ...document, version: 3 }
  const level = createLevel(
    fr.levels.groundFloor,
    0,
    document.plan.defaultWallHeight || DEFAULT_LEVEL_HEIGHT,
  )
  return {
    ...document,
    version: 3,
    levels: [level],
    elements: document.elements.map((element) => ({ ...element, levelId: level.id })),
  }
}

/**
 * v3 → v4 (M8). Un plan reçoit `plan.northAngle = 0` (le nord est en haut du plan, comme il
 * l'a toujours été à l'écran) ; un angle déjà présent est gardé. Un visuel ne change que de version.
 */
function migrateV3ToV4(document: StoredDocument): StoredDocument {
  if (!document.plan) return { ...document, version: 4 }
  const { northAngle } = document.plan as Partial<PlanSettings>
  return { ...document, version: 4, plan: { ...document.plan, northAngle: northAngle ?? 0 } }
}

/** Met le document d'un projet au format actuel (même objet si rien ne change). */
export function migrateProject(project: StoredProject): Project {
  if (isSceneDocument(project.document)) {
    return { ...project, document: viewOfStoredScene(project.document), scene: project.document.scene }
  }
  const document = migrateDocument(project.document)
  if (document === project.document) return project as Project
  return { ...project, document }
}
