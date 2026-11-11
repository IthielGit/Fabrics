import type { Guide } from '../geometry/guides'
import { gridOnly, snapBox, type PlacementSnap } from '../geometry/snapLines'
import type { SetDef } from './catalog/sets'
import type { SymbolDef } from './types'

export interface PlacementPoint {
  x: number
  y: number
}

export interface PlacementResult extends PlacementPoint {
  /** Guides d'alignement à afficher pendant l'aperçu. */
  guides: Guide[]
}

const asSnap = (snap: PlacementSnap | number | null): PlacementSnap =>
  typeof snap === 'object' && snap !== null ? snap : gridOnly(snap)

/**
 * Position (coin haut-gauche, en mm entiers) d'un objet posé au point `point` : l'objet est centré
 * sur ce point, puis ses bords et son centre s'aimantent aux faces des murs et aux bords des autres
 * éléments proches ; à défaut, son **coin** (et non son centre) s'aimante à la grille, pour que ses
 * bords tombent sur la grille quelle que soit sa taille. `snap` peut être un simple pas de grille.
 */
export function furniturePlacement(
  def: Pick<SymbolDef, 'width' | 'depth'>,
  point: PlacementPoint,
  snap: PlacementSnap | number | null,
): PlacementResult {
  return snapBox(
    { x: point.x - def.width / 2, y: point.y - def.depth / 2, width: def.width, height: def.depth },
    asSnap(snap),
  )
}

/**
 * Coin haut-gauche de l'emprise intérieure d'un ensemble ou d'une pièce préfabriquée posée au
 * point `point`. Pour une pièce préfabriquée, c'est l'emprise **extérieure** du mur (faces
 * extérieures) qui est centrée et aimantée : ses faces extérieures, son axe et ses faces
 * intérieures s'alignent sur celles des murs voisins, et son coin extérieur suit la grille.
 */
export function setPlacement(
  set: Pick<SetDef, 'width' | 'depth' | 'shell'>,
  point: PlacementPoint,
  snap: PlacementSnap | number | null,
): PlacementResult {
  const thickness = set.shell?.thickness ?? 0
  const width = set.width + thickness * 2
  const height = set.depth + thickness * 2
  const snapped = snapBox(
    { x: point.x - width / 2, y: point.y - height / 2, width, height },
    asSnap(snap),
    thickness > 0 ? [thickness / 2, thickness] : [],
  )
  return { x: snapped.x + thickness, y: snapped.y + thickness, guides: snapped.guides }
}
