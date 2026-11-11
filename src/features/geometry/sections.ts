import type { CanvasElement, SectionLineElement } from '../../types/document'
import { lettersLabel, parseLettersLabel } from './axes'
import type { Point } from './viewport'

/** Longueur des flèches de sens de vue et rayon des bulles, en mm (lisibles à l'échelle 1:50). */
export const SECTION_ARROW_MM = 600
export const SECTION_BUBBLE_RADIUS_MM = 250

/**
 * Prochain repère de coupe : la suite de lettres (A, B, C…) à la suite du plus grand repère
 * existant. Les repères renommés à la main (qui ne sont pas des lettres) sont ignorés.
 */
export function nextSectionLabel(elements: readonly CanvasElement[]): string {
  let highest = 0
  for (const element of elements) {
    if (element.type !== 'section') continue
    highest = Math.max(highest, parseLettersLabel(element.label) ?? 0)
  }
  return lettersLabel(highest + 1)
}

/**
 * Direction du regard d'une ligne de coupe (vecteur unitaire dans le plan, y vers le bas) : la
 * perpendiculaire à gauche du sens de tracé (premier → deuxième point) si `lookLeft`, sinon à
 * droite. « À gauche » est celui de la personne qui marche du premier au deuxième point, vue de
 * dessus (donc, à l'écran où y descend, la gauche de (1, 0) est (0, −1)). `null` si les deux
 * points sont confondus.
 */
export function sectionLook(
  points: readonly number[],
  lookLeft: boolean,
): { x: number; y: number } | null {
  const [x1, y1, x2, y2] = points
  const length = Math.hypot(x2 - x1, y2 - y1)
  if (length === 0) return null
  const ux = (x2 - x1) / length
  const uy = (y2 - y1) / length
  // Gauche de (ux, uy) à l'écran (y vers le bas) : (uy, −ux).
  const left = { x: uy, y: -ux }
  const look = lookLeft ? left : { x: -left.x, y: -left.y }
  return { x: look.x === 0 ? 0 : look.x, y: look.y === 0 ? 0 : look.y }
}

export interface SectionGeometry {
  line: [Point, Point]
  /** Centres des deux bulles, au bout des flèches de sens de vue. */
  bubbles: [Point, Point]
  /** Flèches : de l'extrémité de la ligne vers le centre de sa bulle. */
  arrows: [[Point, Point], [Point, Point]]
  look: { x: number; y: number }
  length: number
}

/** Dessin d'une ligne de coupe : la ligne, une flèche vers le sens de vue à chaque bout, une bulle au bout de la flèche. */
export function sectionGeometry(
  points: readonly number[],
  lookLeft: boolean,
  arrow: number = SECTION_ARROW_MM,
  radius: number = SECTION_BUBBLE_RADIUS_MM,
): SectionGeometry | null {
  const look = sectionLook(points, lookLeft)
  if (!look) return null
  const [x1, y1, x2, y2] = points
  const a = { x: x1, y: y1 }
  const b = { x: x2, y: y2 }
  const tipA = { x: x1 + look.x * arrow, y: y1 + look.y * arrow }
  const tipB = { x: x2 + look.x * arrow, y: y2 + look.y * arrow }
  return {
    line: [a, b],
    arrows: [
      [a, tipA],
      [b, tipB],
    ],
    bubbles: [
      { x: tipA.x + look.x * radius, y: tipA.y + look.y * radius },
      { x: tipB.x + look.x * radius, y: tipB.y + look.y * radius },
    ],
    look,
    length: Math.hypot(x2 - x1, y2 - y1),
  }
}

/** Points qui bornent le dessin d'une ligne de coupe (extrémités, flèches, bulles), pour l'emprise exportée. */
export function sectionBoundsPoints(points: readonly number[], lookLeft: boolean): Point[] {
  const geometry = sectionGeometry(points, lookLeft)
  if (!geometry) return []
  return [
    ...geometry.line,
    ...geometry.bubbles.flatMap((c) => [
      { x: c.x - SECTION_BUBBLE_RADIUS_MM, y: c.y - SECTION_BUBBLE_RADIUS_MM },
      { x: c.x + SECTION_BUBBLE_RADIUS_MM, y: c.y + SECTION_BUBBLE_RADIUS_MM },
    ]),
  ]
}

export function isSection(element: CanvasElement): element is SectionLineElement {
  return element.type === 'section'
}

/** Intitulé d'une coupe : « Coupe A–A ». */
export function sectionTitle(label: string): string {
  return `${label}–${label}`
}
