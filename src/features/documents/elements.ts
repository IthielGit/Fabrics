import type {
  CanvasElement,
  EllipseElement,
  FabricsDocument,
  RectElement,
} from '../../types/document'

type Unit = FabricsDocument['unit']

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

/** Copies décalées des éléments donnés, avec de nouveaux identifiants. */
export function cloneElements(
  elements: readonly CanvasElement[],
  offset: number,
): CanvasElement[] {
  return elements.map((el) => ({
    ...structuredClone(el),
    id: crypto.randomUUID(),
    x: el.x + offset,
    y: el.y + offset,
  }))
}
