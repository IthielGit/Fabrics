import type { CanvasElement, ImageElement } from '../../types/document'
import { pointDistance } from './polygon'
import type { Point } from './viewport'

/**
 * Facteur de calibrage : distance réelle ÷ distance mesurée entre A et B (dans l'unité du document).
 * Renvoie `null` si A et B sont confondus ou si la distance réelle n'est pas strictement positive.
 */
export function calibrationFactor(a: Point, b: Point, realDistanceMm: number): number | null {
  const measured = pointDistance(a, b)
  if (measured === 0 || !(realDistanceMm > 0) || !Number.isFinite(realDistanceMm)) return null
  return realDistanceMm / measured
}

/**
 * Met une image à l'échelle `factor` en gardant le point A fixe : largeur, hauteur et position
 * sont multipliées autour de A (la rotation de l'image est conservée).
 */
export function calibrateImage(image: ImageElement, anchor: Point, factor: number): ImageElement {
  return {
    ...image,
    x: anchor.x + (image.x - anchor.x) * factor,
    y: anchor.y + (image.y - anchor.y) * factor,
    width: image.width * factor,
    height: image.height * factor,
  }
}

/** Vrai si `point` est dans l'image (rotation comprise ; l'origine de rotation est son coin haut-gauche). */
export function imageContainsPoint(image: ImageElement, point: Point): boolean {
  const radians = (-image.rotation * Math.PI) / 180
  const dx = point.x - image.x
  const dy = point.y - image.y
  const localX = dx * Math.cos(radians) - dy * Math.sin(radians)
  const localY = dx * Math.sin(radians) + dy * Math.cos(radians)
  return localX >= 0 && localX <= image.width && localY >= 0 && localY <= image.height
}

/** Image visible la plus haute (devant) qui contient le point, ou `undefined`. */
export function findImageAt(
  elements: readonly CanvasElement[],
  point: Point,
): ImageElement | undefined {
  for (let i = elements.length - 1; i >= 0; i--) {
    const element = elements[i]
    if (element.type === 'image' && !element.hidden && imageContainsPoint(element, point)) {
      return element
    }
  }
  return undefined
}
