import { groupFurniture } from '../../features/library/furnitureList'
import type { FurnitureCsvRow } from '../../features/measurements/csv'
import type { CanvasElement } from '../../types/document'
import { categoryName, symbolName } from './symbolText'

/** Lignes du tableau « Mobilier et équipements » du CSV, avec les noms français. */
export function furnitureCsvRows(elements: readonly CanvasElement[]): FurnitureCsvRow[] {
  return groupFurniture(elements).map((group) => ({
    category: group.category === null ? '' : categoryName(group.category),
    name: symbolName(group.symbol),
    width: group.width,
    depth: group.depth,
    count: group.count,
    kind: group.kind,
  }))
}
