import type { Level, WallMaterial } from '../../../types/document'
import { sectionLook } from '../../geometry/sections'
import type { Point } from '../../geometry/viewport'
import { wallFacadeTexture } from '../materials'
import type { BuildingModel, RoofPrism, Vec3, WallPiece } from '../types'
import {
  facesBounds,
  levelMarks,
  mergeStackedEdges,
  paintOrder,
  prismPolygons,
  projectPolygon,
  quad,
  rightOf,
  type FaceKind,
  type LevelMark,
  type ViewBounds,
  type ViewDirection,
  type ViewFace,
  withRoofTexture,
} from './projection'

/** Ligne de coupe : ce qu'il faut savoir d'un élément `section` pour calculer sa coupe. */
export interface SectionSpec {
  points: readonly number[]
  lookLeft: boolean
  label: string
  /** Nom de la cote d'altitude du faîtage (« Faîtage ») ; absent : pas de cote de faîtage. */
  ridgeLabel?: string
}

export interface SectionView {
  label: string
  faces: ViewFace[]
  bounds: ViewBounds | null
  levels: LevelMark[]
}

/** Un solide vertical : un contour dans le plan, extrudé de `v0` à `v1`. */
export interface Prism {
  /** Contour extérieur puis trous éventuels (trémies), sans point de fermeture. */
  rings: Point[][]
  v0: number
  v1: number
  kind: FaceKind
  sourceId: string
  levelId: string
  /** Matériau d'un mur : hachure de la matière coupée. */
  material?: WallMaterial
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

/**
 * Tous les solides du modèle (murs, marches, cheminées, garnitures des ouvertures, dalles,
 * plateformes) comme contours extrudés.
 */
export function prismsOf(model: BuildingModel): Prism[] {
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
        ...(kind === 'wall' && piece.material ? { material: piece.material } : {}),
      })
    }
  }
  addBoxes(model.walls, 'wall')
  addBoxes(model.steps, 'step')
  addBoxes(model.chimneys, 'chimney')
  for (const fill of model.fills) addBoxes([fill], fill.kind)
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

function prismFaces(
  prism: Prism,
  look: ViewDirection,
  cutDepth: number,
  uLo: number,
  uHi: number,
  withSides = true,
): ViewFace[] {
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
      ...(prism.material ? { material: prism.material } : {}),
    }
    const clamped = clampToWidth(face, uLo, uHi)
    if (clamped) faces.push(clamped)
  }

  // Côtés du solide qui restent visibles derrière le plan de coupe.
  if (!withSides) return faces
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

/** Enveloppe convexe de points de la vue (chaîne monotone), sans doublons. */
function convexHull(points: readonly [number, number][]): [number, number][] {
  const sorted = [...points].sort((p, q) => p[0] - q[0] || p[1] - q[1])
  const unique = sorted.filter((p, i) => i === 0 || Math.hypot(p[0] - sorted[i - 1][0], p[1] - sorted[i - 1][1]) > 0.01)
  if (unique.length < 3) return unique
  const cross = (o: [number, number], a: [number, number], b: [number, number]) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const lower: [number, number][] = []
  for (const p of unique) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop()
    lower.push(p)
  }
  const upper: [number, number][] = []
  for (const p of [...unique].reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop()
    upper.push(p)
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)]
}

const depth3 = (p: Vec3, look: ViewDirection) => p.x * look.x + p.z * look.y

/** Garde la partie d'un polygone plan située derrière le plan de coupe (Sutherland–Hodgman). */
function clipPolygonBehind(points: readonly Vec3[], look: ViewDirection, cutDepth: number): Vec3[] {
  const out: Vec3[] = []
  for (let i = 0; i < points.length; i++) {
    const a = points[i]
    const b = points[(i + 1) % points.length]
    const da = depth3(a, look) - cutDepth
    const db = depth3(b, look) - cutDepth
    if (da >= 0) out.push(a)
    if (da >= 0 !== db >= 0) {
      const t = da / (da - db)
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t })
    }
  }
  return out
}

/**
 * Coupe d'un prisme de toiture (versant ou pignon) : la section par le plan (enveloppe des points
 * où ses arêtes traversent le plan), noire ; puis ses faces derrière le plan, vers la personne qui
 * regarde. Le prisme est convexe, donc sa section l'est aussi.
 */
function roofPrismSectionFaces(
  prism: RoofPrism,
  look: ViewDirection,
  cutDepth: number,
  uLo: number,
  uHi: number,
): { faces: ViewFace[]; cut: boolean } {
  const right = rightOf(look)
  const toView = (p: Vec3): [number, number] => [p.x * right.x + p.z * right.y, p.y]
  const kind: FaceKind = prism.kind === 'gable' ? 'wall' : 'roof'
  const faces: ViewFace[] = []
  const polygons = prismPolygons(prism)

  const crossings: [number, number][] = []
  for (const face of polygons) {
    const pts = face.points
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i]
      const b = pts[(i + 1) % pts.length]
      const da = depth3(a, look) - cutDepth
      const db = depth3(b, look) - cutDepth
      if (Math.abs(da) < 1e-6) crossings.push(toView(a))
      else if (da > 0 !== db > 0 && Math.abs(db) >= 1e-6) {
        const t = da / (da - db)
        crossings.push(toView({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t }))
      }
    }
  }
  const hull = convexHull(crossings)
  let cut = false
  if (hull.length >= 3) {
    const face: ViewFace = {
      polygon: hull,
      depth: cutDepth - 1,
      kind,
      sourceId: prism.sourceId,
      levelId: prism.levelId,
      cut: true,
    }
    const clamped = clampToWidth(face, uLo, uHi)
    if (clamped) {
      faces.push(clamped)
      cut = true
    }
  }

  for (const face of polygons) {
    const behind = clipPolygonBehind(face.points, look, cutDepth)
    if (behind.length < 3) continue
    const projected = projectPolygon({ points: behind, normal: face.normal }, look, kind, prism.sourceId, prism.levelId)
    if (!projected) continue
    const clamped = clampToWidth(projected, uLo, uHi)
    if (clamped) faces.push(withRoofTexture(clamped, prism))
  }
  return { faces, cut }
}

/**
 * Coupe d'un bâtiment le long d'une ligne de coupe : on garde ce qui est derrière la ligne (dans le
 * sens du regard) et dans sa longueur ; la matière traversée par le plan est coupée (`cut`, noire).
 * Une toiture coupée par le plan reçoit la cote d'altitude de son faîtage (avec `ridgeLabel`).
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
  // Les murs : matière coupée d'après leurs morceaux ; faces vues derrière le plan d'après leur
  // maillage sans couture (pas de trait entre trumeau, allège et linteau).
  for (const prism of prismsOf(model)) {
    faces.push(...prismFaces(prism, look, cutDepth, uLo, uHi, prism.kind !== 'wall'))
  }
  for (const mesh of model.wallMeshes) {
    for (const q of mesh.quads) {
      if (Math.abs(q.normal.y) > 1e-9) continue
      if (q.normal.x * look.x + q.normal.z * look.y >= -1e-9) continue
      const [p0, p1, p2] = q.corners
      const a = { x: p0.x, y: p0.z }
      const b = { x: p1.x, y: p1.z }
      const piece = clipBehind(a, b, look, cutDepth)
      if (!piece) continue
      const face = quad(piece[0], piece[1], p0.y, p2.y, look, 'wall', mesh.sourceId, mesh.levelId)
      if (!face) continue
      // Un côté raccourci par le plan de coupe touche la matière coupée : il est tracé.
      const edges = [...q.edges]
      if (piece[1] !== b) edges[1] = true
      if (piece[0] !== a) edges[3] = true
      const texture = wallFacadeTexture(mesh.material)
      const clamped = clampToWidth({ ...face, edges, ...(texture ? { texture } : {}) }, uLo, uHi)
      if (clamped) faces.push(clamped)
    }
  }
  // Toitures : profil coupé en noir ; altitude du faîtage de chaque toiture coupée.
  const cutRoofs = new Set<string>()
  for (const prism of model.roofs) {
    const { faces: roofFaces, cut } = roofPrismSectionFaces(prism, look, cutDepth, uLo, uHi)
    faces.push(...roofFaces)
    if (cut && prism.kind === 'roof') cutRoofs.add(prism.sourceId)
  }
  const marks = levelMarks(levels)
  if (section.ridgeLabel) {
    const seen = new Set(marks.map((m) => Math.round(m.elevation)))
    for (const roofId of cutRoofs) {
      const top = Math.max(
        ...model.roofs.filter((p) => p.sourceId === roofId && p.kind === 'roof').flatMap((p) => p.polygon.map((q) => q.y)),
      )
      const elevation = Math.round(top)
      if (seen.has(elevation)) continue
      seen.add(elevation)
      marks.push({ levelId: `ridge-${roofId}`, name: section.ridgeLabel, elevation })
    }
    marks.sort((a, b) => a.elevation - b.elevation)
  }
  const ordered = paintOrder(mergeStackedEdges(faces))
  return { label: section.label, faces: ordered, bounds: facesBounds(ordered), levels: marks }
}
