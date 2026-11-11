import type { Level, OpeningElement, WallElement } from '../../types/document'
import { openingInterval, wallSegment } from '../geometry/openings'
import { toPoints } from '../geometry/polygon'
import type { Vec3, WallMesh, WallQuad } from './types'
import { isClosedAxis } from './wallPieces'

/** Sous cette taille (mm), une ouverture ou un mur est ignoré. */
const MIN_SIZE = 1

interface Hole {
  from: number
  to: number
  bottom: number
  top: number
}

/** Valeurs triées, sans doublons à moins de 1e-6 mm près. */
function breakpoints(values: number[]): number[] {
  const sorted = [...values].sort((a, b) => a - b)
  const out: number[] = []
  for (const v of sorted) {
    if (out.length === 0 || v - out[out.length - 1] > 1e-6) out.push(v)
  }
  return out
}

/**
 * Faces d'un mur, segment par segment, sur une grille complète : les bornes des ouvertures
 * découpent le segment en cellules, une cellule hors ouverture est pleine. Toutes les faces suivent
 * la grille, donc deux faces voisines partagent leurs sommets : pas de couture.
 * Faces : devant et derrière de chaque cellule pleine, plus le dessus, le dessous et les chants
 * qui bordent le vide (ouverture ou bout libre du mur). Aux angles, le bout prolongé d'une
 * demi-épaisseur rejoint le segment voisin : son chant est caché, il n'est pas produit (sinon il
 * se superposerait à la face du voisin).
 * Bords tracés (`edges`) : ceux qui bordent le vide ou un angle ; pas les jonctions entre cellules,
 * ni entre deux segments alignés.
 */
export function buildWallQuads(
  wall: WallElement,
  openings: readonly OpeningElement[],
  level: Pick<Level, 'id' | 'elevation'>,
): WallQuad[] {
  const points = toPoints(wall.points)
  const height = wall.height
  const half = wall.thickness / 2
  const quads: WallQuad[] = []
  if (height < MIN_SIZE || wall.thickness < MIN_SIZE) return quads
  const closed = isClosedAxis(wall)
  const lastIndex = points.length - 1
  const segmentCount = lastIndex
  const directionOf = (index: number) => wallSegment(wall, index)?.direction ?? null
  const aligned = (i: number, j: number): boolean => {
    const a = directionOf(i)
    const b = directionOf(j)
    return a !== null && b !== null && a.x * b.x + a.y * b.y > 1 - 1e-9
  }

  for (let i = 0; i < lastIndex; i++) {
    const segment = wallSegment(wall, i)
    if (!segment) continue
    const startJoint = closed || i > 0
    const endJoint = closed || i + 1 < lastIndex
    const start = startJoint ? -half : 0
    const end = segment.length + (endJoint ? half : 0)
    const prevAligned = startJoint && aligned((i - 1 + segmentCount) % segmentCount, i)
    const nextAligned = endJoint && aligned(i, (i + 1) % segmentCount)

    const holes: Hole[] = []
    for (const o of openings) {
      if (o.wallId !== wall.id || o.segmentIndex !== i) continue
      const interval = openingInterval(o)
      const bottom = Math.min(Math.max(o.sillHeight, 0), height)
      const top = Math.min(bottom + o.height, height)
      const from = Math.max(interval.from, start)
      const to = Math.min(interval.to, end)
      if (to - from >= MIN_SIZE && top - bottom >= MIN_SIZE) holes.push({ from, to, bottom, top })
    }

    const us = breakpoints([start, end, ...holes.flatMap((h) => [h.from, h.to])])
    const hs = breakpoints([0, height, ...holes.flatMap((h) => [h.bottom, h.top])])
    const solid = (ui: number, hi: number): boolean => {
      if (ui < 0 || ui >= us.length - 1 || hi < 0 || hi >= hs.length - 1) return false
      const u = (us[ui] + us[ui + 1]) / 2
      const h = (hs[hi] + hs[hi + 1]) / 2
      return !holes.some((o) => u > o.from && u < o.to && h > o.bottom && h < o.top)
    }

    // Repère local : u le long du segment, h vers le haut, w vers la gauche du segment (normale).
    const d = segment.direction
    const n = segment.normal
    const at = (u: number, h: number, w: number): Vec3 => ({
      x: segment.a.x + d.x * u + n.x * w,
      y: level.elevation + h,
      z: segment.a.y + d.y * u + n.y * w,
    })
    const dirOf = (du: number, dh: number, dw: number): Vec3 => ({
      x: d.x * du + n.x * dw,
      y: dh,
      z: d.y * du + n.y * dw,
    })
    const push = (corners: [Vec3, Vec3, Vec3, Vec3], normal: Vec3, edges: [boolean, boolean, boolean, boolean]) => {
      quads.push({ corners, normal, edges })
    }
    const ALL: [boolean, boolean, boolean, boolean] = [true, true, true, true]

    const lastU = us.length - 2
    for (let ui = 0; ui <= lastU; ui++) {
      for (let hi = 0; hi < hs.length - 1; hi++) {
        if (!solid(ui, hi)) continue
        const u0 = us[ui]
        const u1 = us[ui + 1]
        const h0 = hs[hi]
        const h1 = hs[hi + 1]
        const atStart = ui === 0
        const atEnd = ui === lastU
        const openBelow = !solid(ui, hi - 1)
        const openAbove = !solid(ui, hi + 1)
        const openBefore = atStart ? !prevAligned : !solid(ui - 1, hi)
        const openAfter = atEnd ? !nextAligned : !solid(ui + 1, hi)
        const faceEdges: [boolean, boolean, boolean, boolean] = [openBelow, openAfter, openAbove, openBefore]
        // Devant (côté gauche du segment) et derrière.
        push([at(u0, h0, half), at(u1, h0, half), at(u1, h1, half), at(u0, h1, half)], dirOf(0, 0, 1), faceEdges)
        push([at(u0, h0, -half), at(u1, h0, -half), at(u1, h1, -half), at(u0, h1, -half)], dirOf(0, 0, -1), faceEdges)
        // Dessus et dessous : bord du mur, ou tableau d'une ouverture (appui, sous-face du linteau).
        if (openAbove) push([at(u0, h1, -half), at(u1, h1, -half), at(u1, h1, half), at(u0, h1, half)], dirOf(0, 1, 0), ALL)
        if (openBelow) push([at(u0, h0, -half), at(u1, h0, -half), at(u1, h0, half), at(u0, h0, half)], dirOf(0, -1, 0), ALL)
        // Chants : tableau d'une ouverture, ou bout libre du mur (pas aux angles).
        if (atStart ? !startJoint : !solid(ui - 1, hi)) {
          push([at(u0, h0, -half), at(u0, h0, half), at(u0, h1, half), at(u0, h1, -half)], dirOf(-1, 0, 0), ALL)
        }
        if (atEnd ? !endJoint : !solid(ui + 1, hi)) {
          push([at(u1, h0, -half), at(u1, h0, half), at(u1, h1, half), at(u1, h1, -half)], dirOf(1, 0, 0), ALL)
        }
      }
    }
  }
  return quads
}

/** Maillage d'un mur pour la vue 3D : ses faces (`buildWallQuads`) en triangles tournés vers l'extérieur. */
export function buildWallMesh(
  wall: WallElement,
  openings: readonly OpeningElement[],
  level: Pick<Level, 'id' | 'elevation'>,
): WallMesh | null {
  const quads = buildWallQuads(wall, openings, level)
  if (quads.length === 0) return null
  const positions: number[] = []
  const normals: number[] = []
  for (const { corners: p, normal } of quads) {
    const e1 = { x: p[1].x - p[0].x, y: p[1].y - p[0].y, z: p[1].z - p[0].z }
    const e2 = { x: p[2].x - p[0].x, y: p[2].y - p[0].y, z: p[2].z - p[0].z }
    const cross = {
      x: e1.y * e2.z - e1.z * e2.y,
      y: e1.z * e2.x - e1.x * e2.z,
      z: e1.x * e2.y - e1.y * e2.x,
    }
    const ordered = cross.x * normal.x + cross.y * normal.y + cross.z * normal.z >= 0 ? p : [p[0], p[3], p[2], p[1]]
    for (const index of [0, 1, 2, 0, 2, 3]) {
      const v = ordered[index]
      positions.push(v.x, v.y, v.z)
      normals.push(normal.x, normal.y, normal.z)
    }
  }
  return { sourceId: wall.id, levelId: level.id, quads, positions, normals }
}
