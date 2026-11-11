import type { Level } from '../../../types/document'
import { sectionLook } from '../../geometry/sections'
import type { Point } from '../../geometry/viewport'
import type { BuildingModel, WallPiece } from '../types'
import {
  facesBounds,
  levelMarks,
  paintOrder,
  quad,
  rightOf,
  type FaceKind,
  type LevelMark,
  type ViewBounds,
  type ViewDirection,
  type ViewFace,
} from './projection'

/** Ligne de coupe : ce qu'il faut savoir d'un élément `section` pour calculer sa coupe. */
export interface SectionSpec {
  points: readonly number[]
  lookLeft: boolean
  label: string
}

export interface SectionView {
  label: string
  faces: ViewFace[]
  bounds: ViewBounds | null
  levels: LevelMark[]
}

/** Un solide vertical : un contour dans le plan, extrudé de `v0` à `v1`. */
interface Prism {
  /** Contour extérieur puis trous éventuels (trémies), sans point de fermeture. */
  rings: Point[][]
  v0: number
  v1: number
  kind: FaceKind
  sourceId: string
  levelId: string
}

/** Contour d'une boîte orientée (morceau de mur, marche, cheminée), dans le plan. */
function boxRing(piece: WallPiece): Point[] {
  const c = Math.cos(piece.rotationY)
  const s = Math.sin(piece.rotationY)
  const hx = piece.size.x / 2
  const hz = piece.size.z / 2
  return [
    [-hx, -hz],
    [hx, -hz],
    [hx, hz],
    [-hx, hz],
  ].map(([u, w]) => ({
    x: piece.center.x + c * u + s * w,
    y: piece.center.z - s * u + c * w,
  }))
}

function prismsOf(model: BuildingModel): Prism[] {
  const prisms: Prism[] = []
  const addBoxes = (pieces: readonly WallPiece[], kind: FaceKind) => {
    for (const piece of pieces) {
      prisms.push({
        rings: [boxRing(piece)],
        v0: piece.center.y - piece.size.y / 2,
        v1: piece.center.y + piece.size.y / 2,
        kind,
        sourceId: piece.sourceId,
        levelId: piece.levelId,
      })
    }
  }
  addBoxes(model.walls, 'wall')
  addBoxes(model.steps, 'step')
  addBoxes(model.chimneys, 'chimney')
  for (const slab of model.slabs) {
    prisms.push({
      rings: [slab.outline, ...(slab.holes ?? [])],
      v0: slab.baseY,
      v1: slab.baseY + slab.thickness,
      kind: slab.kind,
      sourceId: slab.sourceId,
      levelId: slab.levelId,
    })
  }
  return prisms
}

const dot = (p: Point, d: ViewDirection) => p.x * d.x + p.y * d.y

/** Aire signée × 2 d'un contour (positive pour le sens où la normale sortante est (e.y, −e.x)). */
function area2(ring: readonly Point[]): number {
  let sum = 0
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i]
    const q = ring[(i + 1) % ring.length]
    sum += p.x * q.y - q.x * p.y
  }
  return sum
}

/** Segments `[u début, u fin]` où le plan de coupe traverse la matière (règle pair-impair sur tous les contours). */
function cutIntervals(rings: readonly Point[][], look: ViewDirection, cutDepth: number): [number, number][] {
  const right = rightOf(look)
  const crossings: number[] = []
  for (const ring of rings) {
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i]
      const b = ring[(i + 1) % ring.length]
      const da = dot(a, look) - cutDepth
      const db = dot(b, look) - cutDepth
      // Règle demi-ouverte : un sommet pile sur le plan compte une seule fois.
      if (da >= 0 === db >= 0) continue
      const t = da / (da - db)
      crossings.push(dot({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }, right))
    }
  }
  crossings.sort((x, y) => x - y)
  const intervals: [number, number][] = []
  for (let i = 0; i + 1 < crossings.length; i += 2) {
    if (crossings[i + 1] - crossings[i] > 0.5) intervals.push([crossings[i], crossings[i + 1]])
  }
  return intervals
}

/** Partie d'un segment située à une profondeur ≥ `cutDepth` (derrière le plan de coupe), ou `null`. */
function clipBehind(a: Point, b: Point, look: ViewDirection, cutDepth: number): [Point, Point] | null {
  const da = dot(a, look) - cutDepth
  const db = dot(b, look) - cutDepth
  if (da < 0 && db < 0) return null
  if (da >= 0 && db >= 0) return [a, b]
  const t = da / (da - db)
  const mid = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
  return da >= 0 ? [a, mid] : [mid, b]
}

/** Ramène une face dans la largeur de la coupe (`[uLo, uHi]`) ; `null` si elle est entièrement dehors. */
function clampToWidth(face: ViewFace, uLo: number, uHi: number): ViewFace | null {
  const polygon = face.polygon.map(([u, v]) => [Math.min(Math.max(u, uLo), uHi), v] as [number, number])
  const us = polygon.map((p) => p[0])
  if (Math.max(...us) - Math.min(...us) < 0.5) return null
  return { ...face, polygon }
}

function prismFaces(prism: Prism, look: ViewDirection, cutDepth: number, uLo: number, uHi: number): ViewFace[] {
  const faces: ViewFace[] = []

  // Matière coupée : noire, au premier plan.
  for (const [ua, ub] of cutIntervals(prism.rings, look, cutDepth)) {
    const face: ViewFace = {
      polygon: [
        [ua, prism.v0],
        [ub, prism.v0],
        [ub, prism.v1],
        [ua, prism.v1],
      ],
      depth: cutDepth - 1,
      kind: prism.kind,
      sourceId: prism.sourceId,
      levelId: prism.levelId,
      cut: true,
    }
    const clamped = clampToWidth(face, uLo, uHi)
    if (clamped) faces.push(clamped)
  }

  // Côtés du solide qui restent visibles derrière le plan de coupe.
  const outer = prism.rings[0]
  if (!outer || outer.length < 3) return faces
  const sign = area2(outer) > 0 ? 1 : -1
  for (let i = 0; i < outer.length; i++) {
    const a = outer[i]
    const b = outer[(i + 1) % outer.length]
    const nx = (b.y - a.y) * sign
    const ny = -(b.x - a.x) * sign
    if (nx * look.x + ny * look.y >= -1e-9) continue
    const piece = clipBehind(a, b, look, cutDepth)
    if (!piece) continue
    const face = quad(piece[0], piece[1], prism.v0, prism.v1, look, prism.kind, prism.sourceId, prism.levelId)
    if (!face) continue
    const clamped = clampToWidth(face, uLo, uHi)
    if (clamped) faces.push(clamped)
  }
  return faces
}

/**
 * Coupe d'un bâtiment le long d'une ligne de coupe : on garde ce qui est derrière la ligne (dans le
 * sens du regard) et dans sa longueur ; la matière traversée par le plan est coupée (`cut`, noire).
 * `null` si la ligne n'a pas de longueur.
 */
export function buildSection(
  model: BuildingModel,
  levels: readonly Level[],
  section: SectionSpec,
): SectionView | null {
  const look = sectionLook(section.points, section.lookLeft)
  if (!look) return null
  const [x1, y1, x2, y2] = section.points
  const right = rightOf(look)
  const cutDepth = dot({ x: x1, y: y1 }, look)
  const u1 = dot({ x: x1, y: y1 }, right)
  const u2 = dot({ x: x2, y: y2 }, right)
  const uLo = Math.min(u1, u2)
  const uHi = Math.max(u1, u2)

  const faces: ViewFace[] = []
  for (const prism of prismsOf(model)) faces.push(...prismFaces(prism, look, cutDepth, uLo, uHi))
  const ordered = paintOrder(faces)
  return { label: section.label, faces: ordered, bounds: facesBounds(ordered), levels: levelMarks(levels) }
}
