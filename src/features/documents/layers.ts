import type { CanvasElement } from '../../types/document'

/**
 * Le tableau `elements` va du fond (indice 0) vers le dessus (dernier indice).
 * Le panneau Calques affiche l'inverse : l'élément du dessus est en haut de la liste.
 * Un « emplacement » (slot) est une position entre deux lignes de la liste affichée :
 * 0 = tout en haut (devant tout), n = tout en bas (derrière tout).
 */
export function moveElementToSlot(
  elements: readonly CanvasElement[],
  id: string,
  slot: number,
): CanvasElement[] {
  const display = [...elements].reverse()
  const from = display.findIndex((el) => el.id === id)
  if (from === -1) return [...elements]

  const [moved] = display.splice(from, 1)
  const clamped = Math.min(Math.max(slot, 0), display.length + 1)
  // Retirer la ligne décale les emplacements situés en dessous d'elle.
  const target = clamped > from ? clamped - 1 : clamped
  display.splice(target, 0, moved)
  return display.reverse()
}

/** Monte (`'up'`, vers l'avant-plan) ou descend (`'down'`) un élément d'un cran. */
export function stepElement(
  elements: readonly CanvasElement[],
  id: string,
  direction: 'up' | 'down',
): CanvasElement[] {
  const index = elements.findIndex((el) => el.id === id)
  const swapWith = direction === 'up' ? index + 1 : index - 1
  if (index === -1 || swapWith < 0 || swapWith >= elements.length) return [...elements]
  const next = [...elements]
  ;[next[index], next[swapWith]] = [next[swapWith], next[index]]
  return next
}

/**
 * Ordre de dessin : identique à `elements`, sauf qu'une ouverture placée sous son mur dans les
 * calques est dessinée juste au-dessus de lui (sinon la découpe du mur serait cachée).
 */
export function drawOrder(elements: readonly CanvasElement[]): CanvasElement[] {
  const wallIndex = new Map(elements.map((el, index) => [el.id, index]))
  const late = new Map<string, CanvasElement[]>() // ouvertures à dessiner après leur mur
  const kept: CanvasElement[] = []
  for (const [index, el] of elements.entries()) {
    const wall = el.type === 'opening' ? wallIndex.get(el.wallId) : undefined
    if (el.type === 'opening' && wall !== undefined && wall > index) {
      late.set(el.wallId, [...(late.get(el.wallId) ?? []), el])
    } else {
      kept.push(el)
    }
  }
  if (late.size === 0) return [...elements]
  return kept.flatMap((el) => [el, ...(late.get(el.id) ?? [])])
}

/** Vrai si les deux listes contiennent les mêmes éléments dans le même ordre. */
export function sameOrder(a: readonly CanvasElement[], b: readonly CanvasElement[]): boolean {
  return a.length === b.length && a.every((el, index) => el.id === b[index].id)
}
