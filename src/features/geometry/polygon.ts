import type { Point } from './viewport'

/** `[x1, y1, x2, y2, …]` → liste de points. Un éventuel nombre impair est ignoré. */
export function toPoints(flat: readonly number[]): Point[] {
  const points: Point[] = []
  for (let i = 0; i + 1 < flat.length; i += 2) points.push({ x: flat[i], y: flat[i + 1] })
  return points
}

/** Liste de points → `[x1, y1, x2, y2, …]`. */
export function flattenPoints(points: readonly Point[]): number[] {
  return points.flatMap((p) => [p.x, p.y])
}

export function pointDistance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

/** Longueur d'une polyligne ouverte : somme des segments. */
export function polylineLength(flat: readonly number[]): number {
  const points = toPoints(flat)
  let total = 0
  for (let i = 1; i < points.length; i++) total += pointDistance(points[i - 1], points[i])
  return total
}

/** Aire signée du polygone fermé (formule du lacet) : positive ou négative selon le sens de parcours. */
function signedArea(points: readonly Point[]): number {
  let sum = 0
  for (let i = 0; i < points.length; i++) {
    const a = points[i]
    const b = points[(i + 1) % points.length]
    sum += a.x * b.y - b.x * a.y
  }
  return sum / 2
}

/** Aire d'un polygone fermé (le dernier point rejoint le premier), même dans les deux sens. */
export function polygonArea(flat: readonly number[]): number {
  const points = toPoints(flat)
  return points.length < 3 ? 0 : Math.abs(signedArea(points))
}

/** Périmètre d'un polygone fermé : on ajoute le côté qui ramène au premier point. */
export function polygonPerimeter(flat: readonly number[]): number {
  const points = toPoints(flat)
  if (points.length < 2) return 0
  let total = 0
  for (let i = 0; i < points.length; i++) {
    total += pointDistance(points[i], points[(i + 1) % points.length])
  }
  return total
}

/**
 * Centre de gravité du polygone (sert à placer l'étiquette d'une pièce).
 * Pour un polygone aplati (aire nulle) on retombe sur la moyenne des points.
 */
export function polygonCentroid(flat: readonly number[]): Point | null {
  const points = toPoints(flat)
  if (points.length === 0) return null

  const area = signedArea(points)
  if (points.length < 3 || Math.abs(area) < 1e-9) {
    return {
      x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
      y: points.reduce((sum, p) => sum + p.y, 0) / points.length,
    }
  }

  let cx = 0
  let cy = 0
  for (let i = 0; i < points.length; i++) {
    const a = points[i]
    const b = points[(i + 1) % points.length]
    const cross = a.x * b.y - b.x * a.y
    cx += (a.x + b.x) * cross
    cy += (a.y + b.y) * cross
  }
  return { x: cx / (6 * area), y: cy / (6 * area) }
}
