/** Largeur minimale du panneau 3D, en pixels. */
export const VIEWER_MIN_WIDTH = 280
/** Largeur du panneau 3D à la première ouverture, en pixels. */
export const VIEWER_DEFAULT_WIDTH = 440
/** Place laissée au plan et aux panneaux de droite quand le panneau 3D est au maximum. */
export const VIEWER_RESERVED_WIDTH = 640

/**
 * Largeur permise pour le panneau 3D : au moins `VIEWER_MIN_WIDTH`, et assez petit pour que le
 * plan et les panneaux de droite gardent `VIEWER_RESERVED_WIDTH` pixels (sauf fenêtre très étroite,
 * où le minimum l'emporte).
 */
export function clampViewerWidth(width: number, viewportWidth: number): number {
  const max = Math.max(VIEWER_MIN_WIDTH, viewportWidth - VIEWER_RESERVED_WIDTH)
  if (!Number.isFinite(width)) return Math.min(VIEWER_DEFAULT_WIDTH, max)
  return Math.round(Math.min(Math.max(width, VIEWER_MIN_WIDTH), max))
}
