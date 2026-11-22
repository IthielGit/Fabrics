/**
 * Toiture de plusieurs pans de Pascal comptée sur la réunion de ses pans (M20 20.1b, D20-15 : A).
 *
 * Les débords de deux pans voisins se recouvrent : compter chaque pan entier compte ces bandes deux
 * fois. Règle : chaque morceau du toit appartient au **premier pan** (ordre de la toiture) qui le
 * couvre.
 * - Surface en plan d'un pan = son emprise moins celles des pans précédents (exact).
 * - Surface réelle = surface en plan × le facteur de pente du pan (réelle ÷ en plan du pan entier) :
 *   exact pour plat, un pan, deux pans et croupe (une seule pente) ; au prorata pour les autres.
 * - Égouts (plat : aucun ; un pan : le côté bas ; deux pans : les deux côtés bas ; croupe : les
 *   quatre côtés) : un bout d'égout compte s'il n'est ni dans un pan précédent (bord compris), ni à
 *   l'intérieur d'un pan suivant : il est alors sur le vrai bord du toit, et une seule fois.
 * - Faîtages et arêtiers : inchangés ; à vérifier quand le pan est recouvert (point signalé).
 * Fonction pure, en mm.
 */
import { area, difference, union } from '@pascal-app/core'

export type Pt = [number, number]

export interface RoofPanInput {
  id: string
  kind: string
  /** Emprise du pan (débords compris), 4 coins dans l'ordre du repère du pan : (−x,−z), (+x,−z), (+x,+z), (−x,+z). */
  corners: Pt[]
  projectedArea: number
  realArea: number
  eaveLength: number
  ridgeLength: number
  hipLength: number
}

export interface RoofPanAdjusted {
  projectedArea: number
  realArea: number
  eaveLength: number
  /** Pan recouvert en partie par un autre pan de la même toiture. */
  overlapping: boolean
  /** Une quantité n'est pas exacte (faîtage, arêtiers, ou surface au prorata) : à vérifier. */
  toCheck: boolean
}

const EXACT_SLOPE_KINDS = new Set(['flat', 'shed', 'gable', 'hip'])

/** Côtés d'égout d'un pan, d'après sa forme (côtés : 0 arrière −z, 1 droite +x, 2 avant +z, 3 gauche −x). */
function eaveSides(kind: string): number[] | null {
  switch (kind) {
    case 'flat':
      return []
    case 'shed':
      return [2]
    case 'gable':
      return [0, 2]
    case 'hip':
      return [0, 1, 2, 3]
    default:
      return null
  }
}

const TOL = 0.5

function onSegment(p: Pt, a: Pt, b: Pt): boolean {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1])
  if (len < 1e-9) return Math.hypot(p[0] - a[0], p[1] - a[1]) <= TOL
  const cross = Math.abs((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) / len
  const t = ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1])) / (len * len)
  return cross <= TOL && t >= -TOL / len && t <= 1 + TOL / len
}

function inPolygon(ring: readonly Pt[], p: Pt): boolean {
  let hit = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) hit = !hit
  }
  return hit
}

const onBoundary = (ring: readonly Pt[], p: Pt) => ring.some((a, i) => onSegment(p, a, ring[(i + 1) % ring.length]))
const inClosed = (ring: readonly Pt[], p: Pt) => onBoundary(ring, p) || inPolygon(ring, p)
const inOpen = (ring: readonly Pt[], p: Pt) => !onBoundary(ring, p) && inPolygon(ring, p)

/** Paramètres (0..1) où le segment ab croise les côtés de l'anneau. */
function crossings(a: Pt, b: Pt, ring: readonly Pt[]): number[] {
  const out: number[] = []
  const rx = b[0] - a[0]
  const ry = b[1] - a[1]
  for (let i = 0; i < ring.length; i++) {
    const c = ring[i]
    const d = ring[(i + 1) % ring.length]
    const sx = d[0] - c[0]
    const sy = d[1] - c[1]
    const den = rx * sy - ry * sx
    if (Math.abs(den) < 1e-12) {
      // Côtés alignés : les extrémités du côté qui sont sur ab deviennent des coupures.
      for (const q of [c, d]) {
        if (onSegment(q, a, b)) out.push(((q[0] - a[0]) * rx + (q[1] - a[1]) * ry) / (rx * rx + ry * ry))
      }
      continue
    }
    const t = ((c[0] - a[0]) * sy - (c[1] - a[1]) * sx) / den
    const u = ((c[0] - a[0]) * ry - (c[1] - a[1]) * rx) / den
    if (t > 0 && t < 1 && u >= 0 && u <= 1) out.push(t)
  }
  return out
}

/** Longueur du côté ab qui est sur le vrai bord du toit (voir la règle en tête de fichier). */
function keptLength(a: Pt, b: Pt, earlier: readonly Pt[][], later: readonly Pt[][]): number {
  const ts = [0, 1, ...[...earlier, ...later].flatMap((ring) => crossings(a, b, ring))].filter((t) => t >= 0 && t <= 1).sort((x, y) => x - y)
  const len = Math.hypot(b[0] - a[0], b[1] - a[1])
  let kept = 0
  for (let i = 0; i + 1 < ts.length; i++) {
    if (ts[i + 1] - ts[i] < 1e-9) continue
    const t = (ts[i] + ts[i + 1]) / 2
    const m: Pt = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
    if (earlier.some((ring) => inClosed(ring, m)) || later.some((ring) => inOpen(ring, m))) continue
    kept += (ts[i + 1] - ts[i]) * len
  }
  return kept
}

/** Quantités des pans d'une même toiture, comptées sur la réunion des pans (dans l'ordre donné). */
export function adjustRoofPans(pans: readonly RoofPanInput[]): RoofPanAdjusted[] {
  return pans.map((pan, i) => {
    const earlier = pans.slice(0, i).map((p) => p.corners)
    const later = pans.slice(i + 1).map((p) => p.corners)
    const exclusive = earlier.length > 0 ? area(difference(pan.corners, union(earlier))) : area([{ outer: pan.corners, holes: [] }])
    const full = area([{ outer: pan.corners, holes: [] }])
    const covered = pans.some((other, j) => j !== i && area(difference(pan.corners, other.corners)) < full - 1)
    if (!covered) return { projectedArea: pan.projectedArea, realArea: pan.realArea, eaveLength: pan.eaveLength, overlapping: false, toCheck: false }
    const factor = pan.projectedArea > 0 ? pan.realArea / pan.projectedArea : 1
    const projectedArea = pan.projectedArea * (full > 0 ? exclusive / full : 0)
    const sides = eaveSides(pan.kind)
    const eaveLength =
      sides === null
        ? pan.eaveLength * (full > 0 ? exclusive / full : 0)
        : sides.reduce((sum, k) => sum + keptLength(pan.corners[k], pan.corners[(k + 1) % 4], earlier, later), 0)
    return {
      projectedArea,
      realArea: projectedArea * factor,
      eaveLength,
      overlapping: true,
      toCheck: !EXACT_SLOPE_KINDS.has(pan.kind) || pan.ridgeLength > 0 || pan.hipLength > 0,
    }
  })
}
