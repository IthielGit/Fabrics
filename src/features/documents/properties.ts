import type { CanvasElement } from '../../types/document'

/** Propriétés numériques modifiables dans le panneau Propriétés (valeurs en unités d'affichage). */
export type NumericProp =
  | 'x'
  | 'y'
  | 'width'
  | 'height'
  | 'rotation'
  | 'opacity' // en pourcentage : 0 → 100
  | 'strokeWidth'
  | 'cornerRadius'
  | 'fontSize'

export type ColorProp = 'fill' | 'stroke'

/**
 * Propriétés numériques proposées pour un élément, dans l'ordre d'affichage.
 * Les éléments de plan (mur, pièce, cote) ont leurs propres réglages au jalon M3.
 */
export function numericPropsFor(element: CanvasElement): NumericProp[] {
  switch (element.type) {
    case 'rect':
      return ['x', 'y', 'width', 'height', 'rotation', 'opacity', 'strokeWidth', 'cornerRadius']
    case 'ellipse':
      return ['x', 'y', 'width', 'height', 'rotation', 'opacity', 'strokeWidth']
    case 'line':
      return ['x', 'y', 'rotation', 'opacity', 'strokeWidth']
    case 'text':
      return ['x', 'y', 'width', 'rotation', 'opacity', 'fontSize']
    case 'image':
      return ['x', 'y', 'width', 'height', 'rotation', 'opacity']
    case 'stair':
      // Forme et dimensions : champs propres (StairFields).
      return ['x', 'y', 'rotation', 'opacity']
    case 'furniture':
      // La taille d'un objet de la bibliothèque a ses propres champs (modes et limites du catalogue).
      return ['x', 'y', 'rotation', 'opacity']
    default:
      // Mur, pièce, cote : position et rotation restent à 0 (leurs points sont absolus) ;
      // leurs réglages propres sont dans le panneau (épaisseur, hauteur, décalage…).
      return ['opacity']
  }
}

export function colorPropsFor(element: CanvasElement): ColorProp[] {
  switch (element.type) {
    case 'rect':
    case 'ellipse':
      return ['fill', 'stroke']
    case 'line':
      return ['stroke']
    case 'text':
    case 'wall':
    case 'room':
    case 'platform':
      return ['fill']
    default:
      return []
  }
}

/** Opacité du remplissage d'une pièce : elle reste translucide quand on change sa couleur. */
export const ROOM_FILL_ALPHA = 0.18

/** `#6366f1` → `rgba(99, 102, 241, 0.18)`. Renvoie `null` si ce n'est pas une couleur hexadécimale. */
export function hexToRgba(hex: string, alpha: number): string | null {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex)
  if (!match) return null
  const [r, g, b] = [match[1], match[2], match[3]].map((part) => parseInt(part, 16))
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** `rgba(99, 102, 241, 0.18)` → `#6366f1` (l'opacité est ignorée). `null` si le format est inconnu. */
export function rgbaToHex(color: string): string | null {
  const match = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i.exec(color)
  if (!match) return null
  const parts = [match[1], match[2], match[3]].map((part) =>
    Math.min(255, Number(part)).toString(16).padStart(2, '0'),
  )
  return `#${parts.join('')}`
}

/**
 * Valeur affichée d'une propriété. Une ellipse est stockée par son centre et ses rayons :
 * on affiche son coin haut-gauche et sa taille, comme pour un rectangle.
 */
export function getNumericProp(element: CanvasElement, prop: NumericProp): number | null {
  switch (prop) {
    case 'x':
      return element.type === 'ellipse' ? element.x - element.radiusX : element.x
    case 'y':
      return element.type === 'ellipse' ? element.y - element.radiusY : element.y
    case 'rotation':
      return element.rotation
    case 'opacity':
      return Math.round(element.opacity * 100)
    case 'width':
      if (element.type === 'ellipse') return element.radiusX * 2
      return 'width' in element ? element.width : null
    case 'height':
      if (element.type === 'ellipse') return element.radiusY * 2
      return 'height' in element && element.type !== 'wall' ? element.height : null
    case 'strokeWidth':
      return 'strokeWidth' in element ? element.strokeWidth : null
    case 'cornerRadius':
      return element.type === 'rect' ? element.cornerRadius : null
    case 'fontSize':
      return element.type === 'text' ? element.fontSize : null
  }
}

const MIN_SIZE = 1

/** Renvoie une copie de l'élément avec la propriété modifiée (valeur bornée si nécessaire). */
export function setNumericProp(
  element: CanvasElement,
  prop: NumericProp,
  value: number,
): CanvasElement {
  if (!Number.isFinite(value)) return element

  switch (prop) {
    case 'x':
      return { ...element, x: element.type === 'ellipse' ? value + element.radiusX : value }
    case 'y':
      return { ...element, y: element.type === 'ellipse' ? value + element.radiusY : value }
    case 'rotation':
      return { ...element, rotation: value }
    case 'opacity':
      return { ...element, opacity: Math.min(100, Math.max(0, value)) / 100 }
    case 'width': {
      const width = Math.max(MIN_SIZE, value)
      if (element.type === 'ellipse') {
        // On garde le bord gauche en place.
        const left = element.x - element.radiusX
        return { ...element, radiusX: width / 2, x: left + width / 2 }
      }
      return element.type === 'rect' || element.type === 'image' || element.type === 'text'
        ? { ...element, width }
        : element
    }
    case 'height': {
      const height = Math.max(MIN_SIZE, value)
      if (element.type === 'ellipse') {
        const top = element.y - element.radiusY
        return { ...element, radiusY: height / 2, y: top + height / 2 }
      }
      return element.type === 'rect' || element.type === 'image' ? { ...element, height } : element
    }
    case 'strokeWidth':
      return element.type === 'rect' || element.type === 'ellipse' || element.type === 'line'
        ? { ...element, strokeWidth: Math.max(0, value) }
        : element
    case 'cornerRadius':
      return element.type === 'rect' ? { ...element, cornerRadius: Math.max(0, value) } : element
    case 'fontSize':
      return element.type === 'text' ? { ...element, fontSize: Math.max(MIN_SIZE, value) } : element
  }
}

/** Couleur affichée dans le sélecteur (toujours un `#rrggbb` ou une valeur « aucune couleur »). */
export function getColorProp(element: CanvasElement, prop: ColorProp): string | null {
  if (!colorPropsFor(element).includes(prop)) return null
  const color = (element as unknown as Record<ColorProp, string>)[prop]
  return element.type === 'room' ? (rgbaToHex(color) ?? color) : color
}

export function setColorProp(element: CanvasElement, prop: ColorProp, color: string): CanvasElement {
  if (!colorPropsFor(element).includes(prop)) return element
  if (element.type === 'room') {
    // La pièce garde un remplissage translucide pour laisser voir le plan dessous.
    return { ...element, fill: hexToRgba(color, ROOM_FILL_ALPHA) ?? color }
  }
  return { ...element, [prop]: color }
}

/** Valeur « pas de couleur » pour un remplissage ou un contour. */
export const NO_COLOR = 'transparent'

export function isNoColor(color: string): boolean {
  return color === NO_COLOR || color === ''
}
