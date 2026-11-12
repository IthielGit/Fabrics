import type { CanvasElement } from '../../types/document'

/** Groupe d'un fond importé (traits et textes d'un même DXF, D62), ou `undefined` pour un élément ordinaire. */
export function backgroundGroupId(element: CanvasElement): string | undefined {
  return element.type === 'line' || element.type === 'text' ? element.groupId : undefined
}
