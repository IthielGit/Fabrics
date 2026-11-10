import type { Level, OpeningElement, WallElement } from '../../types/document'
import { openingInterval, wallSegment } from '../geometry/openings'
import { toPoints } from '../geometry/polygon'
import type { WallPiece } from './types'

/** Sous cette taille (mm), un morceau est ignoré. */
const MIN_SIZE = 1
const CLOSE = 1e-6

/** Un tracé fermé : au moins 4 points, le dernier au même endroit que le premier. */
function isClosedAxis(wall: Pick<WallElement, 'points'>): boolean {
  const points = toPoints(wall.points)
  if (points.length < 4) return false
  const first = points[0]
  const last = points[points.length - 1]
  return Math.hypot(first.x - last.x, first.y - last.y) < CLOSE
}

interface Span {
  from: number
  to: number
}

/**
 * Morceaux de mur d'un segment, sans calcul booléen : les trumeaux (pleine hauteur) entre les
 * ouvertures, puis sous chaque ouverture l'allège (si elle existe) et au-dessus le linteau.
 * `u` est la distance le long du segment depuis son début (peut être négative ou dépasser la
 * longueur : le mur est prolongé d'une demi-épaisseur aux angles pour boucher le coin).
 */
function segmentSpans(
  start: number,
  end: number,
  height: number,
  openings: readonly OpeningElement[],
): { solid: Span[]; sills: { u: Span; top: number }[]; lintels: { u: Span; bottom: number }[] } {
  const ordered = openings
    .map((o) => {
      const interval = openingInterval(o)
      const sill = Math.min(Math.max(o.sillHeight, 0), height)
      const top = Math.min(sill + o.height, height)
      return { from: interval.from, to: interval.to, sill, top }
    })
    .filter((o) => o.to > o.from && o.top > o.sill)
    .sort((a, b) => a.from - b.from)

  const solid: Span[] = []
  const sills: { u: Span; top: number }[] = []
  const lintels: { u: Span; bottom: number }[] = []
  let cursor = start
  for (const o of ordered) {
    const from = Math.max(o.from, cursor)
    const to = Math.min(o.to, end)
    if (to <= from) continue
    if (from - cursor >= MIN_SIZE) solid.push({ from: cursor, to: from })
    if (o.sill >= MIN_SIZE) sills.push({ u: { from, to }, top: o.sill })
    if (height - o.top >= MIN_SIZE) lintels.push({ u: { from, to }, bottom: o.top })
    cursor = to
  }
  if (end - cursor >= MIN_SIZE) solid.push({ from: cursor, to: end })
  return { solid, sills, lintels }
}

/**
 * Boîtes qui composent un mur à l'altitude de son niveau.
 * Les ouvertures de `openings` qui ne sont pas sur ce mur sont ignorées.
 */
export function buildWallPieces(
  wall: WallElement,
  openings: readonly OpeningElement[],
  level: Pick<Level, 'id' | 'elevation'>,
): WallPiece[] {
  const points = toPoints(wall.points)
  const closed = isClosedAxis(wall)
  const lastIndex = points.length - 1
  const half = wall.thickness / 2
  const height = wall.height
  const pieces: WallPiece[] = []
  if (height < MIN_SIZE || wall.thickness < MIN_SIZE) return pieces

  for (let i = 0; i < lastIndex; i++) {
    const segment = wallSegment(wall, i)
    if (!segment) continue
    const startJoint = closed || i > 0
    const endJoint = closed || i + 1 < lastIndex
    const start = startJoint ? -half : 0
    const end = segment.length + (endJoint ? half : 0)
    const own = openings.filter((o) => o.wallId === wall.id && o.segmentIndex === i)
    const { solid, sills, lintels } = segmentSpans(start, end, height, own)

    const rotationY = -Math.atan2(segment.direction.y, segment.direction.x)
    const add = (u: Span, y0: number, y1: number) => {
      const mid = (u.from + u.to) / 2
      pieces.push({
        sourceId: wall.id,
        levelId: level.id,
        center: {
          x: segment.a.x + segment.direction.x * mid,
          y: level.elevation + (y0 + y1) / 2,
          z: segment.a.y + segment.direction.y * mid,
        },
        size: { x: u.to - u.from, y: y1 - y0, z: wall.thickness },
        rotationY,
      })
    }
    for (const u of solid) add(u, 0, height)
    for (const s of sills) add(s.u, 0, s.top)
    for (const l of lintels) add(l.u, l.bottom, height)
  }
  return pieces
}
