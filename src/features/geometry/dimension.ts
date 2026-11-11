import type { Point } from './viewport'

export interface DimensionGeometry {
  /** Distance mesurée entre les deux points, en mm. */
  length: number
  /** Ligne de cote : les deux points décalés de `offset` perpendiculairement. */
  line: [Point, Point]
  /** Lignes d'attache : du point mesuré jusqu'un peu au-delà de la ligne de cote. */
  extensions: [[Point, Point], [Point, Point]]
  /** Milieu de la ligne de cote (position du texte). */
  center: Point
  /** Angle du texte en degrés, toujours lisible (jamais à l'envers) : de -90 inclus à 90 exclu. */
  textAngle: number
  /** Vecteur unitaire le long de la cote. */
  direction: Point
  /** Vecteur unitaire perpendiculaire (côté du décalage positif). */
  normal: Point
}

/** Dépassement des lignes d'attache au-delà de la ligne de cote, en mm. */
const EXTENSION_OVERSHOOT = 100

/**
 * Géométrie d'une cote entre A et B, la ligne de cote étant décalée de `offset` mm.
 * Renvoie `null` si A et B sont confondus.
 */
export function dimensionGeometry(
  points: readonly [number, number, number, number],
  offset: number,
): DimensionGeometry | null {
  const [ax, ay, bx, by] = points
  const length = Math.hypot(bx - ax, by - ay)
  if (length === 0) return null

  const direction = { x: (bx - ax) / length, y: (by - ay) / length }
  const normal = { x: -direction.y, y: direction.x }

  const shift = (p: Point, distance: number): Point => ({
    x: p.x + normal.x * distance,
    y: p.y + normal.y * distance,
  })
  const a = { x: ax, y: ay }
  const b = { x: bx, y: by }

  const side = offset < 0 ? -1 : 1
  const reach = offset + side * EXTENSION_OVERSHOOT

  const line: [Point, Point] = [shift(a, offset), shift(b, offset)]
  let angle = (Math.atan2(direction.y, direction.x) * 180) / Math.PI
  // Plage [-90, 90[ : un texte vertical se lit de bas en haut (convention des plans).
  if (angle >= 90 - 1e-9) angle -= 180
  else if (angle < -90 - 1e-9) angle += 180

  return {
    length,
    line,
    extensions: [
      [a, shift(a, reach)],
      [b, shift(b, reach)],
    ],
    center: { x: (line[0].x + line[1].x) / 2, y: (line[0].y + line[1].y) / 2 },
    textAngle: angle,
    direction,
    normal,
  }
}
