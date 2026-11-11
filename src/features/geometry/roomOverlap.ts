import type { CanvasElement, RoomElement } from '../../types/document'

type Pt = readonly [number, number]

/** Décalage vers l'intérieur (mm) du point d'essai : sous ce seuil, un recouvrement est ignoré. */
const PROBE_MM = 1
/** Sous cette longueur (mm), un tronçon de côté est trop court pour être testé. */
const MIN_PIECE_MM = 1

/** Sommets absolus d'une pièce (les points sont absolus ; x et y décalent la pièce déplacée). */
function absolutePoints(room: RoomElement): Pt[] {
  const points: Pt[] = []
  for (let i = 0; i + 1 < room.points.length; i += 2) {
    points.push([room.points[i] + room.x, room.points[i + 1] + room.y])
  }
  return points
}

function signedArea(points: readonly Pt[]): number {
  let sum = 0
  for (let i = 0; i < points.length; i++) {
    const [ax, ay] = points[i]
    const [bx, by] = points[(i + 1) % points.length]
    sum += ax * by - bx * ay
  }
  return sum / 2
}

/** Point dans le polygone (rayon horizontal). Un point exactement sur le bord est indéterminé : voir l'usage. */
function inside(point: Pt, polygon: readonly Pt[]): boolean {
  let result = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]
    const [xj, yj] = polygon[j]
    if (yi > point[1] !== yj > point[1] && point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi) {
      result = !result
    }
  }
  return result
}

/** Paramètres t (0..1) de A→B où le segment croise le segment C→D ; vide si parallèles ou sans croisement. */
function crossingParam(a: Pt, b: Pt, c: Pt, d: Pt): number | null {
  const rx = b[0] - a[0]
  const ry = b[1] - a[1]
  const sx = d[0] - c[0]
  const sy = d[1] - c[1]
  const denominator = rx * sy - ry * sx
  if (Math.abs(denominator) < 1e-9) return null
  const t = ((c[0] - a[0]) * sy - (c[1] - a[1]) * sx) / denominator
  const u = ((c[0] - a[0]) * ry - (c[1] - a[1]) * rx) / denominator
  return t > 0 && t < 1 && u >= 0 && u <= 1 ? t : null
}

/**
 * Vrai si l'intérieur de `a` rencontre celui de `b`. On découpe chaque côté de `a` là où il croise
 * `b`, puis on regarde juste à l'intérieur de `a` au milieu de chaque tronçon : si ce point est
 * aussi à l'intérieur de `b`, les deux surfaces se superposent. Deux pièces mitoyennes (côté
 * commun, intérieurs de part et d'autre) ne se recouvrent donc pas.
 */
function interiorMeetsInterior(a: readonly Pt[], b: readonly Pt[]): boolean {
  const orientation = signedArea(a) > 0 ? 1 : -1
  for (let i = 0; i < a.length; i++) {
    const p = a[i]
    const q = a[(i + 1) % a.length]
    const cuts = [0, 1]
    for (let j = 0; j < b.length; j++) {
      const t = crossingParam(p, q, b[j], b[(j + 1) % b.length])
      if (t !== null) cuts.push(t)
    }
    cuts.sort((x, y) => x - y)
    const length = Math.hypot(q[0] - p[0], q[1] - p[1])
    if (length < MIN_PIECE_MM) continue
    // Normale vers l'intérieur de `a` (le sens de parcours donne le côté).
    const nx = (-(q[1] - p[1]) / length) * orientation
    const ny = ((q[0] - p[0]) / length) * orientation
    for (let k = 0; k + 1 < cuts.length; k++) {
      if ((cuts[k + 1] - cuts[k]) * length < MIN_PIECE_MM) continue
      const mid = (cuts[k] + cuts[k + 1]) / 2
      const probe: Pt = [p[0] + (q[0] - p[0]) * mid + nx * PROBE_MM, p[1] + (q[1] - p[1]) * mid + ny * PROBE_MM]
      if (inside(probe, a) && inside(probe, b)) return true
    }
  }
  return false
}

/** Vrai si deux pièces se superposent sur une surface réelle (côté commun ou simple contact : non). */
export function roomsOverlap(first: RoomElement, second: RoomElement): boolean {
  const a = absolutePoints(first)
  const b = absolutePoints(second)
  if (a.length < 3 || b.length < 3) return false
  return interiorMeetsInterior(a, b) || interiorMeetsInterior(b, a)
}

/**
 * Identifiants des pièces qui en recouvrent une autre sur le même niveau. Une pièce commune à tous
 * les niveaux (sans niveau) est comparée à toutes les autres.
 */
export function overlappingRoomIds(elements: readonly CanvasElement[]): ReadonlySet<string> {
  const rooms = elements.filter((el): el is RoomElement => el.type === 'room')
  const ids = new Set<string>()
  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const a = rooms[i]
      const b = rooms[j]
      const sameLevel = a.levelId === undefined || b.levelId === undefined || a.levelId === b.levelId
      if (sameLevel && roomsOverlap(a, b)) {
        ids.add(a.id)
        ids.add(b.id)
      }
    }
  }
  return ids
}

let cache: { elements: readonly CanvasElement[]; ids: ReadonlySet<string> } | null = null

/** Même résultat que `overlappingRoomIds`, gardé tant que le tableau d'éléments ne change pas (pour un sélecteur). */
export function overlappingRoomIdsCached(elements: readonly CanvasElement[]): ReadonlySet<string> {
  if (cache?.elements === elements) return cache.ids
  const ids = overlappingRoomIds(elements)
  cache = { elements, ids }
  return ids
}
