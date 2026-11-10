import type { FabricsDocument } from '../../types/document'

/** Identifiants des images référencées par un document (sans doublon). */
export function collectAssetIds(document: Pick<FabricsDocument, 'elements'>): Set<string> {
  const ids = new Set<string>()
  for (const element of document.elements) {
    if (element.type === 'image') ids.add(element.assetId)
  }
  return ids
}
