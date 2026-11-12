import type { CanvasElement } from '../../types/document'
import {
  axisIntersections,
  collectAxisSegments,
  nearestPointOnAxes,
  type AxisSegment,
} from './axes'
import { nearestBackgroundSnap, type BackgroundSegment } from './backgroundSnap'
import type { Guide } from './guides'
import { openingGeometry } from './openings'
import { flattenPoints, polygonArea, toPoints } from './polygon'
import type { Point } from './viewport'
import { wallFaceCorners, wallFaces } from './walls'

export type SnapKind = 'opening' | 'vertex' | 'axis' | 'wall' | 'align' | 'grid' | 'angle' | 'none'

/**
 * Nature d'un sommet sur lequel on s'aimante, pour dire à l'écran lequel est attrapé et pour que
 * chaque outil attrape d'abord ceux qui lui servent :
 * - `wall-axis` : point de l'axe d'un mur (milieu de son épaisseur) ;
 * - `wall-face-inner` / `wall-face-outer` : angle de la face intérieure ou extérieure d'un mur
 *   fermé (une pièce entourée de son mur) ;
 * - `wall-face` : angle de la face d'un mur ouvert, ou croisement des faces de deux murs ;
 * - `room` : sommet d'une pièce ou d'une plateforme ; `dimension` : extrémité d'une cote ;
 * - `axis-crossing` : croisement de deux axes de construction ; `draft` : point déjà posé du tracé ;
 * - `background-*` : extrémité, croisement, milieu ou point d'un trait du fond DXF importé.
 */
export type VertexKind =
  | 'wall-axis'
  | 'wall-face-inner'
  | 'wall-face-outer'
  | 'wall-face'
  | 'room'
  | 'dimension'
  | 'axis-crossing'
  | 'draft'
  | 'background-endpoint'
  | 'background-intersection'
  | 'background-midpoint'
  | 'background-edge'

/** Sommet d'aimantation ; sans `vertexKind`, c'est un point du tracé en cours (`draft`). */
export interface SnapVertex extends Point {
  vertexKind?: VertexKind
}

/**
 * Sommets que chaque outil attrape d'abord ; les autres restent attrapables, mais il faut en être
 * deux fois plus près (voir `PointSnapContext.preferredVertices`).
 * - Mur, axe et ligne de coupe : les axes des murs (un mur se trace sur son axe) ;
 * - Pièce et plateforme : les faces intérieures des murs et les sommets des pièces ;
 * - Cote : les faces des murs, les sommets des pièces et les extrémités des cotes.
 */
export function preferredVertexKinds(
  tool: 'wall' | 'room' | 'platform' | 'roof' | 'dimension' | 'axis' | 'section',
): ReadonlySet<VertexKind> {
  switch (tool) {
    case 'roof':
      // Une toiture se trace au nu extérieur des murs (D40).
      return new Set(['wall-face-outer', 'wall-face', 'draft'])
    case 'wall':
    case 'axis':
    case 'section':
      return new Set(['wall-axis', 'axis-crossing', 'draft'])
    case 'room':
    case 'platform':
      return new Set(['wall-face-inner', 'wall-face', 'room', 'draft'])
    case 'dimension':
      return new Set(['wall-face-inner', 'wall-face-outer', 'wall-face', 'room', 'dimension', 'draft'])
  }
}

/** Un segment de l'axe d'un mur, avec la distance d'accroche propre au mur (sa demi-épaisseur). */
export interface WallAxisSegment extends AxisSegment {
  reach: number
}

export interface PointSnapResult {
  point: Point
  kind: SnapKind
  /** Nature du sommet attrapé, quand `kind` vaut `vertex`. */
  vertexKind?: VertexKind
  /** Guides d'alignement à afficher (absent quand le point ne s'aligne sur rien). */
  guides?: Guide[]
}

export interface PointSnapContext {
  /** Sommets existants sur lesquels on peut s'aimanter (voir `collectSnapVertices`). */
  vertices: readonly SnapVertex[]
  /**
   * Sommets que l'outil attrape d'abord (voir `preferredVertexKinds`). Un autre sommet compte
   * comme deux fois plus loin : il faut s'en approcher davantage pour l'attraper, ce qui évite que
   * le curseur saute entre l'axe et les faces d'un même mur. Absent : tous les sommets se valent.
   */
  preferredVertices?: ReadonlySet<VertexKind>
  /**
   * Points d'ouverture (jambages et milieu, voir `collectOpeningSnapPoints`) : prioritaires sur les
   * sommets, car ils sont plus précis qu'un angle de mur voisin.
   */
  openingPoints?: readonly Point[]
  /**
   * Traits du fond DXF importé (voir `collectBackgroundSegments`) : le point s'aimante sur leurs
   * extrémités, croisements, milieux, puis sur le trait lui-même (sauf avec Maj).
   */
  background?: readonly BackgroundSegment[]
  /** Pas de la grille en mm, ou `null` si l'aimantation sur la grille est désactivée. */
  gridSize: number | null
  /** Distance d'accroche aux sommets, dans l'unité du document (8 px écran ÷ échelle). */
  threshold: number
  /** Point précédent du tracé (pour la contrainte d'angle), ou `null`. */
  from: Point | null
  /** Maj enfoncée : contraindre la direction à un multiple de 45° depuis `from`. */
  constrain: boolean
  /** Axes de construction : le point s'aimante sur leur ligne (voir `collectSnapAxes`). */
  axes?: readonly AxisSegment[]
  /**
   * Axes des murs existants : un point posé sur un mur (dans son épaisseur) ou près de lui est
   * ramené sur son axe, ce qui raccorde les murs en T au lieu de les superposer.
   */
  wallAxes?: readonly WallAxisSegment[]
  /**
   * Alignement doux : sans Maj, un point proche de l'horizontale ou de la verticale du point
   * précédent (`from`) est ramené exactement dessus. Désactivé par défaut (Alt le coupe à l'écran).
   */
  softAlign?: boolean
  /**
   * Points voisins (sommets de murs, de pièces…) : le curseur s'aligne en x et en y sur eux quand il
   * en est proche (guides d'alignement). Voir `collectAlignTargets`.
   */
  alignTargets?: readonly Point[]
}

/** Écart perpendiculaire maximal de l'alignement doux, en multiples de `threshold` (soit 12 px). */
const SOFT_ALIGN_DISTANCE_FACTOR = 1.5
/** Écart angulaire maximal de l'alignement doux : tangente de 5°. */
const SOFT_ALIGN_MAX_TAN = Math.tan((5 * Math.PI) / 180)

const SQRT_HALF = Math.SQRT1_2

// Les 8 directions (0°, 45°, 90°…) avec des valeurs exactes pour les axes (pas de 6e-17 parasite).
const DIRECTIONS: readonly Point[] = [
  { x: 1, y: 0 },
  { x: SQRT_HALF, y: SQRT_HALF },
  { x: 0, y: 1 },
  { x: -SQRT_HALF, y: SQRT_HALF },
  { x: -1, y: 0 },
  { x: -SQRT_HALF, y: -SQRT_HALF },
  { x: 0, y: -1 },
  { x: SQRT_HALF, y: -SQRT_HALF },
]

/**
 * Ramène `to` sur la direction (multiple de 45°) la plus proche de `from` : le point est la
 * projection du curseur sur cette direction, donc il reste aligné avec le curseur.
 */
export function constrainAngle(from: Point, to: Point): Point {
  const dx = to.x - from.x
  const dy = to.y - from.y
  if (dx === 0 && dy === 0) return { ...to }
  const step = Math.round(Math.atan2(dy, dx) / (Math.PI / 4))
  const direction = DIRECTIONS[((step % 8) + 8) % 8]
  const length = dx * direction.x + dy * direction.y
  return { x: from.x + direction.x * length, y: from.y + direction.y * length }
}

/**
 * Ramène `to` exactement à l'horizontale ou à la verticale de `from` quand il en est assez proche
 * (écart perpendiculaire ≤ 1,5 × `threshold` et angle ≤ 5°), sinon `null`.
 */
export function softAlign(from: Point, to: Point, threshold: number): Point | null {
  const dx = Math.abs(to.x - from.x)
  const dy = Math.abs(to.y - from.y)
  const maxOffset = threshold * SOFT_ALIGN_DISTANCE_FACTOR
  if (dx >= dy) {
    return dy <= maxOffset && dy <= dx * SOFT_ALIGN_MAX_TAN ? { x: to.x, y: from.y } : null
  }
  return dx <= maxOffset && dx <= dy * SOFT_ALIGN_MAX_TAN ? { x: from.x, y: to.y } : null
}

/** Point de l'axe d'un mur le plus proche de `point`, à moins de max(`threshold`, demi-épaisseur). */
function nearestPointOnWallAxes(
  point: Point,
  walls: readonly WallAxisSegment[],
  threshold: number,
): Point | null {
  let best: Point | null = null
  let bestDistance = Infinity
  for (const wall of walls) {
    const projected = nearestPointOnAxes(point, [wall], Math.max(threshold, wall.reach))
    if (!projected) continue
    const distance = Math.hypot(projected.x - point.x, projected.y - point.y)
    if (distance < bestDistance) {
      best = projected
      bestDistance = distance
    }
  }
  return best
}

function roundToGrid(value: number, grid: number): number {
  return Math.round(value / grid) * grid
}

function nearestVertex(point: Point, vertices: readonly Point[], threshold: number): Point | null {
  let best: Point | null = null
  let bestDistance = threshold
  for (const vertex of vertices) {
    const distance = Math.hypot(vertex.x - point.x, vertex.y - point.y)
    if (distance <= bestDistance) {
      best = vertex
      bestDistance = distance
    }
  }
  return best
}

/** Écart compté pour un sommet que l'outil n'attrape pas en priorité (deux fois sa distance). */
const SECONDARY_VERTEX_FACTOR = 2

/**
 * Sommet le plus proche à moins de `threshold`. Un sommet hors de `preferred` compte comme deux
 * fois plus loin : un sommet préféré à 7 px gagne sur un autre à 4 px, mais pas sur un autre à 3 px.
 */
function nearestSnapVertex(
  point: Point,
  vertices: readonly SnapVertex[],
  threshold: number,
  preferred: ReadonlySet<VertexKind> | undefined,
): SnapVertex | null {
  let best: SnapVertex | null = null
  let bestScore = threshold
  for (const vertex of vertices) {
    const distance = Math.hypot(vertex.x - point.x, vertex.y - point.y)
    const kind = vertex.vertexKind ?? 'draft'
    const score = !preferred || preferred.has(kind) ? distance : distance * SECONDARY_VERTEX_FACTOR
    if (score <= bestScore) {
      best = vertex
      bestScore = score
    }
  }
  return best
}

/**
 * Aimantation d'un point en cours de placement. Ordre de priorité (docs/02-ARCHITECTURE.md) :
 * 1. un sommet existant à moins de `threshold` (les croisements d'axes en font partie), puis un
 *    point du fond DXF importé (extrémité, croisement, milieu, trait) ;
 * 2. la ligne d'un axe de construction à moins de `threshold` (sauf avec Maj : la direction
 *    contrainte prime), puis l'axe d'un mur existant (même exception) ;
 * 3. l'alignement en x et en y sur les points voisins (`alignTargets`), qui produit des guides ;
 *    la coordonnée alignée n'est plus arrondie à la grille ;
 * 4. la grille, si elle est active ;
 * 5. avec Maj : la direction contrainte à un multiple de 45° depuis le point précédent ;
 *    sans Maj, avec `softAlign` : l'horizontale ou la verticale du point précédent si le curseur
 *    en est proche. Dans les deux cas la grille s'applique ensuite le long de cette direction.
 */
export function snapPoint(raw: Point, context: PointSnapContext): PointSnapResult {
  const { vertices, gridSize, threshold, from, constrain, axes } = context
  const constrained = constrain && from !== null
  let candidate = constrained ? constrainAngle(from, raw) : raw

  if (context.openingPoints && context.openingPoints.length > 0) {
    const opening = nearestVertex(candidate, context.openingPoints, threshold)
    if (opening) return { point: { ...opening }, kind: 'opening' }
  }

  const vertex = nearestSnapVertex(candidate, vertices, threshold, context.preferredVertices)
  if (vertex) {
    return {
      point: { x: vertex.x, y: vertex.y },
      kind: 'vertex',
      vertexKind: vertex.vertexKind ?? 'draft',
    }
  }

  if (context.background && context.background.length > 0) {
    const onBackground = nearestBackgroundSnap(candidate, context.background, threshold, !constrained)
    if (onBackground) {
      return {
        point: onBackground.point,
        kind: 'vertex',
        vertexKind: `background-${onBackground.kind}`,
      }
    }
  }

  if (!constrained && axes && axes.length > 0) {
    const onAxis = nearestPointOnAxes(candidate, axes, threshold)
    if (onAxis) return { point: onAxis, kind: 'axis' }
  }

  if (!constrained && context.wallAxes && context.wallAxes.length > 0) {
    const onWall = nearestPointOnWallAxes(candidate, context.wallAxes, threshold)
    if (onWall) return { point: onWall, kind: 'wall' }
  }

  // Alignement doux : une direction droite est préférée à la grille, qui ferait pencher le tracé.
  let direction = constrained
  if (!constrained && context.softAlign && from !== null) {
    const aligned = softAlign(from, candidate, threshold)
    if (aligned) {
      candidate = aligned
      direction = true
    }
  }

  // Alignement avec d'autres points : x et y se règlent chacun sur celui d'un point voisin. Sur une
  // direction horizontale ou verticale, seule la coordonnée libre peut s'aligner ; sur une
  // diagonale, aucune.
  let alignedX: Point | null = null
  let alignedY: Point | null = null
  const targets = context.alignTargets
  if (targets && targets.length > 0) {
    const horizontal = direction && from !== null && Math.abs(candidate.y - from.y) < 1e-9
    const vertical = direction && from !== null && Math.abs(candidate.x - from.x) < 1e-9
    if (!direction || horizontal || vertical) {
      if (!vertical) alignedX = nearestAlignment('x', candidate, targets, threshold)
      if (!horizontal) alignedY = nearestAlignment('y', candidate, targets, threshold)
      candidate = { x: alignedX ? alignedX.x : candidate.x, y: alignedY ? alignedY.y : candidate.y }
    }
  }
  const aligned = alignedX !== null || alignedY !== null
  const withGuides = (result: PointSnapResult): PointSnapResult => {
    if (!aligned) return result
    const guides: Guide[] = []
    if (alignedX) guides.push({ orientation: 'vertical', position: result.point.x })
    if (alignedY) guides.push({ orientation: 'horizontal', position: result.point.y })
    return { ...result, guides }
  }

  if (gridSize !== null && gridSize > 0) {
    if (direction && from !== null) {
      const dx = candidate.x - from.x
      const dy = candidate.y - from.y
      if (Math.abs(dy) < 1e-9) {
        candidate = { x: alignedX ? candidate.x : roundToGrid(candidate.x, gridSize), y: candidate.y }
      } else if (Math.abs(dx) < 1e-9) {
        candidate = { x: candidate.x, y: alignedY ? candidate.y : roundToGrid(candidate.y, gridSize) }
      } else {
        // Diagonale à 45° : on arrondit x, y suit pour rester à 45°.
        const x = roundToGrid(candidate.x, gridSize)
        candidate = { x, y: from.y + Math.sign(dy) * Math.abs(x - from.x) }
      }
      return withGuides({ point: candidate, kind: 'angle' })
    }
    return withGuides({
      point: {
        x: alignedX ? candidate.x : roundToGrid(candidate.x, gridSize),
        y: alignedY ? candidate.y : roundToGrid(candidate.y, gridSize),
      },
      kind: aligned ? 'align' : 'grid',
    })
  }

  return withGuides({ point: candidate, kind: direction ? 'angle' : aligned ? 'align' : 'none' })
}

/**
 * Point voisin dont l'abscisse (`axis` = 'x') ou l'ordonnée (`axis` = 'y') est la plus proche de
 * celle de `point`, à moins de `threshold` ; à égalité, le plus proche sur l'autre coordonnée.
 */
function nearestAlignment(
  axis: 'x' | 'y',
  point: Point,
  targets: readonly Point[],
  threshold: number,
): Point | null {
  const other = axis === 'x' ? 'y' : 'x'
  let best: Point | null = null
  let bestGap = threshold
  let bestAlong = Infinity
  for (const target of targets) {
    const gap = Math.abs(target[axis] - point[axis])
    if (gap > bestGap) continue
    const along = Math.abs(target[other] - point[other])
    if (gap < bestGap || along < bestAlong) {
      best = target
      bestGap = gap
      bestAlong = along
    }
  }
  return best
}

/**
 * Points sur lesquels aligner le curseur (guides d'alignement) : sommets des murs, des pièces et
 * des cotes. `excludeIds` écarte par exemple l'élément dont on déplace un sommet.
 */
export function collectAlignTargets(
  elements: readonly CanvasElement[],
  excludeIds: ReadonlySet<string> = new Set(),
): Point[] {
  const targets: Point[] = []
  for (const element of elements) {
    if (element.hidden || excludeIds.has(element.id)) continue
    if (
      element.type === 'wall' ||
      element.type === 'room' ||
      element.type === 'platform' ||
      element.type === 'dimension'
    ) {
      targets.push(...toPoints(element.points))
    }
  }
  return targets
}

/**
 * Sommets du plan sur lesquels s'aimanter : points des murs, angles de leurs faces (et croisements
 * des faces de murs différents), sommets des pièces, extrémités des cotes, croisements des axes.
 * `excludeIds` écarte des éléments (par exemple celui dont on déplace un sommet).
 */
export function collectSnapVertices(
  elements: readonly CanvasElement[],
  excludeIds: ReadonlySet<string> = new Set(),
): SnapVertex[] {
  const vertices: SnapVertex[] = []
  const walls: { points: readonly number[]; thickness: number; levelId?: string }[] = []
  const tag = (points: readonly Point[], vertexKind: VertexKind): SnapVertex[] =>
    points.map((p) => ({ x: p.x, y: p.y, vertexKind }))

  for (const element of elements) {
    if (element.hidden || excludeIds.has(element.id)) continue
    switch (element.type) {
      case 'wall':
        vertices.push(...tag(toPoints(element.points), 'wall-axis'))
        walls.push({ points: element.points, thickness: element.thickness, levelId: element.levelId })
        break
      case 'room':
      case 'platform':
        vertices.push(...tag(toPoints(element.points), 'room'))
        break
      case 'dimension':
        vertices.push(...tag(toPoints(element.points), 'dimension'))
        break
    }
  }

  // Angles des faces : intérieure / extérieure pour un mur fermé (la face intérieure est celle qui
  // entoure la plus petite surface), sans distinction pour un mur ouvert.
  // Les croisements de faces ne se cherchent qu'entre murs d'un même niveau : les murs d'un niveau
  // de référence affiché ne se croisent pas avec ceux du niveau actif.
  const faceCounts = new Map<string | undefined, number>()
  for (const wall of walls) {
    const { left, right } = wallFaces(wall.points, wall.thickness)
    faceCounts.set(wall.levelId, (faceCounts.get(wall.levelId) ?? 0) + left.length + right.length)
    const flat = toPoints(wall.points)
    const closed =
      flat.length >= 4 &&
      Math.abs(flat[0].x - flat[flat.length - 1].x) < 1e-6 &&
      Math.abs(flat[0].y - flat[flat.length - 1].y) < 1e-6
    if (!closed) {
      vertices.push(...tag([...left, ...right], 'wall-face'))
      continue
    }
    const leftInner = polygonArea(flattenPoints(left)) < polygonArea(flattenPoints(right))
    vertices.push(...tag(left, leftInner ? 'wall-face-inner' : 'wall-face-outer'))
    vertices.push(...tag(right, leftInner ? 'wall-face-outer' : 'wall-face-inner'))
  }
  // Croisements des faces de murs différents (après les angles, dans `wallFaceCorners`).
  for (const [levelId, faceCount] of faceCounts) {
    const group = walls.filter((wall) => wall.levelId === levelId)
    vertices.push(...tag(wallFaceCorners(group).slice(faceCount), 'wall-face'))
  }
  vertices.push(...tag(axisIntersections(collectAxisSegments(elements, excludeIds)), 'axis-crossing'))
  return vertices
}

/** Axes de construction visibles sur lesquels s'aimanter (voir `PointSnapContext.axes`). */
export function collectSnapAxes(
  elements: readonly CanvasElement[],
  excludeIds: ReadonlySet<string> = new Set(),
): AxisSegment[] {
  return collectAxisSegments(elements, excludeIds)
}

/**
 * Axes des murs visibles (un segment par côté de l'axe) sur lesquels s'aimanter. `excludeIds` écarte
 * par exemple le mur dont on déplace un sommet.
 */
export function collectSnapWallAxes(
  elements: readonly CanvasElement[],
  excludeIds: ReadonlySet<string> = new Set(),
): WallAxisSegment[] {
  const segments: WallAxisSegment[] = []
  for (const element of elements) {
    if (element.type !== 'wall' || element.hidden || excludeIds.has(element.id)) continue
    const points = toPoints(element.points)
    for (let i = 1; i < points.length; i++) {
      segments.push({ a: points[i - 1], b: points[i], reach: element.thickness / 2 })
    }
  }
  return segments
}

/**
 * Points d'ouverture sur lesquels une cote s'aimante : pour chaque porte, fenêtre ou baie visible
 * (dont le mur est visible), les deux jambages (bords de l'ouverture) et le milieu, sur l'axe du mur
 * et sur ses deux faces. Cela permet de coter la largeur d'une ouverture, ou la distance d'un angle
 * du mur au bord d'une ouverture (trumeau).
 */
export function collectOpeningSnapPoints(
  elements: readonly CanvasElement[],
  excludeIds: ReadonlySet<string> = new Set(),
): Point[] {
  const walls = new Map<string, Extract<CanvasElement, { type: 'wall' }>>()
  for (const element of elements) {
    if (element.type === 'wall' && !element.hidden) walls.set(element.id, element)
  }

  const points: Point[] = []
  for (const element of elements) {
    if (element.type !== 'opening' || element.hidden || excludeIds.has(element.id)) continue
    const wall = walls.get(element.wallId)
    if (!wall) continue
    const geometry = openingGeometry(element, wall)
    if (!geometry) continue
    const half = geometry.thickness / 2
    for (const base of [geometry.start, geometry.center, geometry.end]) {
      for (const side of [-1, 0, 1]) {
        points.push({
          x: base.x + geometry.normal.x * half * side,
          y: base.y + geometry.normal.y * half * side,
        })
      }
    }
  }
  return points
}

export { wallFaces }
