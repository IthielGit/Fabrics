import type { PlanOverlay } from '../building/views/drawing'
import type { FabricsDocument } from '../../types/document'
import { annotationGraphics } from './annotationGraphics'
import type { ExecutionLabels } from './executionDimensions'
import { levelAnnotations } from './levelAnnotations'
import type { DimensioningMode } from './types'

/** En Client, les textes sont plus grands (document destiné au client, peu de cotes). */
export const CLIENT_TEXT_FACTOR = 1.3

/** Cotes automatiques d'un niveau prêtes à dessiner sur la planche ; `null` pour « Aucune ». */
export function planOverlay(
  document: Pick<FabricsDocument, 'elements' | 'levels'>,
  levelId: string,
  mode: DimensioningMode,
  labels: ExecutionLabels,
  fontMm: number,
): PlanOverlay | null {
  if (mode === 'none') return null
  const annotations = levelAnnotations(document, levelId, mode, labels)
  return annotationGraphics(annotations, mode === 'client' ? fontMm * CLIENT_TEXT_FACTOR : fontMm)
}

interface Region {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Agrandit la zone exportée d'un plan pour que les cotes automatiques (à l'extérieur des murs) ne
 * soient pas coupées. `margin` : marge ajoutée autour des cotes, en mm.
 */
export function regionWithOverlay(region: Region, overlay: PlanOverlay | null, margin: number): Region {
  if (!overlay || (overlay.lines.length === 0 && overlay.texts.length === 0)) return region
  let minX = region.x
  let minY = region.y
  let maxX = region.x + region.width
  let maxY = region.y + region.height
  for (const l of overlay.lines) {
    minX = Math.min(minX, l.x1 - margin, l.x2 - margin)
    maxX = Math.max(maxX, l.x1 + margin, l.x2 + margin)
    minY = Math.min(minY, l.y1 - margin, l.y2 - margin)
    maxY = Math.max(maxY, l.y1 + margin, l.y2 + margin)
  }
  for (const t of overlay.texts) {
    const reach = t.size + margin
    minX = Math.min(minX, t.x - reach)
    maxX = Math.max(maxX, t.x + reach)
    minY = Math.min(minY, t.y - reach)
    maxY = Math.max(maxY, t.y + reach)
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}
