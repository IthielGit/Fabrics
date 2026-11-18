/**
 * Format enregistré d'un projet Plan à partir de M18 (plan M18, lot D) : la scène Pascal, et elle
 * seule (ADR 0001). Les projets Visuel gardent leur `FabricsDocument`.
 *
 * `version: 5` suit les versions de `FabricsDocument` (1 à 4) : une ancienne version de Fabrics qui
 * ouvre ce document le refuse proprement (« version plus récente »), sans l'écraser.
 */
import type { CanvasElement, FabricsDocument, Project } from '../../types/document'
import { planToScene } from './sceneBinding'
import type { PlanScene } from './sceneTypes'
import { sceneToFabricsView } from './view/toFabricsView'
import { SCENE_FORMAT } from './yScene'

export const SCENE_DOCUMENT_VERSION = 5

export interface SceneDocument {
  format: 'pascal-scene'
  version: typeof SCENE_DOCUMENT_VERSION
  /** Format de la scène elle-même (`yScene.SCENE_FORMAT`). */
  sceneFormat: number
  scene: PlanScene
}

export function isSceneDocument(value: unknown): value is SceneDocument {
  return typeof value === 'object' && value !== null && (value as { format?: unknown }).format === 'pascal-scene'
}

/** Document à enregistrer : la scène pour un projet Plan, le document Fabrics pour un Visuel. */
export function toStoredDocument(project: Pick<Project, 'kind' | 'document' | 'scene'>): FabricsDocument | SceneDocument {
  if (project.kind !== 'plan') return project.document
  return {
    format: 'pascal-scene',
    version: SCENE_DOCUMENT_VERSION,
    sceneFormat: SCENE_FORMAT,
    scene: project.scene ?? planToScene(project.document),
  }
}

/** Vue affichée par l'éditeur actuel (ADR 0004) depuis une scène enregistrée. */
export function viewOfStoredScene(document: SceneDocument): FabricsDocument {
  return sceneToFabricsView(document.scene)
}

/** Images (identifiants du stockage) utilisées par une scène. */
export function sceneAssetIds(scene: PlanScene): Set<string> {
  const ids = new Set<string>()
  for (const node of Object.values(scene.nodes)) {
    const element = node.element as Partial<CanvasElement> | undefined
    if (element?.type === 'image' && typeof element.assetId === 'string') ids.add(element.assetId)
  }
  return ids
}
