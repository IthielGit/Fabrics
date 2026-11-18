import type { FabricsDocument } from '../../types/document'
import { isSceneDocument, sceneAssetIds, type SceneDocument } from '../scene/storedScene'

/** Identifiants des images référencées par un document ou une scène enregistrée (sans doublon). */
export function collectAssetIds(document: Pick<FabricsDocument, 'elements'> | SceneDocument): Set<string> {
  if (isSceneDocument(document)) return sceneAssetIds(document.scene)
  const ids = new Set<string>()
  for (const element of document.elements) {
    if (element.type === 'image') ids.add(element.assetId)
  }
  return ids
}
