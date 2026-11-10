import type { AxisElement, CanvasElement } from '../../types/document'
import { toPoints } from './polygon'
import type { Point } from './viewport'
import { segmentIntersection } from './walls'

/** Segment d'un axe (de son premier à son deuxième point). */
export interface AxisSegment {
  a: Point
  b: Point
}

/** Rayon d'une bulle d'axe, en mm (bulle de 500 mm de diamètre ≈ 10 mm à l'échelle 1:50). */
export const AXIS_BUBBLE_RADIUS_MM = 250

/** Sens d'un axe : `horizontal` s'il va plutôt de gauche à droite, `vertical` sinon. */
export type AxisFamily = 'horizontal' | 'vertical'

export function axisFamily(points: readonly number[]): AxisFamily {
  const [x1, y1, x2, y2] = points
  return Math.abs(x2 - x1) >= Math.abs(y2 - y1) ? 'horizontal' : 'vertical'
}

// --- Étiquettes : lettres (A, B… Z, AA, AB…) pour les axes horizontaux, nombres (1, 2…) pour les verticaux ---

/** 1 → « A », 26 → « Z », 27 → « AA » (numérotation bijective en base 26). */
export function lettersLabel(index: number): string {
  let n = Math.floor(index)
  if (n < 1) return ''
  let label = ''
  while (n > 0) {
    const rest = (n - 1) % 26
    label = String.fromCharCode(65 + rest) + label
    n = Math.floor((n - 1) / 26)
  }
  return label
}

/** « A » → 1, « AA » → 27 ; `null` si l'étiquette n'est pas une suite de lettres. */
export function parseLettersLabel(label: string): number | null {
  const text = label.trim().toUpperCase()
  if (!/^[A-Z]+$/.test(text)) return null
  let index = 0
  for (const char of text) index = index * 26 + (char.charCodeAt(0) - 64)
  return index
}

/** « 3 » → 3 ; `null` si l'étiquette n'est pas un entier positif. */
export function parseNumberLabel(label: string): number | null {
  const text = label.trim()
  if (!/^[0-9]+$/.test(text)) return null
  const value = Number(text)
  return value >= 1 ? value : null
}

/**
 * Étiquette du prochain axe : la suite de sa famille (lettres pour un axe horizontal, nombres pour
 * un axe vertical), à la suite de la plus grande étiquette existante. Les étiquettes qui ne
 * suivent pas la suite (renommées à la main) sont ignorées. Un axe parallèle à « A, B » reçoit « C ».
 */
export function nextAxisLabel(
  elements: readonly CanvasElement[],
  points: readonly number[],
): string {
  const family = axisFamily(points)
  const parse = family === 'horizontal' ? parseLettersLabel : parseNumberLabel
  let highest = 0
  for (const element of elements) {
    if (element.type !== 'axis' || axisFamily(element.points) !== family) continue
    highest = Math.max(highest, parse(element.label) ?? 0)
  }
  return family === 'horizontal' ? lettersLabel(highest + 1) : String(highest + 1)
}

// --- Géométrie ---

export interface AxisGeometry {
  /** Extrémités de la ligne, arrêtée au bord des bulles. */
  line: [Point, Point]
  /** Centres des bulles (une à chaque extrémité, hors de la ligne). */
  bubbles: [Point, Point]
  radius: number
  length: number
}

/**
 * Dessin d'un axe : la ligne s'arrête au bord de chaque bulle, centrée sur le prolongement de
 * l'axe. `null` si les deux points sont confondus. `radius` peut être agrandi pour rester lisible
 * à petit zoom.
 */
export function axisGeometry(
  points: readonly number[],
  radius: number = AXIS_BUBBLE_RADIUS_MM,
): AxisGeometry | null {
  const [x1, y1, x2, y2] = points
  const length = Math.hypot(x2 - x1, y2 - y1)
  if (length === 0) return null
  const ux = (x2 - x1) / length
  const uy = (y2 - y1) / length
  const start = { x: x1, y: y1 }
  const end = { x: x2, y: y2 }
  return {
    line: [start, end],
    bubbles: [
      { x: x1 - ux * radius, y: y1 - uy * radius },
      { x: x2 + ux * radius, y: y2 + uy * radius },
    ],
    radius,
    length,
  }
}

/** Boîte englobante des extrémités et des bulles (pour l'emprise exportée). */
export function axisBubblePoints(points: readonly number[]): Point[] {
  const geometry = axisGeometry(points)
  if (!geometry) return toPoints(points)
  const { bubbles, radius } = geometry
  return bubbles.flatMap((c) => [
    { x: c.x - radius, y: c.y - radius },
    { x: c.x + radius, y: c.y + radius },
  ])
}

/** Segments des axes visibles (`excludeIds` écarte par exemple l'axe qu'on est en train de modifier). */
export function collectAxisSegments(
  elements: readonly CanvasElement[],
  excludeIds: ReadonlySet<string> = new Set(),
): AxisSegment[] {
  return elements
    .filter((el): el is AxisElement => el.type === 'axis' && !el.hidden && !excludeIds.has(el.id))
    .map((axis) => ({
      a: { x: axis.points[0], y: axis.points[1] },
      b: { x: axis.points[2], y: axis.points[3] },
    }))
}

/** Croisements des axes entre eux (deux à deux) : points où des axes se coupent. */
export function axisIntersections(axes: readonly AxisSegment[]): Point[] {
  const points: Point[] = []
  for (let i = 0; i < axes.length; i++) {
    for (let j = i + 1; j < axes.length; j++) {
      const point = segmentIntersection(axes[i], axes[j])
      if (point) points.push(point)
    }
  }
  return points
}

/**
 * Point de l'axe le plus proche de `point` à moins de `threshold` (projection perpendiculaire,
 * bornée au segment), ou `null`.
 */
export function nearestPointOnAxes(
  point: Point,
  axes: readonly AxisSegment[],
  threshold: number,
): Point | null {
  let best: Point | null = null
  let bestDistance = threshold
  for (const { a, b } of axes) {
    const dx = b.x - a.x
    const dy = b.y - a.y
    const lengthSquared = dx * dx + dy * dy
    if (lengthSquared === 0) continue
    // Axes horizontaux et verticaux (les plus courants) : valeurs exactes, sans arrondi parasite.
    const clamp = (value: number, from: number, to: number) =>
      Math.max(Math.min(from, to), Math.min(Math.max(from, to), value))
    let projected: Point
    if (dy === 0) {
      projected = { x: clamp(point.x, a.x, b.x), y: a.y }
    } else if (dx === 0) {
      projected = { x: a.x, y: clamp(point.y, a.y, b.y) }
    } else {
      const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared))
      projected = { x: a.x + t * dx, y: a.y + t * dy }
    }
    const distance = Math.hypot(projected.x - point.x, projected.y - point.y)
    if (distance <= bestDistance) {
      best = projected
      bestDistance = distance
    }
  }
  return best
}
