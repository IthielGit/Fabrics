/**
 * Points et angles entre Fabrics (mm, degrés) et la scène Pascal (m, radians), ADR 0001 point 3.
 * Les longueurs passent par la seule conversion mm ↔ m de Fabrics (`units/format.ts`).
 */
import { mmToM, mToMm } from '../units/format'

export { mmToM, mToMm }

/** Polyligne Fabrics `[x1, y1, x2, y2, …]` (mm) → points de plan Pascal `[x, z]` (m). L'axe y
 * de Fabrics (vers le bas de l'écran) est l'axe z de Pascal (vers le sud, bas de l'écran). */
export function flatToPlanPoints(points: readonly number[]): [number, number][] {
  const out: [number, number][] = []
  for (let i = 0; i + 1 < points.length; i += 2) out.push([mmToM(points[i]), mmToM(points[i + 1])])
  return out
}

/** Points de plan Pascal `[x, z]` (m) → polyligne Fabrics `[x1, y1, …]` (mm). */
export function planPointsToFlat(points: readonly (readonly [number, number])[]): number[] {
  return points.flatMap(([x, z]) => [mToMm(x), mToMm(z)])
}

/** Degrés Fabrics (sens horaire à l'écran) → radians Pascal (rotation autour de +y, sens
 * trigonométrique vu de dessus). */
export function degreesToPascalRotation(degrees: number): number {
  return degrees === 0 ? 0 : (-degrees * Math.PI) / 180
}

/** Radians Pascal → degrés Fabrics, arrondis au millionième de degré. */
export function pascalRotationToDegrees(radians: number): number {
  const degrees = Math.round(((-radians * 180) / Math.PI) * 1e6) / 1e6
  return degrees === 0 ? 0 : degrees
}
