import type { SymbolDef } from './types'

export interface PlacementPoint {
  x: number
  y: number
}

/**
 * Position (coin haut-gauche, en mm entiers) d'un objet posé au point `point` : l'objet est centré
 * sur ce point, et le centre est aimanté à la grille si elle est active (`gridSize` en mm).
 */
export function furniturePlacement(
  def: Pick<SymbolDef, 'width' | 'depth'>,
  point: PlacementPoint,
  gridSize: number | null,
): PlacementPoint {
  const snap = (value: number) =>
    gridSize !== null && gridSize > 0 ? Math.round(value / gridSize) * gridSize : Math.round(value)
  return {
    x: Math.round(snap(point.x) - def.width / 2),
    y: Math.round(snap(point.y) - def.depth / 2),
  }
}
