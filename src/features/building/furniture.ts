import type { FurnitureElement, Level } from '../../types/document'
import { getSymbol } from '../library/catalog'
import type { WallPiece } from './types'

// Objets de la bibliothèque en 3D (M11 bis, lot F) : une boîte simple par objet, de la hauteur de
// référence du catalogue (`heights.ts`), posée sur le plancher de son niveau (ou plus haut pour un
// objet fixé en hauteur). Fonction pure.

/** Catégories sans volume en 3D : symboles conventionnels (prises, détecteurs…) et escaliers symboliques. */
export const FLAT_CATEGORIES = new Set(['electrical', 'safety', 'stairs'])

const toRadians = (degrees: number) => (degrees * Math.PI) / 180

/**
 * Boîte 3D d'un objet : emprise `width × depth` tournée de `rotation` autour du coin haut-gauche,
 * hauteur et hauteur de pose du catalogue. `null` pour un objet inconnu, une zone de référence, un
 * symbole conventionnel ou un objet à plat (hauteur nulle).
 */
export function buildFurniture(element: FurnitureElement, level: Level): WallPiece | null {
  const def = getSymbol(element.symbol)
  if (!def || def.zone || def.nominal || FLAT_CATEGORIES.has(def.category) || !(def.height > 0)) return null
  const angle = toRadians(element.rotation)
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const halfWidth = element.width / 2
  const halfDepth = element.depth / 2
  const elevation = def.elevation ?? 0
  return {
    sourceId: element.id,
    levelId: level.id,
    center: {
      x: element.x + halfWidth * cos - halfDepth * sin,
      y: level.elevation + elevation + def.height / 2,
      z: element.y + halfWidth * sin + halfDepth * cos,
    },
    // x = largeur le long de l'objet, y = hauteur, z = profondeur.
    size: { x: element.width, y: def.height, z: element.depth },
    // Le plan tourne dans le sens horaire (y vers le bas) ; en 3D, l'axe x devient (cos a, −sin a).
    rotationY: -angle,
  }
}
