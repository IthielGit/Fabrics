/** Ramène un angle en degrés dans [0, 360[ (arrondi au degré, valeur invalide = 0). */
export function normalizeNorthAngle(degrees: number): number {
  if (!Number.isFinite(degrees)) return 0
  const wrapped = ((Math.round(degrees) % 360) + 360) % 360
  return wrapped === 0 ? 0 : wrapped
}

export type Cardinal = 'N' | 'E' | 'S' | 'O'

/**
 * Direction du plan (vecteur unitaire x, y du plan ; y vers le bas de l'écran) vers laquelle
 * pointe un point cardinal. Le nord est tourné de `northAngle` degrés dans le sens horaire depuis
 * le haut du plan ; l'est est à 90° du nord dans le même sens.
 */
export function cardinalDirection(cardinal: Cardinal, northAngle: number): { x: number; y: number } {
  const offset = { N: 0, E: 90, S: 180, O: 270 }[cardinal]
  const radians = ((northAngle + offset) * Math.PI) / 180
  // Haut du plan = (0, −1) ; rotation horaire à l'écran.
  const x = Math.sin(radians)
  const y = -Math.cos(radians)
  return { x: Math.abs(x) < 1e-12 ? 0 : x, y: Math.abs(y) < 1e-12 ? 0 : y }
}
