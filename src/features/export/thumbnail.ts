/** Plus grand côté d'une miniature de projet, en pixels. */
export const THUMBNAIL_MAX_SIDE = 320

/**
 * Facteur de réduction (`pixelRatio` Konva) qui ramène une page de `widthPx × heightPx`
 * à une miniature dont le plus grand côté vaut `maxSide`.
 */
export function thumbnailPixelRatio(
  widthPx: number,
  heightPx: number,
  maxSide: number = THUMBNAIL_MAX_SIDE,
): number {
  const longest = Math.max(widthPx, heightPx)
  return longest > 0 ? maxSide / longest : 1
}
