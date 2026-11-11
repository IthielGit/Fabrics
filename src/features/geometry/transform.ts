import type {
  AxisElement,
  CanvasElement,
  ChimneyElement,
  DimensionElement,
  FurnitureElement,
  ImageElement,
  PlatformElement,
  RectElement,
  RoomElement,
  StairElement,
  WallElement,
} from '../../types/document'
import { getSymbol } from '../library/catalog'
import { resizeSymbol } from '../library/resize'
import { stairSize } from '../stairs/stairs'
import { toPoints } from './polygon'
import type { Point } from './viewport'

/** Vrai pour les éléments de plan : leurs points sont absolus et leur position `x, y` reste à 0. */
export function hasAbsolutePoints(
  element: CanvasElement,
): element is WallElement | RoomElement | PlatformElement | DimensionElement | AxisElement {
  return (
    element.type === 'wall' ||
    element.type === 'room' ||
    element.type === 'platform' ||
    element.type === 'dimension' ||
    element.type === 'axis'
  )
}

/**
 * Déplace un élément de (dx, dy). Un mur, une pièce, une cote ou un axe déplace ses points (leur
 * position `x, y` reste à 0, voir docs/02-ARCHITECTURE.md) ; les autres éléments déplacent `x, y`.
 */
export function translateElement(element: CanvasElement, dx: number, dy: number): CanvasElement {
  switch (element.type) {
    case 'wall':
    case 'room':
    case 'platform':
      return { ...element, points: element.points.map((v, i) => v + (i % 2 === 0 ? dx : dy)) }
    case 'dimension':
    case 'axis': {
      const [x1, y1, x2, y2] = element.points
      return { ...element, points: [x1 + dx, y1 + dy, x2 + dx, y2 + dy] }
    }
    case 'opening':
      // Sa place vient de son mur : elle ne se déplace jamais d'elle-même.
      return element
    default:
      return { ...element, x: element.x + dx, y: element.y + dy }
  }
}

const toRadians = (degrees: number) => (degrees * Math.PI) / 180

/** Largeur et hauteur de la boîte (avant rotation) d'un élément posé par son coin haut-gauche. */
export function boxSize(
  element: FurnitureElement | RectElement | ImageElement | StairElement | ChimneyElement,
): {
  width: number
  height: number
} {
  switch (element.type) {
    case 'furniture':
    case 'chimney':
      return { width: element.width, height: element.depth }
    case 'stair':
      return stairSize(element)
    default:
      return { width: element.width, height: element.height }
  }
}

/**
 * Pivote un élément d'un quart de tour (+90°, sens horaire) autour de son centre : il ne « saute »
 * pas. Concerne les objets de bibliothèque, rectangles, images et ellipses ; les autres éléments
 * (murs, pièces, cotes, axes, ouvertures, lignes, textes) sont rendus tels quels.
 */
export function rotateQuarterTurn(element: CanvasElement): CanvasElement {
  const rotation = (((element.rotation + 90) % 360) + 360) % 360
  switch (element.type) {
    case 'ellipse':
      return { ...element, rotation } // x, y = centre : rien d'autre à corriger
    case 'furniture':
    case 'rect':
    case 'image':
    case 'stair':
    case 'chimney': {
      const { width: w, height: h } = boxSize(element)
      const before = toRadians(element.rotation)
      const after = toRadians(rotation)
      // Centre actuel, puis coin haut-gauche qui le garde en place après rotation.
      const cx = element.x + (w * Math.cos(before) - h * Math.sin(before)) / 2
      const cy = element.y + (w * Math.sin(before) + h * Math.cos(before)) / 2
      return {
        ...element,
        rotation,
        x: Math.round(cx - (w * Math.cos(after) - h * Math.sin(after)) / 2),
        y: Math.round(cy - (w * Math.sin(after) + h * Math.cos(after)) / 2),
      }
    }
    default:
      return element
  }
}

/** Sommets modifiables d'un mur, d'une pièce, d'une cote ou d'un axe (liste vide pour les autres éléments). */
export function getVertices(element: CanvasElement): Point[] {
  return hasAbsolutePoints(element) ? toPoints(element.points) : []
}

/** Déplace un sommet (indice `index`) d'un mur, d'une pièce, d'une cote ou d'un axe. */
export function moveVertex(element: CanvasElement, index: number, to: Point): CanvasElement {
  if (!hasAbsolutePoints(element)) return element
  const count = element.points.length / 2
  if (!Number.isInteger(index) || index < 0 || index >= count) return element

  if (element.type === 'dimension' || element.type === 'axis') {
    const points: [number, number, number, number] = [...element.points]
    points[index * 2] = to.x
    points[index * 2 + 1] = to.y
    return { ...element, points }
  }
  if (element.type === 'wall' || element.type === 'room' || element.type === 'platform') {
    const points = [...element.points]
    points[index * 2] = to.x
    points[index * 2 + 1] = to.y
    return { ...element, points }
  }
  return element
}

/** Nombre minimal de sommets : 2 pour un mur, 3 pour une pièce. Une cote est fixe (2 sommets). */
const MIN_VERTICES = { wall: 2, room: 3, platform: 3 } as const

/** Un mur, une pièce : leur nombre de sommets peut changer (pas une cote). */
function hasEditableVertexCount(
  element: CanvasElement,
): element is WallElement | RoomElement | PlatformElement {
  return element.type === 'wall' || element.type === 'room' || element.type === 'platform'
}

/**
 * Milieux des côtés d'un mur ou d'une pièce, dans l'ordre : le milieu `i` est entre les sommets
 * `i` et `i + 1` (pour une pièce, le dernier côté referme sur le premier sommet).
 */
export function getSegmentMidpoints(element: CanvasElement): Point[] {
  if (!hasEditableVertexCount(element)) return []
  const vertices = toPoints(element.points)
  const count = element.type === 'wall' ? vertices.length - 1 : vertices.length
  const midpoints: Point[] = []
  for (let i = 0; i < count; i++) {
    const a = vertices[i]
    const b = vertices[(i + 1) % vertices.length]
    midpoints.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })
  }
  return midpoints
}

/** Ajoute un sommet au milieu du côté `segmentIndex` (voir `getSegmentMidpoints`). */
export function insertVertexAtMidpoint(element: CanvasElement, segmentIndex: number): CanvasElement {
  if (!hasEditableVertexCount(element)) return element
  const midpoints = getSegmentMidpoints(element)
  const middle = midpoints[segmentIndex]
  if (!Number.isInteger(segmentIndex) || !middle) return element
  const points = [...element.points]
  points.splice((segmentIndex + 1) * 2, 0, middle.x, middle.y)
  return { ...element, points }
}

/** Vrai si on peut retirer un sommet sans passer sous le minimum (2 pour un mur, 3 pour une pièce). */
export function canRemoveVertex(element: CanvasElement): boolean {
  return hasEditableVertexCount(element) && element.points.length / 2 > MIN_VERTICES[element.type]
}

/** Retire le sommet `index` ; l'élément reste inchangé s'il est déjà au nombre minimal de sommets. */
export function removeVertex(element: CanvasElement, index: number): CanvasElement {
  if (!hasEditableVertexCount(element) || !canRemoveVertex(element)) return element
  if (!Number.isInteger(index) || index < 0 || index >= element.points.length / 2) return element
  const points = [...element.points]
  points.splice(index * 2, 2)
  return { ...element, points }
}

/** État d'un nœud Konva à la fin d'un déplacement, d'un redimensionnement ou d'une rotation. */
export interface NodeTransform {
  x: number
  y: number
  rotation: number
  scaleX: number
  scaleY: number
}

/**
 * Applique la transformation d'un nœud à un élément du document.
 * Konva exprime le redimensionnement par un facteur d'échelle ; on le « cuit » dans les
 * dimensions de l'élément (le nœud est ensuite remis à l'échelle 1).
 */
export function applyNodeTransform(element: CanvasElement, node: NodeTransform): CanvasElement {
  const base = { x: node.x, y: node.y, rotation: node.rotation }
  const scaleX = Math.abs(node.scaleX)
  const scaleY = Math.abs(node.scaleY)

  switch (element.type) {
    case 'rect':
    case 'image':
      return {
        ...element,
        ...base,
        width: element.width * scaleX,
        height: element.height * scaleY,
      }
    case 'ellipse':
      return {
        ...element,
        ...base,
        radiusX: element.radiusX * scaleX,
        radiusY: element.radiusY * scaleY,
      }
    case 'text':
      return { ...element, ...base, width: element.width * scaleX }
    case 'furniture': {
      // La taille demandée est ramenée aux règles de l'objet (mode, limites, mm entiers).
      const requested = { width: element.width * scaleX, depth: element.depth * scaleY }
      const def = getSymbol(element.symbol)
      const size = def
        ? resizeSymbol(def, requested, { width: element.width, depth: element.depth })
        : { width: Math.round(requested.width), depth: Math.round(requested.depth) }
      return { ...element, ...base, ...size }
    }
    case 'chimney':
      return {
        ...element,
        ...base,
        width: Math.max(100, Math.round(element.width * scaleX)),
        depth: Math.max(100, Math.round(element.depth * scaleY)),
      }
    case 'line':
      // Les points sont relatifs à (x, y) : on les étire dans les axes du nœud.
      return {
        ...element,
        ...base,
        points: element.points.map((value, index) => value * (index % 2 === 0 ? scaleX : scaleY)),
      }
    default:
      // Éléments de plan : pas de redimensionnement par le transformateur (voir M3).
      return { ...element, ...base }
  }
}
