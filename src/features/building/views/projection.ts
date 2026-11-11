import type { Level } from '../../../types/document'
import type { Point } from '../../geometry/viewport'
import type { BuildingModel, OpeningMark, SlabShape, WallMesh, WallPiece } from '../types'

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

export type FaceKind =
  | 'wall'
  | 'step'
  | 'chimney'
  | 'slab'
  | 'roof'
  | 'platform'
  /** Garniture des ouvertures : cadre, vitre, vantail de porte. */
  | 'frame'
  | 'glass'
  | 'door'
  /** Trait de façade d'une ouverture (triangle d'ouverture, flèche) : ligne brisée, pas une surface. */
  | 'mark'

/** Une face verticale vue de face, prête à être dessinée en 2D. */
export interface ViewFace {
  /** Quatre coins [u, v], mm. */
  polygon: [number, number][]
  /** Distance le long du regard, mm (le milieu de la face). */
  depth: number
  kind: FaceKind
  sourceId: string
  levelId: string
  /** Vrai pour une matière coupée par le plan de coupe (dessinée en noir). */
  cut?: boolean
  /**
   * Côtés à tracer (côté i = coin i → coin i+1). Absent : tous. Les jonctions entre faces d'un
   * même mur ne sont pas tracées, pour que le mur se lise d'un seul tenant.
   */
  edges?: boolean[]
  /** Pour un `mark` : trait en pointillé. */
  dashed?: boolean
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
/** Un trait d'ouverture se peint à 13 mm devant le milieu de l'ouverture (devant une vitre de 24 mm). */
const MARK_DEPTH_OFFSET = 13

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

/** Face verticale entre deux points du plan, de l'altitude `v0` à `v1` (`null` si elle est vue par la tranche). */
export function quad(
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

/**
 * Trait de façade d'une ouverture, projeté. Il se peint juste devant la vitre ou le vantail qui le
 * porte (la moitié de la plus grande épaisseur de remplissage, plus 1 mm), donc par-dessus eux mais
 * sous tout ce qui est plus près de la personne qui regarde. `null` s'il est vu par la tranche.
 */
export function markFace(mark: OpeningMark, look: ViewDirection): ViewFace | null {
  const right = rightOf(look)
  const polygon = mark.points.map((p): [number, number] => [p.x * right.x + p.z * right.y, p.y])
  const us = polygon.map((p) => p[0])
  if (Math.max(...us) - Math.min(...us) < MIN_FACE_WIDTH) return null
  const cx = mark.points.reduce((sum, p) => sum + p.x, 0) / mark.points.length
  const cz = mark.points.reduce((sum, p) => sum + p.z, 0) / mark.points.length
  return {
    polygon,
    depth: cx * look.x + cz * look.y - MARK_DEPTH_OFFSET,
    kind: 'mark',
    sourceId: mark.sourceId,
    levelId: mark.levelId,
    dashed: mark.dashed,
  }
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

/**
 * Faces verticales d'un mur (maillage sans couture) tournées vers la personne qui regarde, avec
 * leurs bords à tracer. Les faces horizontales sont vues par la tranche.
 */
export function wallMeshFaces(mesh: WallMesh, look: ViewDirection): ViewFace[] {
  const faces: ViewFace[] = []
  for (const q of mesh.quads) {
    if (Math.abs(q.normal.y) > 1e-9) continue
    if (q.normal.x * look.x + q.normal.z * look.y >= -1e-9) continue
    const [p0, p1, p2] = q.corners
    const face = quad(
      { x: p0.x, y: p0.z },
      { x: p1.x, y: p1.z },
      p0.y,
      p2.y,
      look,
      'wall',
      mesh.sourceId,
      mesh.levelId,
    )
    if (face) faces.push({ ...face, edges: [...q.edges] })
  }
  return faces
}

/** Vrai si les intervalles `parts` couvrent entièrement `[from, to]` (à 0,5 mm près). */
function covered(from: number, to: number, parts: readonly [number, number][]): boolean {
  let reach = from
  for (const [a, b] of [...parts].sort((x, y) => x[0] - y[0])) {
    if (a > reach + 0.5) break
    reach = Math.max(reach, b)
    if (reach >= to - 0.5) return true
  }
  return reach >= to - 0.5
}

/**
 * Murs empilés dans le même plan (rez et étage d'une même façade) : le dessus de l'un et le dessous
 * de l'autre ne sont plus tracés là où ils se recouvrent exactement — la façade se lit d'un seul
 * tenant. Un décrochement (plans différents ou largeurs différentes) garde son trait.
 */
export function mergeStackedEdges(faces: ViewFace[]): ViewFace[] {
  const key = (v: number, depth: number) => `${Math.round(v)}|${Math.round(depth * 2)}`
  const spanOf = (face: ViewFace): [number, number] => {
    const us = face.polygon.map((p) => p[0])
    return [Math.min(...us), Math.max(...us)]
  }
  const bottoms = new Map<string, [number, number][]>()
  const tops = new Map<string, [number, number][]>()
  for (const face of faces) {
    if (face.kind !== 'wall' || !face.edges || face.cut) continue
    const v0 = face.polygon[0][1]
    const v1 = face.polygon[2][1]
    if (face.edges[0]) bottoms.set(key(v0, face.depth), [...(bottoms.get(key(v0, face.depth)) ?? []), spanOf(face)])
    if (face.edges[2]) tops.set(key(v1, face.depth), [...(tops.get(key(v1, face.depth)) ?? []), spanOf(face)])
  }
  return faces.map((face) => {
    if (face.kind !== 'wall' || !face.edges || face.cut) return face
    const [from, to] = spanOf(face)
    const v0 = face.polygon[0][1]
    const v1 = face.polygon[2][1]
    const edges = [...face.edges]
    if (edges[2] && covered(from, to, bottoms.get(key(v1, face.depth)) ?? [])) edges[2] = false
    if (edges[0] && covered(from, to, tops.get(key(v0, face.depth)) ?? [])) edges[0] = false
    return edges.every((e, i) => e === face.edges?.[i]) ? face : { ...face, edges }
  })
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
 * Toutes les faces du modèle vues depuis la direction `look`, de la plus lointaine à la plus proche :
 * murs (sans couture entre leurs morceaux), cadres, vitres et portes des ouvertures, escaliers,
 * cheminées, dalles hors sol. Les faces horizontales (dessus, dessous) sont vues par la tranche.
 */
export function projectModel(model: BuildingModel, look: ViewDirection): ViewFace[] {
  const faces: ViewFace[] = []
  for (const mesh of model.wallMeshes) faces.push(...wallMeshFaces(mesh, look))
  for (const s of model.steps) faces.push(...boxFaces(s, look, 'step'))
  for (const c of model.chimneys) faces.push(...boxFaces(c, look, 'chimney'))
  for (const f of model.fills) faces.push(...boxFaces(f, look, f.kind))
  for (const m of model.marks) {
    const face = markFace(m, look)
    if (face) faces.push(face)
  }
  // La dalle du niveau le plus bas est sous le terrain : invisible en façade.
  for (const slab of model.slabs) if (!slab.onGround) faces.push(...slabFaces(slab, look))
  return paintOrder(mergeStackedEdges(faces))
}
