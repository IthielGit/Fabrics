/**
 * Champs de longueur de chaque élément Fabrics (mm dans Fabrics, m dans la scène). Tout champ qui
 * n'est pas listé ici est recopié tel quel (couleurs, textes, angles en degrés, booléens…).
 */
import { mToMm, mmToM } from '../units'

export const LENGTH_FIELDS: Record<string, readonly string[]> = {
  text: ['x', 'y', 'width', 'fontSize'],
  rect: ['x', 'y', 'width', 'height', 'strokeWidth', 'cornerRadius'],
  ellipse: ['x', 'y', 'radiusX', 'radiusY', 'strokeWidth'],
  line: ['x', 'y', 'points', 'strokeWidth'],
  image: ['x', 'y', 'width', 'height'],
  section: ['x', 'y', 'points'],
  roof: ['x', 'y', 'points', 'overhang'],
  stair: ['x', 'y', 'width', 'length', 'length2', 'gap', 'voidMargin'],
  chimney: ['x', 'y', 'width', 'depth', 'heightAboveTop'],
  platform: ['x', 'y', 'points', 'elevation', 'thickness'],
}

type Fields = Record<string, unknown>

function convert(fields: Fields, names: readonly string[], fn: (value: number) => number): Fields {
  const out: Fields = { ...fields }
  for (const name of names) {
    const value = out[name]
    if (typeof value === 'number') out[name] = fn(value)
    else if (Array.isArray(value)) out[name] = value.map((v) => (typeof v === 'number' ? fn(v) : v))
  }
  return out
}

/** Longueurs listées : mm → m. */
export function lengthsToMetres(fields: Fields, names: readonly string[]): Fields {
  return convert(fields, names, mmToM)
}

/** Longueurs listées : m → mm. */
export function lengthsToMillimetres(fields: Fields, names: readonly string[]): Fields {
  return convert(fields, names, mToMm)
}
