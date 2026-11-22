import type { DrawText } from '../building/views/drawing'

/** Plus petite taille d'un texte sur le papier (pt) : 7 pt, 10 pt en gras (titres, noms de pièces). */
export const MIN_TEXT_PT = 7
export const MIN_TITLE_PT = 10

/**
 * Hauteur (mm du dessin) à laquelle un texte est imprimé à l'échelle 1:`scale` : sa taille, mais au
 * moins 7 pt sur le papier (10 pt en gras). Une seule règle pour le PDF et pour la détection des
 * conflits d'annotations (M20 20.2).
 */
export function printedTextSize(text: Pick<DrawText, 'size' | 'bold'>, scale: number): number {
  const minPt = text.bold ? MIN_TITLE_PT : MIN_TEXT_PT
  return Math.max(text.size, (minPt * 25.4 * scale) / 72)
}
