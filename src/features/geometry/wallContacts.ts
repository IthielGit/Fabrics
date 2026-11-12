import type { WallElement } from '../../types/document'
import { toPoints } from './polygon'
import type { Point } from './viewport'

/**
 * Contacts entre les murs d'un niveau : raccords en T (corrigés dans les métrés) et irrégularités de
 * dessin (écart entre deux murs, murs superposés), signalées à l'utilisateur avec une correction.
 * Fonctions pures, en mm.
 *
 * Un mur se dessine sur son axe. À un angle en L (deux murs qui se terminent au même point), le coin
 * extérieur manque et le coin intérieur est compté deux fois : les deux s'annulent. À un T (un mur
 * qui se termine sur l'axe d'un autre), le bout du premier mur est compté dans l'épaisseur du second :
 * `tJunctionAdjustments` donne ce qu'il faut retirer.
 */

/** Deux points à moins de cet écart (mm) se touchent. */
const TOUCH = 1
/** Un bout de mur à moins de cet écart (mm) d'un autre mur, sans le toucher, est un écart à corriger. */
export const GAP_MAX = 50
/** Un T ou un écart ne se corrige que si les deux murs sont à peu près perpendiculaires : |cos| ≤ sin 3°. */
const PERPENDICULAR_COS = Math.sin((3 * Math.PI) / 180)
/** Un écart n'est cherché qu'avec un mur assez en travers : |sin| ≥ 0,5 (30°). Sinon : murs parallèles voisins. */
const MIN_CROSS_SIN = 0.5
/** Deux murs sont parallèles si |sin| de leur angle ≤ sin 1°. */
const PARALLEL_SIN = Math.sin(Math.PI / 180)
/** Un chevauchement plus court que cela (mm) n'est pas signalé. */
const MIN_OVERLAP = 10

/** Modification d'un sommet d'un mur : le sommet `pointIndex` (0 = premier) va en `to`. */
export interface WallFix {
  wallId: string
  pointIndex: number
  to: Point
}

export type WallIssue =
  | {
      kind: 'wallGap'
      /** Mur dont le bout est à corriger, puis le mur qu'il devrait toucher. */
      wallId: string
      otherWallId: string
      /** Écart visible, en mm (entre le bout du mur et la face ou le bout de l'autre mur). */
      gap: number
      fix: WallFix
    }
  | {
      kind: 'wallOverlap'
      wallIds: [string, string]
      /** Longueur commune, en mm. */
      length: number
      fix: WallFix | null
    }

interface Segment {
  wall: WallElement
  /** Rang du segment dans le tracé. */
  index: number
  a: Point
  b: Point
  length: number
  /** Direction unitaire de a vers b. */
  dir: Point
}

interface WallEnd {
  wall: WallElement
  /** Rang du sommet (0 = premier, n-1 = dernier). */
  pointIndex: number
  point: Point
  /** Direction unitaire qui sort du mur par ce bout. */
  out: Point
  /** Le segment du mur qui touche ce bout. */
  segment: Segment
}

const dot = (p: Point, q: Point) => p.x * q.x + p.y * q.y
const cross = (p: Point, q: Point) => p.x * q.y - p.y * q.x
const distance = (p: Point, q: Point) => Math.hypot(p.x - q.x, p.y - q.y)

function segmentsOf(wall: WallElement): Segment[] {
  const points = toPoints(wall.points)
  const result: Segment[] = []
  for (let i = 0; i + 1 < points.length; i++) {
    const a = points[i]
    const b = points[i + 1]
    const length = distance(a, b)
    if (length < 1e-6) continue
    result.push({ wall, index: i, a, b, length, dir: { x: (b.x - a.x) / length, y: (b.y - a.y) / length } })
  }
  return result
}

/** Bouts libres d'un mur : le premier et le dernier sommet d'un tracé ouvert. */
function endsOf(wall: WallElement, segments: readonly Segment[]): WallEnd[] {
  const points = toPoints(wall.points)
  if (points.length < 2 || segments.length === 0) return []
  const first = points[0]
  const last = points[points.length - 1]
  if (points.length >= 4 && distance(first, last) < TOUCH) return [] // contour fermé
  const startSegment = segments.find((s) => s.index === 0)
  const endSegment = segments.find((s) => s.index === points.length - 2)
  const result: WallEnd[] = []
  if (startSegment) {
    result.push({ wall, pointIndex: 0, point: first, out: { x: -startSegment.dir.x, y: -startSegment.dir.y }, segment: startSegment })
  }
  if (endSegment) {
    result.push({ wall, pointIndex: points.length - 1, point: last, out: endSegment.dir, segment: endSegment })
  }
  return result
}

/** Position d'un point par rapport à un segment : le long (`t`, 0 à longueur) et en travers (`side`, signé). */
function locate(point: Point, segment: Segment): { t: number; side: number } {
  const v = { x: point.x - segment.a.x, y: point.y - segment.a.y }
  return { t: dot(v, segment.dir), side: cross(segment.dir, v) }
}

/** Le point est-il dans la matière du segment (son rectangle, bouts droits) ? */
function insideMaterial(point: Point, segment: Segment): boolean {
  const { t, side } = locate(point, segment)
  return t >= -TOUCH && t <= segment.length + TOUCH && Math.abs(side) <= segment.wall.thickness / 2 + TOUCH
}

interface Analysis {
  walls: readonly WallElement[]
  segments: Segment[]
  ends: WallEnd[]
}

function analyse(walls: readonly WallElement[]): Analysis {
  const segments: Segment[] = []
  const ends: WallEnd[] = []
  for (const wall of walls) {
    const own = segmentsOf(wall)
    segments.push(...own)
    ends.push(...endsOf(wall, own))
  }
  return { walls, segments, ends }
}

/** Un autre mur touche-t-il ce bout (dans sa matière, ou par l'un de ses bouts) ? */
function isConnected(end: WallEnd, analysis: Analysis): boolean {
  for (const segment of analysis.segments) {
    if (segment.wall.id === end.wall.id) continue
    if (insideMaterial(end.point, segment)) return true
    if (distance(end.point, segment.a) <= TOUCH || distance(end.point, segment.b) <= TOUCH) return true
  }
  return false
}

/** Ce que les raccords en T changent pour un mur, en mm (voir `tJunctionAdjustments`). */
export interface TAdjustment {
  /** Surface du mur comptée à tort dans l'épaisseur d'un autre mur, en mm² (à multiplier par la hauteur). */
  overlapArea: number
  /** Longueur des faces cachée dans un autre mur, en mm (deux faces de chaque bout qui y entre). */
  hiddenFaces: number
  /** Longueur de face recouverte par un mur qui s'y raccorde, en mm. */
  coveredFace: number
}

/**
 * Raccords en T : un mur qui se termine contre un autre (sur son axe, ou entre son axe et sa face).
 * Son bout entre dans l'épaisseur de l'autre mur : `overlapArea` est comptée deux fois dans le
 * volume, `hiddenFaces` n'est pas visible, et le mur touché perd `coveredFace` de face. Les angles en
 * L ne sont pas touchés (leurs erreurs s'annulent) ; seuls les murs à peu près perpendiculaires sont
 * corrigés, et un bout posé sur un sommet d'un tracé à plusieurs côtés est laissé tel quel.
 */
export function tJunctionAdjustments(walls: readonly WallElement[]): Map<string, TAdjustment> {
  const analysis = analyse(walls)
  const result = new Map<string, TAdjustment>()
  const entry = (id: string): TAdjustment => {
    const found = result.get(id)
    if (found) return found
    const created = { overlapArea: 0, hiddenFaces: 0, coveredFace: 0 }
    result.set(id, created)
    return created
  }

  for (const end of analysis.ends) {
    for (const target of analysis.segments) {
      if (target.wall.id === end.wall.id) continue
      if (Math.abs(dot(end.out, target.dir)) > PERPENDICULAR_COS) continue
      const { t, side } = locate(end.point, target)
      // Au milieu du segment seulement : près d'un sommet, le raccord est un angle.
      if (t <= TOUCH || t >= target.length - TOUCH) continue
      const half = target.wall.thickness / 2
      // Distance parcourue par le bout au-delà de l'axe du mur touché (négative : il s'arrête avant).
      const normal = { x: -target.dir.y, y: target.dir.x }
      const beyond = side * dot(normal, end.out)
      if (Math.abs(side) > half + TOUCH) continue // le bout n'est pas dans l'épaisseur du mur touché
      const depth = Math.min(Math.max(beyond + half, 0), target.wall.thickness)
      const own = entry(end.wall.id)
      own.overlapArea += end.wall.thickness * depth
      own.hiddenFaces += 2 * depth
      entry(target.wall.id).coveredFace += end.wall.thickness
    }
  }
  return result
}

/** Intersection de la droite du bout (`end.point + s·end.out`) avec la droite du segment. */
function lineHit(end: WallEnd, target: Segment): { point: Point; s: number; t: number } | null {
  const denominator = cross(end.out, target.dir)
  if (Math.abs(denominator) < 1e-9) return null
  const delta = { x: target.a.x - end.point.x, y: target.a.y - end.point.y }
  const s = cross(delta, target.dir) / denominator
  const t = cross(delta, end.out) / denominator
  return { point: { x: end.point.x + end.out.x * s, y: end.point.y + end.out.y * s }, s, t }
}

function gapIssues(analysis: Analysis): WallIssue[] {
  const issues: WallIssue[] = []
  const reported = new Set<string>()
  for (const end of analysis.ends) {
    if (isConnected(end, analysis)) continue
    const candidates: { gap: number; otherWallId: string; to: Point }[] = []
    const consider = (gap: number, otherWallId: string, to: Point) => {
      if (gap > TOUCH && gap <= GAP_MAX) candidates.push({ gap, otherWallId, to })
    }
    for (const other of analysis.ends) {
      if (other.wall.id === end.wall.id) continue
      consider(distance(end.point, other.point), other.wall.id, other.point)
    }
    for (const target of analysis.segments) {
      if (target.wall.id === end.wall.id) continue
      if (Math.abs(cross(end.out, target.dir)) < MIN_CROSS_SIN) continue
      const hit = lineHit(end, target)
      if (!hit || hit.s <= 0 || hit.t < 0 || hit.t > target.length) continue
      // Le mur touché commence à sa face : l'écart visible va du bout à cette face.
      const gap = hit.s * Math.abs(cross(end.out, target.dir)) - target.wall.thickness / 2
      consider(gap, target.wall.id, hit.point)
    }
    if (candidates.length === 0) continue
    const { gap, otherWallId, to } = candidates.reduce((best, c) => (c.gap < best.gap ? c : best))
    // Deux bouts qui se font face (angle en L) : une seule alerte pour la paire.
    const key = [end.wall.id, otherWallId].sort().join('|')
    if (reported.has(key)) continue
    reported.add(key)
    issues.push({ kind: 'wallGap', wallId: end.wall.id, otherWallId, gap, fix: { wallId: end.wall.id, pointIndex: end.pointIndex, to } })
  }
  return issues
}

function overlapIssues(analysis: Analysis): WallIssue[] {
  const issues: WallIssue[] = []
  const reported = new Set<string>()
  const { segments } = analysis
  for (let i = 0; i < segments.length; i++) {
    for (let j = i + 1; j < segments.length; j++) {
      const a = segments[i]
      const b = segments[j]
      if (a.wall.id === b.wall.id) continue
      if (Math.abs(cross(a.dir, b.dir)) > PARALLEL_SIN) continue
      const b0 = locate(b.a, a)
      const b1 = locate(b.b, a)
      const apart = Math.max(Math.abs(b0.side), Math.abs(b1.side))
      if (apart >= Math.min(a.wall.thickness, b.wall.thickness) / 2) continue
      const lo = Math.max(0, Math.min(b0.t, b1.t))
      const hi = Math.min(a.length, Math.max(b0.t, b1.t))
      const overlap = hi - lo
      if (overlap <= MIN_OVERLAP) continue
      const key = [a.wall.id, b.wall.id].sort().join('|')
      if (reported.has(key)) continue
      reported.add(key)
      issues.push({ kind: 'wallOverlap', wallIds: [a.wall.id, b.wall.id], length: overlap, fix: overlapFix(a, b, b0.t, b1.t, apart) })
    }
  }
  return issues
}

/**
 * Correction d'un chevauchement : le bout de `b` qui entre dans `a` est ramené au bout de `a`, ce qui
 * fait se toucher les deux murs bout à bout. Seulement pour des murs alignés, avec un seul bout de
 * `b` dans `a`, et si ce bout est bien une extrémité du tracé de `b`.
 */
function overlapFix(a: Segment, b: Segment, tStart: number, tEnd: number, apart: number): WallFix | null {
  if (apart > TOUCH) return null
  const inside = (t: number) => t > MIN_OVERLAP && t < a.length - MIN_OVERLAP
  const startInside = inside(tStart)
  const endInside = inside(tEnd)
  if (startInside === endInside) return null // `b` entier dans `a`, ou ne dépasse pas : rien à ramener
  const insideT = startInside ? tStart : tEnd
  const otherT = startInside ? tEnd : tStart
  const target = otherT >= insideT ? a.length : 0
  const to = { x: a.a.x + a.dir.x * target, y: a.a.y + a.dir.y * target }
  const pointCount = toPoints(b.wall.points).length
  const pointIndex = startInside ? b.index : b.index + 1
  if (pointIndex !== 0 && pointIndex !== pointCount - 1) return null
  return { wallId: b.wall.id, pointIndex, to }
}

/** Irrégularités de dessin des murs d'un niveau : écarts à corriger et murs superposés. */
export function wallIssues(walls: readonly WallElement[]): WallIssue[] {
  const analysis = analyse(walls)
  return [...gapIssues(analysis), ...overlapIssues(analysis)]
}

/** Applique une correction : renvoie le mur avec son sommet déplacé. */
export function applyWallFix(wall: WallElement, fix: WallFix): WallElement {
  const points = [...wall.points]
  points[fix.pointIndex * 2] = fix.to.x
  points[fix.pointIndex * 2 + 1] = fix.to.y
  return { ...wall, points }
}
