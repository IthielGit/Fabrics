import type {
  AxisElement,
  CanvasElement,
  DimensionElement,
  EllipseElement,
  FabricsDocument,
  FurnitureElement,
  ImageElement,
  LineElement,
  OpeningElement,
  RectElement,
  RoomElement,
  TextElement,
  WallElement,
} from '../../types/document'
import { translateElement } from '../geometry/transform'
import { DEFAULT_FONT_FAMILY } from './fonts'

type Unit = FabricsDocument['unit']

/** Épaisseur de trait par défaut d'une ligne (4 px, ou 50 mm sur un plan). */
export function defaultStrokeWidth(unit: Unit): number {
  return unit === 'mm' ? 50 : 4
}

/** Taille par défaut d'une forme créée d'un simple clic (200 px, ou 1 m sur un plan). */
export function defaultShapeSize(unit: Unit): number {
  return unit === 'mm' ? 1000 : 200
}

/** Décalage appliqué à une copie pour qu'elle ne soit pas cachée sous l'original. */
export function duplicateOffset(unit: Unit): number {
  return unit === 'mm' ? 200 : 20
}

/** « Rectangle 3 » : numéro = nombre d'éléments du même type + 1. */
export function nextElementName(
  baseName: string,
  type: CanvasElement['type'],
  elements: readonly CanvasElement[],
): string {
  const count = elements.filter((el) => el.type === type).length
  return `${baseName} ${count + 1}`
}

const BASE = { rotation: 0, opacity: 1, locked: false, hidden: false } as const

export function createRectElement(
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
): RectElement {
  return {
    ...BASE,
    id: crypto.randomUUID(),
    type: 'rect',
    name,
    x,
    y,
    width,
    height,
    fill: '#6366f1',
    stroke: '#312e81',
    strokeWidth: 0,
    cornerRadius: 0,
  }
}

/** Ellipse définie par son rectangle englobant (x, y = coin haut-gauche). */
export function createEllipseElement(
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
): EllipseElement {
  return {
    ...BASE,
    id: crypto.randomUUID(),
    type: 'ellipse',
    name,
    // Konva positionne une ellipse par son centre.
    x: x + width / 2,
    y: y + height / 2,
    radiusX: width / 2,
    radiusY: height / 2,
    fill: '#f59e0b',
    stroke: '#78350f',
    strokeWidth: 0,
  }
}

/** Décalage par défaut de la ligne d'une cote par rapport aux points mesurés (50 cm). */
export const DEFAULT_DIMENSION_OFFSET = 500

/** Mur dont l'axe passe par `points` (`[x1, y1, x2, y2, …]`, coordonnées absolues en mm). */
export function createWallElement(
  name: string,
  points: number[],
  thickness: number,
  height: number,
): WallElement {
  return {
    ...BASE,
    id: crypto.randomUUID(),
    type: 'wall',
    name,
    x: 0,
    y: 0,
    points,
    thickness,
    height,
    fill: '#475569',
  }
}

/** Dimensions par défaut d'une ouverture, en mm (hauteur d'allège comprise). */
export const OPENING_DEFAULTS = {
  door: { width: 900, height: 2100, sillHeight: 0 },
  window: { width: 1200, height: 1000, sillHeight: 900 },
  bay: { width: 2400, height: 2150, sillHeight: 0 },
} as const satisfies Record<OpeningElement['kind'], { width: number; height: number; sillHeight: number }>

/**
 * Ouverture posée sur un mur. Elle n'a pas de position propre : `x`, `y` et `rotation` restent à 0,
 * sa place vient de son mur (`wallId`, `segmentIndex`) et de `offset`.
 */
export function createOpeningElement(
  kind: OpeningElement['kind'],
  name: string,
  placement: Pick<OpeningElement, 'wallId' | 'segmentIndex' | 'offset' | 'side'>,
): OpeningElement {
  return {
    ...BASE,
    id: crypto.randomUUID(),
    type: 'opening',
    name,
    x: 0,
    y: 0,
    kind,
    ...OPENING_DEFAULTS[kind],
    ...placement,
    hinge: 'start',
  }
}

/** Pièce : polygone fermé (le dernier point rejoint le premier), coordonnées absolues en mm. */
export function createRoomElement(name: string, points: number[]): RoomElement {
  return {
    ...BASE,
    id: crypto.randomUUID(),
    type: 'room',
    name,
    x: 0,
    y: 0,
    points,
    fill: 'rgba(99, 102, 241, 0.18)',
    showLabel: true,
  }
}

/** Cote entre deux points (coordonnées absolues en mm). */
export function createDimensionElement(
  name: string,
  points: [number, number, number, number],
  offset: number = DEFAULT_DIMENSION_OFFSET,
): DimensionElement {
  return { ...BASE, id: crypto.randomUUID(), type: 'dimension', name, x: 0, y: 0, points, offset }
}

/**
 * Axe de construction entre deux points (coordonnées absolues en mm). Il est commun à tous les
 * niveaux : il n'a jamais de `levelId`.
 */
export function createAxisElement(
  name: string,
  label: string,
  points: [number, number, number, number],
): AxisElement {
  return { ...BASE, id: crypto.randomUUID(), type: 'axis', name, x: 0, y: 0, points, label }
}

/**
 * Objet de la bibliothèque posé avec son coin haut-gauche en (x, y), à sa taille par défaut
 * (`width` et `depth` sont ceux de l'objet du catalogue, en mm).
 */
export function createFurnitureElement(
  name: string,
  symbol: string,
  x: number,
  y: number,
  width: number,
  depth: number,
): FurnitureElement {
  return { ...BASE, id: crypto.randomUUID(), type: 'furniture', name, symbol, x, y, width, depth }
}

/** Image déjà enregistrée dans le stockage (`assetId`), posée avec son coin haut-gauche en (x, y). */
export function createImageElement(
  name: string,
  assetId: string,
  x: number,
  y: number,
  width: number,
  height: number,
): ImageElement {
  return { ...BASE, id: crypto.randomUUID(), type: 'image', name, assetId, x, y, width, height }
}

/** Taille de police par défaut (48 px, ou 300 mm sur un plan). */
export function defaultFontSize(unit: Unit): number {
  return unit === 'mm' ? 300 : 48
}

/** Texte posé au point (x, y) ; la largeur par défaut permet d'écrire environ 8 caractères par ligne. */
export function createTextElement(
  name: string,
  x: number,
  y: number,
  text: string,
  fontSize: number,
): TextElement {
  return {
    ...BASE,
    id: crypto.randomUUID(),
    type: 'text',
    name,
    x,
    y,
    text,
    width: fontSize * 8,
    fontFamily: DEFAULT_FONT_FAMILY,
    fontSize,
    fontStyle: 'normal',
    align: 'left',
    fill: '#0f172a',
  }
}

/** Ligne du point (x, y) au point (x + dx, y + dy) : les points sont relatifs à (x, y). */
export function createLineElement(
  name: string,
  x: number,
  y: number,
  dx: number,
  dy: number,
  strokeWidth: number,
): LineElement {
  return {
    ...BASE,
    id: crypto.randomUUID(),
    type: 'line',
    name,
    x,
    y,
    points: [0, 0, dx, dy],
    stroke: '#0f172a',
    strokeWidth,
    arrowEnd: false,
  }
}

/**
 * Copies décalées des éléments donnés, avec de nouveaux identifiants. Une ouverture copiée avec son
 * mur est rattachée à la copie du mur ; une ouverture dont le mur n'est pas copié est ignorée.
 */
export function cloneElements(
  elements: readonly CanvasElement[],
  offset: number,
): CanvasElement[] {
  const newIds = new Map<string, string>(elements.map((el) => [el.id, crypto.randomUUID()]))
  return elements.flatMap((el): CanvasElement[] => {
    // Pour un mur, une pièce ou une cote, ce sont les points qui bougent (x et y restent à 0).
    const copy = translateElement({ ...structuredClone(el), id: newIds.get(el.id)! }, offset, offset)
    if (copy.type !== 'opening') return [copy]
    const wallId = newIds.get(copy.wallId)
    return wallId ? [{ ...copy, wallId }] : []
  })
}
