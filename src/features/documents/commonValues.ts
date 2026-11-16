import type { CanvasElement, DimensionElement, RoomElement, WallElement } from '../../types/document'
import { colorPropsFor, getColorProp, type ColorProp } from './properties'

/**
 * Modification groupée (plusieurs éléments sélectionnés) : valeurs communes et changements à appliquer
 * à chaque élément. Le panneau n'affiche un réglage que si tous les éléments sélectionnés l'ont.
 */

/** Valeur partagée par tous, `'mixed'` si elle diffère, `undefined` si la liste est vide. */
export type Shared<T> = T | 'mixed'

export function sharedValue<T>(values: readonly T[]): Shared<T> | undefined {
  if (values.length === 0) return undefined
  const first = values[0]
  return values.every((value) => value === first) ? first : 'mixed'
}

/** Couleurs modifiables ensemble : celles que tous les éléments ont (remplissage, contour). */
export function sharedColorProps(elements: readonly CanvasElement[]): ColorProp[] {
  if (elements.length === 0) return []
  return (['fill', 'stroke'] as const).filter((prop) =>
    elements.every((element) => colorPropsFor(element).includes(prop)),
  )
}

/** Couleur commune (`#rrggbb` ou « aucune »), ou `'mixed'`. */
export function sharedColor(elements: readonly CanvasElement[], prop: ColorProp): Shared<string> | undefined {
  return sharedValue(elements.map((element) => getColorProp(element, prop) ?? ''))
}

/** Tous les éléments sont du type donné (et il y en a au moins un). */
export function allOfType<K extends CanvasElement['type']>(
  elements: readonly CanvasElement[],
  type: K,
): elements is Extract<CanvasElement, { type: K }>[] {
  return elements.length > 0 && elements.every((element) => element.type === type)
}

// --- Changements élément par élément (les autres types sont rendus tels quels) ---

export function withShowLabel(element: CanvasElement, showLabel: boolean): CanvasElement {
  return element.type === 'room' ? { ...element, showLabel } : element
}

export function withFalseCeiling(element: CanvasElement, falseCeiling: boolean): CanvasElement {
  if (element.type !== 'room') return element
  // Sans faux plafond, le champ disparaît du document (comme une pièce d'avant M11 bis).
  const { falseCeiling: _previous, ...rest } = element
  void _previous
  const room: RoomElement = falseCeiling ? { ...rest, falseCeiling: true } : rest
  return room
}

export function withWallThickness(element: CanvasElement, mm: number): CanvasElement {
  if (element.type !== 'wall' || !Number.isFinite(mm)) return element
  const wall: WallElement = { ...element, thickness: Math.max(1, Math.round(mm)) }
  return wall
}

export function withWallHeight(element: CanvasElement, mm: number): CanvasElement {
  if (element.type !== 'wall' || !Number.isFinite(mm)) return element
  const wall: WallElement = { ...element, height: Math.max(1, Math.round(mm)) }
  return wall
}

export function withDimensionOffset(element: CanvasElement, mm: number): CanvasElement {
  if (element.type !== 'dimension' || !Number.isFinite(mm)) return element
  return { ...element, offset: Math.round(mm) }
}

export function withDimensionVisibleIn(
  element: CanvasElement,
  visibleIn: DimensionElement['visibleIn'],
): CanvasElement {
  if (element.type !== 'dimension') return element
  // Sans valeur, le champ disparaît du document (comme une cote d'avant M10 ter).
  const { visibleIn: _previous, ...rest } = element
  void _previous
  const dimension: DimensionElement = visibleIn ? { ...rest, visibleIn } : rest
  return dimension
}
