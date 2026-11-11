import type { Level } from '../../../types/document'
import type { Point } from '../../geometry/viewport'
import type { BuildingModel, SlabShape, WallPiece } from '../types'

/**
 * Projection orthographique du modèle 3D neutre sur un plan vertical (façades, coupes).
 * Fonctions pures, sans Three.js. Unités : mm.
 *
 * Repère de la vue : `u` = horizontale vers la droite de la personne qui regarde, `v` = hauteur
 * (vers le haut). La profondeur est la distance le long de la direction du regard (plus grande =
 * plus loin).
 */

/** Direction du regard dans le plan (vecteur unitaire x, y du plan ; y vers le bas de l'écran). */
export interface ViewDirection {
  x: number
  y: number
}

export type FaceKind = 'wall' | 'step' | 'chimney' | 'slab' | 'roof' | 'platform'

/** Une face verticale vue de face, prête à être dessinée en 2D. */
export interface ViewFace {
  /** Quatre coins [u, v], mm. */
  polygon: [number, number][]
  /** Distance le long du regard, mm (le milieu de la face). */
  depth: number
  kind: FaceKind
  sourceId: string
  levelId: string
}

export interface ViewBounds {
  minU: number
  maxU: number
  minV: number
  maxV: number
}

/** Altitude d'un plancher, pour la cote de niveau affichée sur la vue. */
export interface LevelMark {
  levelId: string
  name: string
  /** mm, altitude du plancher. */
  elevation: number
}

/** Seules les faces plus larges que cela (mm) sont gardées : les autres sont vues par la tranche. */
const MIN_FACE_WIDTH = 0.5

/** Direction « droite » de la personne qui regarde dans la direction `look` (plan, y vers le bas). */
export function rightOf(look: ViewDirection): ViewDirection {
  return { x: -look.y, y: look.x }
}

/** Direction du regard d'une façade : on se place à l'extérieur du côté `facing` et on regarde vers le bâtiment. */
export function lookTowards(facing: ViewDirection): ViewDirection {
  const x = -facing.x
  const y = -facing.y
  return { x: x === 0 ? 0 : x, y: y === 0 ? 0 : y }
}

function quad(
  a: Point,
  b: Point,
  v0: number,
  v1: number,
  look: ViewDirection,
  kind: FaceKind,
  sourceId: string,
  levelId: string,
): ViewFace | null {
  const right = rightOf(look)
  const ua = a.x * right.x + a.y * right.y
  const ub = b.x * right.x + b.y * right.y
  if (Math.abs(ub - ua) < MIN_FACE_WIDTH) return null
  if (v1 - v0 <= 0) return null
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
  return {
    polygon: [
      [ua, v0],
      [ub, v0],
      [ub, v1],
      [ua, v1],
    ],
    depth: mid.x * look.x + mid.y * look.y,
    kind,
    sourceId,
    levelId,
  }
}

/** Les quatre faces verticales d'une boîte orientée ; ne garde que celles tournées vers la personne qui regarde. */
export function boxFaces(piece: WallPiece, look: ViewDirection, kind: FaceKind): ViewFace[] {
  const c = Math.cos(piece.rotationY)
  const s = Math.sin(piece.rotationY)
  const hx = piece.size.x / 2
  const hz = piece.size.z / 2
  const v0 = piece.center.y - piece.size.y / 2
  const v1 = piece.center.y + piece.size.y / 2
  // Axes de la boîte dans le plan : le long du mur (c, −s), en épaisseur (s, c).
  const at = (u: number, w: number): Point => ({
    x: piece.center.x + c * u + s * w,
    y: piece.center.z - s * u + c * w,
  })
  const sides: { a: Point; b: Point; normal: Point }[] = [
    { a: at(-hx, -hz), b: at(hx, -hz), normal: { x: -s, y: -c } },
    { a: at(hx, hz), b: at(-hx, hz), normal: { x: s, y: c } },
    { a: at(hx, -hz), b: at(hx, hz), normal: { x: c, y: -s } },
    { a: at(-hx, hz), b: at(-hx, -hz), normal: { x: -c, y: s } },
  ]
  const faces: ViewFace[] = []
  for (const side of sides) {
    if (side.normal.x * look.x + side.normal.y * look.y >= -1e-9) continue
    const face = quad(side.a, side.b, v0, v1, look, kind, piece.sourceId, piece.levelId)
    if (face) faces.push(face)
  }
  return faces
}

/** Faces verticales (côtés) d'une dalle, d'un toit ou d'une plateforme tournées vers la personne qui regarde. */
export function slabFaces(slab: SlabShape, look: ViewDirection): ViewFace[] {
  const pts = slab.outline
  if (pts.length < 3 || slab.thickness <= 0) return []
  let area2 = 0
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]
    const q = pts[(i + 1) % pts.length]
    area2 += p.x * q.y - q.x * p.y
  }
  if (area2 === 0) return []
  const flip = area2 > 0 ? 1 : -1
  const faces: ViewFace[] = []
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % pts.length]
    // Normale sortante : (e.y, −e.x) pour un contour d'aire positive, l'inverse sinon.
    const nx = (b.y - a.y) * flip
    const ny = -(b.x - a.x) * flip
    if (nx * look.x + ny * look.y >= -1e-9) continue
    const face = quad(
      a,
      b,
      slab.baseY,
      slab.baseY + slab.thickness,
      look,
      slab.kind,
      slab.sourceId,
      slab.levelId,
    )
    if (face) faces.push(face)
  }
  return faces
}

/** Tri de l'algorithme du peintre : de la face la plus lointaine à la plus proche (ordre stable). */
export function paintOrder(faces: readonly ViewFace[]): ViewFace[] {
  return faces
    .map((face, index) => ({ face, index }))
    .sort((a, b) => b.face.depth - a.face.depth || a.index - b.index)
    .map((entry) => entry.face)
}

export function facesBounds(faces: readonly ViewFace[]): ViewBounds | null {
  let bounds: ViewBounds | null = null
  for (const face of faces) {
    for (const [u, v] of face.polygon) {
      if (!bounds) bounds = { minU: u, maxU: u, minV: v, maxV: v }
      else {
        bounds.minU = Math.min(bounds.minU, u)
        bounds.maxU = Math.max(bounds.maxU, u)
        bounds.minV = Math.min(bounds.minV, v)
        bounds.maxV = Math.max(bounds.maxV, v)
      }
    }
  }
  return bounds
}

/** Cotes de niveaux : les planchers, du plus bas au plus haut. */
export function levelMarks(levels: readonly Level[]): LevelMark[] {
  return [...levels]
    .sort((a, b) => a.elevation - b.elevation)
    .map((l) => ({ levelId: l.id, name: l.name, elevation: l.elevation }))
}

/**
 * Toutes les faces du modèle vues depuis la direction `look`, de la plus lointaine à la plus proche.
 * Les faces horizontales (dessus, dessous) sont vues par la tranche et ne sont pas dessinées.
 */
export function projectModel(model: BuildingModel, look: ViewDirection): ViewFace[] {
  const faces: ViewFace[] = []
  for (const w of model.walls) faces.push(...boxFaces(w, look, 'wall'))
  for (const s of model.steps) faces.push(...boxFaces(s, look, 'step'))
  for (const c of model.chimneys) faces.push(...boxFaces(c, look, 'chimney'))
  for (const slab of model.slabs) faces.push(...slabFaces(slab, look))
  return paintOrder(faces)
}
