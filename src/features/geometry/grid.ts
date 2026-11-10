/** Distance minimale, à l'écran, entre deux traits de grille affichés (en pixels). */
export const MIN_GRID_SCREEN_SPACING = 8

/** Multiples du pas de grille essayés quand le zoom est trop faible pour afficher tous les traits. */
const COARSER_MULTIPLES = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000]

/** Un trait « mètre » est un peu plus marqué : tous les 1 000 mm. */
export const MAJOR_LINE_EVERY = 1000

/**
 * Pas de grille à afficher (en mm). Quand le zoom est faible, on n'affiche qu'un trait sur 2, 5, 10…
 * pour ne pas noircir l'écran. Renvoie `null` si même le pas le plus large est trop serré.
 * `scale` = pixels écran par mm.
 */
export function visibleGridStep(
  gridSize: number,
  scale: number,
  minSpacing: number = MIN_GRID_SCREEN_SPACING,
): number | null {
  if (gridSize <= 0 || scale <= 0) return null
  for (const multiple of COARSER_MULTIPLES) {
    if (gridSize * multiple * scale >= minSpacing) return gridSize * multiple
  }
  return null
}

/** Positions des traits (0, pas, 2 × pas… jusqu'à `length` inclus). */
export function gridPositions(length: number, step: number): number[] {
  if (step <= 0 || length < 0) return []
  const count = Math.floor(length / step + 1e-9)
  return Array.from({ length: count + 1 }, (_, i) => i * step)
}

/** Vrai pour un trait « mètre » (position multiple de 1 000 mm). */
export function isMajorLine(position: number): boolean {
  return Math.abs(position / MAJOR_LINE_EVERY - Math.round(position / MAJOR_LINE_EVERY)) < 1e-9
}
