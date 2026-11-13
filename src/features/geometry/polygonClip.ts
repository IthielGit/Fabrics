import type { Point } from './viewport'

/** Aire signée (formule du lacet) : positive dans le sens trigonométrique de l'écran (y vers le bas : horaire). */
function signedArea(points: readonly Point[]): number {
  let sum = 0
  for (let i = 0; i < points.length; i++) {
    const p = points[i]
    const q = points[(i + 1) % points.length]
    sum += p.x * q.y - q.x * p.y
  }
  return sum / 2
}

/** Aire d'un polygone fermé (mm²), toujours positive. */
export function areaOf(points: readonly Point[]): number {
  return points.length < 3 ? 0 : Math.abs(signedArea(points))
}

/** Découpe `subject` (polygone quelconque) par une seule arête orientée `a → b` : on garde le côté gauche. */
function clipByEdge(subject: readonly Point[], a: Point, b: Point): Point[] {
  const side = (p: Point) => (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x)
  const out: Point[] = []
  for (let i = 0; i < subject.length; i++) {
    const current = subject[i]
    const previous = subject[(i + subject.length - 1) % subject.length]
    const sc = side(current)
    const sp = side(previous)
    if (sc >= 0) {
      if (sp < 0) out.push(crossing(previous, current, sp, sc))
      out.push(current)
    } else if (sp >= 0) {
      out.push(crossing(previous, current, sp, sc))
    }
  }
  return out
}

function crossing(p: Point, q: Point, sp: number, sq: number): Point {
  const t = sp / (sp - sq)
  return { x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t }
}

/**
 * Partie de `subject` (polygone simple, convexe ou non) qui se trouve dans `clip` (polygone **convexe**,
 * dans un sens ou l'autre). Renvoie la liste des sommets (vide si rien ne se recoupe). Pour un
 * sujet non convexe, le résultat peut contenir des arêtes superposées : son aire reste juste.
 */
export function clipToConvex(subject: readonly Point[], clip: readonly Point[]): Point[] {
  if (subject.length < 3 || clip.length < 3) return []
  // Le test « côté gauche » suppose un parcours dans le sens positif du lacet.
  const ring = signedArea(clip) >= 0 ? clip : [...clip].reverse()
  let result = [...subject]
  for (let i = 0; i < ring.length && result.length > 0; i++) {
    result = clipByEdge(result, ring[i], ring[(i + 1) % ring.length])
  }
  return result
}

/**
 * Partie d'un polygone convexe où `a·x + b·y + c < 0`, à l'intérieur du demi-plan. Renvoie les sommets
 * (vide si le polygone est entièrement de l'autre côté).
 */
export function clipToHalfPlane(polygon: readonly Point[], a: number, b: number, c: number): Point[] {
  const value = (p: Point) => a * p.x + b * p.y + c
  const out: Point[] = []
  for (let i = 0; i < polygon.length; i++) {
    const current = polygon[i]
    const previous = polygon[(i + polygon.length - 1) % polygon.length]
    const vc = value(current)
    const vp = value(previous)
    const currentIn = vc < 0
    const previousIn = vp < 0
    if (currentIn) {
      if (!previousIn) out.push(crossing(previous, current, -vp, -vc))
      out.push(current)
    } else if (previousIn) {
      out.push(crossing(previous, current, -vp, -vc))
    }
  }
  return out
}
