import { normalizeNorthAngle } from './north'

// Boussole du plan (M11 ter). Une seule valeur : `plan.northAngle`, en degrés, sens horaire depuis
// le haut du plan (0° = le nord est en haut). La boussole ne fait que lire et écrire cet angle.
// Fonctions pures, sans React.

/** Pas d'aimantation de la boussole, en degrés (la touche Maj donne le réglage au degré). */
export const COMPASS_SNAP_DEGREES = 15

/**
 * Angle du nord (0 à 359, sens horaire depuis le haut) quand le pointeur est en `pointer`, la
 * boussole étant centrée en `center` (mêmes unités, y vers le bas). Pointeur au centre : `null`
 * (aucune direction), l'appelant garde alors l'angle précédent.
 */
export function angleFromPointer(
  center: { x: number; y: number },
  pointer: { x: number; y: number },
): number | null {
  const dx = pointer.x - center.x
  const dy = pointer.y - center.y
  if (Math.hypot(dx, dy) < 1e-6) return null
  // Haut = (0, −1) → 0° ; droite = (1, 0) → 90° (sens horaire à l'écran).
  return normalizeNorthAngle((Math.atan2(dx, -dy) * 180) / Math.PI)
}

/** Aimante un angle sur le pas de la boussole, sauf en mode précis (Maj : au degré). */
export function snapCompassAngle(degrees: number, precise: boolean): number {
  if (precise) return normalizeNorthAngle(degrees)
  return normalizeNorthAngle(Math.round(degrees / COMPASS_SNAP_DEGREES) * COMPASS_SNAP_DEGREES)
}
