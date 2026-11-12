import type { DimensionElement } from '../../types/document'
import type { DimensioningMode } from './types'

/**
 * Une cote tracée à la main est-elle visible avec ce réglage « Cotation » ? Sans réglage
 * (« Aucune »), toutes les cotes tracées à la main restent visibles ; sinon, une cote réservée à
 * l'autre version est masquée. Sans champ `visibleIn` : visible dans les deux versions.
 */
export function manualDimensionVisible(
  element: Pick<DimensionElement, 'visibleIn'>,
  mode: DimensioningMode,
): boolean {
  if (mode === 'none' || element.visibleIn === undefined) return true
  return element.visibleIn === mode
}
