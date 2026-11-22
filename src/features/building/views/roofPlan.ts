/**
 * Plan de toiture (M20 20.1b, référence Villa ROOMIT page 7) : contour de la toiture en double trait
 * (bord de la toiture, épaisseur `edge`), flèches « Pente x % » dans le sens de la descente, escalier
 * d'accès au toit, cotes. Pas de pièces ni de surfaces (D20-10). Fonction pure : les contours et les
 * pentes sont lus dans le modèle par l'appelant (`scene/view/roofPlanData.ts`), en mm.
 */
import type { DrawLine, DrawText, Drawing, PlanOverlay } from './drawing'
import { autoFontMm } from './drawing'

type Pt = [number, number]

export interface RoofPlanInput {
  outlines: { outer: Pt[]; holes: Pt[][] }[]
  slopes: { x: number; y: number; dx: number; dy: number; percent: number }[]
}

export interface RoofPlanLabels {
  /** Texte d'une flèche de pente, ex. « Pente 1 % ». */
  slope: (percent: number) => string
}

/** Épaisseur du bord de toiture dessinée en double trait (mm) : 100 mm comme la référence. */
export const ROOF_EDGE_MM = 100

const signedArea = (ring: readonly Pt[]) =>
  ring.reduce((sum, p, i) => {
    const q = ring[(i + 1) % ring.length]
    return sum + p[0] * q[1] - q[0] * p[1]
  }, 0) / 2

/** Anneau sans le point de fermeture répété ni les sommets alignés. */
function cleanRing(ring: readonly Pt[]): Pt[] {
  const pts = ring.length > 1 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1] ? ring.slice(0, -1) : [...ring]
  return pts.filter((b, i) => {
    const a = pts[(i + pts.length - 1) % pts.length]
    const c = pts[(i + 1) % pts.length]
    return Math.abs((b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0])) > 1e-6
  })
}

/**
 * Anneau décalé vers l'intérieur de la surface de `d` (mm), angles vifs (chaque côté est déplacé,
 * puis les côtés voisins sont recoupés). `inside` : +1 pour un contour extérieur, −1 pour un trou.
 */
export function offsetRing(ring: readonly Pt[], d: number, inside: 1 | -1 = 1): Pt[] {
  const pts = cleanRing(ring)
  const n = pts.length
  if (n < 3) return pts
  // Normale vers l'intérieur : à gauche du sens de parcours pour un anneau trigonométrique (aire > 0).
  const orient = Math.sign(signedArea(pts)) * inside
  const lines = pts.map((p, i) => {
    const q = pts[(i + 1) % n]
    const len = Math.hypot(q[0] - p[0], q[1] - p[1])
    const ux = (q[0] - p[0]) / len
    const uy = (q[1] - p[1]) / len
    const nx = -uy * orient
    const ny = ux * orient
    return { p: [p[0] + nx * d, p[1] + ny * d] as Pt, u: [ux, uy] as Pt }
  })
  return lines.map((cur, i) => {
    const prev = lines[(i + n - 1) % n]
    const det = prev.u[0] * cur.u[1] - prev.u[1] * cur.u[0]
    if (Math.abs(det) < 1e-12) return cur.p
    const t = ((cur.p[0] - prev.p[0]) * cur.u[1] - (cur.p[1] - prev.p[1]) * cur.u[0]) / det
    return [prev.p[0] + prev.u[0] * t, prev.p[1] + prev.u[1] * t] as Pt
  })
}

const ringLines = (ring: readonly Pt[], weight: DrawLine['weight']): DrawLine[] =>
  ring.map((p, i) => {
    const q = ring[(i + 1) % ring.length]
    return { x1: p[0], y1: p[1], x2: q[0], y2: q[1], ...(weight ? { weight } : {}) }
  })

/** Flèche de pente : trait, pointe en chevron à l'aval, texte le long de la flèche (côté gauche ou dessus). */
function slopeArrow(s: RoofPlanInput['slopes'][number], font: number, label: string): { lines: DrawLine[]; texts: DrawText[] } {
  const half = font * 7
  const tail: Pt = [s.x - s.dx * half, s.y - s.dy * half]
  const head: Pt = [s.x + s.dx * half, s.y + s.dy * half]
  const barb = font * 0.9
  // Pointe : deux traits à ±25° de la flèche, en arrière de la tête.
  const back = (angle: number): Pt => {
    const c = Math.cos(angle)
    const si = Math.sin(angle)
    const bx = -s.dx * c + s.dy * si
    const by = -s.dy * c - s.dx * si
    return [head[0] + bx * barb, head[1] + by * barb]
  }
  const a = back((25 * Math.PI) / 180)
  const b = back((-25 * Math.PI) / 180)
  const lines: DrawLine[] = [
    { x1: tail[0], y1: tail[1], x2: head[0], y2: head[1], weight: 'heavy' },
    { x1: head[0], y1: head[1], x2: a[0], y2: a[1], weight: 'heavy' },
    { x1: head[0], y1: head[1], x2: b[0], y2: b[1], weight: 'heavy' },
  ]
  // Texte parallèle à la flèche, lisible (jamais à l'envers) : angle dans [−90°, 90°[, une flèche
  // verticale se lit de bas en haut comme une cote verticale ; décalé d'une hauteur de texte.
  let angle = (Math.atan2(s.dy, s.dx) * 180) / Math.PI
  if (angle >= 90) angle -= 180
  if (angle < -90) angle += 180
  const rad = (angle * Math.PI) / 180
  // Décalage vers le « haut » du texte (perpendiculaire à sa ligne de base).
  const ox = Math.sin(rad) * font * 0.8
  const oy = -Math.cos(rad) * font * 0.8
  const texts: DrawText[] = [{ x: s.x + ox, y: s.y + oy, text: label, size: font, anchor: 'middle', ...(angle !== 0 ? { angle } : {}) }]
  return { lines, texts }
}

/**
 * Dessin du plan de toiture. `extras` : escalier d'accès (traits de Pascal) et cotes (fonction de la
 * hauteur de texte), en coordonnées du plan. `null` si rien à dessiner.
 */
export function roofPlanDrawing(
  input: RoofPlanInput,
  labels: RoofPlanLabels,
  fontMm?: number,
  extras: readonly (PlanOverlay | ((fontMm: number) => PlanOverlay | null) | null | undefined)[] = [],
): Drawing | null {
  const rings = input.outlines.flatMap((o) => [o.outer, ...o.holes])
  if (rings.length === 0) return null
  const all = rings.flat()
  let minX = Math.min(...all.map((p) => p[0]))
  let maxX = Math.max(...all.map((p) => p[0]))
  let minY = Math.min(...all.map((p) => p[1]))
  let maxY = Math.max(...all.map((p) => p[1]))
  const font = fontMm ?? autoFontMm(maxX - minX, maxY - minY)

  const lines: DrawLine[] = []
  const texts: DrawText[] = []
  for (const o of input.outlines) {
    lines.push(...ringLines(cleanRing(o.outer), 'cut'), ...ringLines(offsetRing(o.outer, ROOF_EDGE_MM, 1), undefined))
    for (const h of o.holes) lines.push(...ringLines(cleanRing(h), 'cut'), ...ringLines(offsetRing(h, ROOF_EDGE_MM, -1), undefined))
  }
  for (const s of input.slopes) {
    const arrow = slopeArrow(s, font, labels.slope(s.percent))
    lines.push(...arrow.lines)
    texts.push(...arrow.texts)
  }
  for (const item of extras) {
    // Cotes : construites avec la hauteur de texte du dessin.
    const extra = typeof item === 'function' ? item(font) : item
    if (!extra) continue
    lines.push(...extra.lines)
    texts.push(...extra.texts)
  }
  for (const l of lines) {
    minX = Math.min(minX, l.x1, l.x2)
    maxX = Math.max(maxX, l.x1, l.x2)
    minY = Math.min(minY, l.y1, l.y2)
    maxY = Math.max(maxY, l.y1, l.y2)
  }
  for (const t of texts) {
    minX = Math.min(minX, t.x - t.size * 4)
    maxX = Math.max(maxX, t.x + t.size * 4)
    minY = Math.min(minY, t.y - t.size * 4)
    maxY = Math.max(maxY, t.y + t.size * 4)
  }
  const margin = font * 2
  const dx = margin - minX
  const dy = margin - minY
  return {
    width: maxX - minX + margin * 2,
    height: maxY - minY + margin * 2,
    polygons: [],
    lines: lines.map((l) => ({ ...l, x1: l.x1 + dx, x2: l.x2 + dx, y1: l.y1 + dy, y2: l.y2 + dy })),
    texts: texts.map((t) => ({ ...t, x: t.x + dx, y: t.y + dy })),
  }
}
