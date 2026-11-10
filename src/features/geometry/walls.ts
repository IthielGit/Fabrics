import { toPoints } from './polygon'
import type { Point } from './viewport'

export interface Segment {
  a: Point
  b: Point
}

export interface WallGeometry {
  /** Axe du mur : `[x1, y1, x2, y2, …]`. */
  points: readonly number[]
  /** Épaisseur en mm. */
  thickness: number
}

export interface WallFaces {
  /** Une face du mur (décalée à gauche de l'axe, dans le sens du tracé). */
  left: Point[]
  /** L'autre face. */
  right: Point[]
}

const EPSILON = 1e-9
/** Au-delà de ce rapport, un angle très aigu est « coupé » plutôt que prolongé en pointe. */
const MAX_MITER_RATIO = 4

function sameLocation(a: Point, b: Point): boolean {
  return Math.hypot(a.x - b.x, a.y - b.y) < 1e-6
}

/** Retire les points consécutifs identiques (un double-clic en crée un). */
function dedupe(points: Point[]): Point[] {
  return points.filter((p, i) => i === 0 || !sameLocation(p, points[i - 1]))
}

/**
 * Les deux faces d'un mur, à une demi-épaisseur de chaque côté de l'axe. Aux angles les faces se
 * rejoignent en onglet (coin net). Un axe qui revient à son point de départ est traité comme fermé :
 * son dernier angle est lui aussi raccordé.
 */
export function wallFaces(axis: readonly number[], thickness: number): WallFaces {
  let points = dedupe(toPoints(axis))
  if (points.length < 2) return { left: [], right: [] }

  const closed = points.length >= 4 && sameLocation(points[0], points[points.length - 1])
  if (closed) points = points.slice(0, -1)

  const half = thickness / 2
  const count = points.length
  const segmentCount = closed ? count : count - 1

  // Normale unitaire (à gauche) de chaque segment.
  const normals = Array.from({ length: segmentCount }, (_, i) => {
    const a = points[i]
    const b = points[(i + 1) % count]
    const length = Math.hypot(b.x - a.x, b.y - a.y)
    return { x: -(b.y - a.y) / length, y: (b.x - a.x) / length }
  })

  const offsets = points.map((_, j) => {
    const previous = closed ? normals[(j - 1 + segmentCount) % segmentCount] : normals[j - 1]
    const next = closed ? normals[j % segmentCount] : normals[j]
    if (!previous) return { x: next.x * half, y: next.y * half } // premier point
    if (!next) return { x: previous.x * half, y: previous.y * half } // dernier point

    const denominator = 1 + previous.x * next.x + previous.y * next.y
    // Longueur de la pointe d'onglet, en demi-épaisseurs : sqrt(2 / denominateur).
    const tooSharp = denominator < EPSILON || Math.sqrt(2 / denominator) > MAX_MITER_RATIO
    if (tooSharp) return { x: previous.x * half, y: previous.y * half }
    return {
      x: ((previous.x + next.x) / denominator) * half,
      y: ((previous.y + next.y) / denominator) * half,
    }
  })

  const left = points.map((p, j) => ({ x: p.x + offsets[j].x, y: p.y + offsets[j].y }))
  const right = points.map((p, j) => ({ x: p.x - offsets[j].x, y: p.y - offsets[j].y }))
  if (closed) {
    left.push({ ...left[0] })
    right.push({ ...right[0] })
  }
  return { left, right }
}

function polylineSegments(points: Point[]): Segment[] {
  return points.slice(1).map((b, i) => ({ a: points[i], b }))
}

/** Segments de contour des deux faces d'un mur. */
export function wallFaceSegments(wall: WallGeometry): Segment[] {
  const { left, right } = wallFaces(wall.points, wall.thickness)
  return [...polylineSegments(left), ...polylineSegments(right)]
}

/** Point d'intersection de deux segments (extrémités comprises), ou `null`. */
export function segmentIntersection(s1: Segment, s2: Segment): Point | null {
  const rx = s1.b.x - s1.a.x
  const ry = s1.b.y - s1.a.y
  const sx = s2.b.x - s2.a.x
  const sy = s2.b.y - s2.a.y
  const denominator = rx * sy - ry * sx
  const scale = Math.hypot(rx, ry) * Math.hypot(sx, sy)
  if (scale === 0 || Math.abs(denominator) < EPSILON * scale) return null // parallèles

  const qx = s2.a.x - s1.a.x
  const qy = s2.a.y - s1.a.y
  const t = (qx * sy - qy * sx) / denominator
  const u = (qx * ry - qy * rx) / denominator
  const tolerance = 1e-9
  if (t < -tolerance || t > 1 + tolerance || u < -tolerance || u > 1 + tolerance) return null
  return { x: s1.a.x + t * rx, y: s1.a.y + t * ry }
}

/**
 * Points remarquables des murs sur lesquels on peut s'aimanter pour tracer une pièce le long des
 * faces : angles des faces de chaque mur, et croisements des faces de murs différents
 * (par exemple l'angle intérieur où deux murs se rencontrent).
 */
export function wallFaceCorners(walls: readonly WallGeometry[]): Point[] {
  const corners: Point[] = []
  const faceSegments = walls.map(wallFaceSegments)

  for (const wall of walls) {
    const { left, right } = wallFaces(wall.points, wall.thickness)
    corners.push(...left, ...right)
  }

  for (let i = 0; i < faceSegments.length; i++) {
    for (let j = i + 1; j < faceSegments.length; j++) {
      for (const s1 of faceSegments[i]) {
        for (const s2 of faceSegments[j]) {
          const crossing = segmentIntersection(s1, s2)
          if (crossing) corners.push(crossing)
        }
      }
    }
  }
  return corners
}
