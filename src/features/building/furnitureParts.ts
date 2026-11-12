import type { FurnitureElement, Level } from '../../types/document'
import { getSymbol } from '../library/catalog'
import { FLAT_CATEGORIES, buildFurniture } from './furniture'
import type { FurnitureLook, FurniturePiece, PieceShape } from './types'

// Objets de la bibliothèque en 3D, version « jolie » : un aspect (bois, tissu, plante, eau…) par type
// d'objet, des formes rondes pour les objets ronds, et plusieurs volumes pour ce qui n'est pas un
// bloc (parasol, pergola, voiture, arbre, piscine). Fonctions pures, sans Three.js.

const toRadians = (degrees: number) => (degrees * Math.PI) / 180

/** Un volume, repéré par rapport au centre de l'objet (u : le long de la largeur, v : de la profondeur). */
interface Part {
  u?: number
  v?: number
  w: number
  d: number
  /** Dessous et dessus au-dessus du plancher du niveau, mm. */
  y0: number
  y1: number
  shape?: PieceShape
  look: FurnitureLook
}

/** Aspect de l'objet ; la première règle qui correspond gagne. */
const LOOKS: readonly (readonly [RegExp, FurnitureLook])[] = [
  [/^car-suv$/, 'carDark'],
  [/^(car|car-compact|car-sedan)$/, 'carLight'],
  [/^(van|truck|bus)$/, 'white'],
  [/^(tree-|shrub|hedge|flower-bed|vegetable-patch|plant-|pot-large|planter-box)/, 'plant'],
  [/^sun-lounger$/, 'canvas'],
  [/^(swimming-pool|pond)/, 'water'],
  [/^(kitchen-island|breakfast-bar|worktop|outdoor-kitchen|fireplace|bbq)/, 'stone'],
  [/^(sofa-|armchair|daybed|pouf-|bed-|crib|lounge-office|office-chair|chair-visitor)/, 'fabric'],
  [
    /^(fridge|freezer|washing-machine|dryer|washer-|dishwasher|oven|cooker|hob|microwave|hood|wc|washbasin|bathtub|shower|vanity-unit|basin|bidet|urinal|utility-sink|sink-|kitchen-)/,
    'white',
  ],
  [/^(water-heater|boiler|garage-rack|bike|motorcycle|scooter|server-rack|printer|copier)/, 'metal'],
  [
    /^(table|desk|chair|bench|stool|wardrobe|dressing|bookcase|sideboard|console|dresser|chest|tv-unit|nightstand|display-cabinet|buffet|cabinet|shelf|shelving|trunk|vanity$|coffee-table|side-table)/,
    'wood',
  ],
]

export function lookOf(symbol: string): FurnitureLook {
  return LOOKS.find(([pattern]) => pattern.test(symbol))?.[1] ?? 'neutral'
}

/** Objets dont l'emprise est ronde ou ovale : un cylindre plutôt qu'une boîte. */
const ROUND = /^(table-round|coffee-table-round|side-table-round|pouf-round|table-oval|stool|stool-bar|basin-vessel|swimming-pool-round|pond)/

export function shapeOf(symbol: string): PieceShape {
  return ROUND.test(symbol) ? 'cylinder' : 'box'
}

/** Quatre coins `(±u, ±v)` pour poser un poteau ou une roue. */
function corners(u: number, v: number): [number, number][] {
  return [
    [-u, -v],
    [u, -v],
    [-u, v],
    [u, v],
  ]
}

/** Volumes d'un objet qui n'est pas un simple bloc ; `null` pour un objet simple. */
function recipe(symbol: string, w: number, d: number, h: number): Part[] | null {
  if (symbol === 'swimming-pool') {
    // Bassin d'eau peu épais, entouré d'une margelle de 250 mm.
    const rim = 250
    const copingHeight = 100
    return [
      { w, d, y0: 0, y1: 50, look: 'water' },
      { v: -(d / 2 + rim / 2), w: w + 2 * rim, d: rim, y0: 0, y1: copingHeight, look: 'stone' },
      { v: d / 2 + rim / 2, w: w + 2 * rim, d: rim, y0: 0, y1: copingHeight, look: 'stone' },
      { u: -(w / 2 + rim / 2), w: rim, d, y0: 0, y1: copingHeight, look: 'stone' },
      { u: w / 2 + rim / 2, w: rim, d, y0: 0, y1: copingHeight, look: 'stone' },
    ]
  }
  if (symbol === 'swimming-pool-round' || symbol === 'pond') {
    return [{ w, d, y0: 0, y1: 50, shape: 'cylinder', look: 'water' }]
  }
  if (/^tree-(small|medium|large|fruit|palm)$/.test(symbol)) {
    const trunk = Math.min(300, Math.max(120, Math.min(w, d) * 0.06))
    return [
      { w: trunk, d: trunk, y0: 0, y1: h * 0.5, shape: 'cylinder', look: 'wood' },
      { w, d, y0: h * 0.3, y1: h, shape: 'sphere', look: 'plant' },
    ]
  }
  if (symbol === 'tree-conifer') {
    const trunk = Math.min(250, Math.max(100, Math.min(w, d) * 0.06))
    return [
      { w: trunk, d: trunk, y0: 0, y1: h * 0.2, shape: 'cylinder', look: 'wood' },
      { w, d, y0: h * 0.12, y1: h, shape: 'cone', look: 'plant' },
    ]
  }
  if (symbol === 'shrub') return [{ w, d, y0: 0, y1: h, shape: 'sphere', look: 'plant' }]
  if (symbol === 'parasol') {
    // Un mât et une toile en cône très plat.
    return [
      { w: 60, d: 60, y0: 0, y1: h - 200, shape: 'cylinder', look: 'metal' },
      { w, d, y0: h - 450, y1: h, shape: 'cone', look: 'canvas' },
    ]
  }
  if (/^(pergola|gazebo|carport)$/.test(symbol)) {
    // Quatre poteaux et un toit mince : on voit dessous au lieu d'un bloc plein.
    const post = 120
    const roofHeight = 120
    return [
      ...corners(w / 2 - post, d / 2 - post).map(([u, v]) => ({
        u,
        v,
        w: post,
        d: post,
        y0: 0,
        y1: h - roofHeight,
        look: 'wood' as const,
      })),
      { w, d, y0: h - roofHeight, y1: h, look: symbol === 'gazebo' ? 'canvas' : 'wood' },
    ]
  }
  if (/^(car|car-compact|car-sedan|car-suv)$/.test(symbol)) {
    const look = lookOf(symbol)
    const wheelWidth = 220
    return [
      { w, d, y0: 180, y1: h * 0.55, look },
      { w: w * 0.88, d: d * 0.52, y0: h * 0.55, y1: h, look: 'carGlass' },
      ...corners(w / 2 - wheelWidth / 2, d * 0.28).map(([u, v]) => ({
        u,
        v,
        w: wheelWidth,
        d: 650,
        y0: 0,
        y1: 640,
        look: 'tire' as const,
      })),
    ]
  }
  return null
}

/** Pose un volume : même repère que `buildFurniture` (coin haut-gauche et rotation horaire du plan). */
function place(element: FurnitureElement, level: Level, part: Part): FurniturePiece | null {
  if (part.y1 - part.y0 < 1 || part.w < 1 || part.d < 1) return null
  const angle = toRadians(element.rotation)
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const lx = element.width / 2 + (part.u ?? 0)
  const lz = element.depth / 2 + (part.v ?? 0)
  return {
    sourceId: element.id,
    levelId: level.id,
    center: {
      x: element.x + lx * cos - lz * sin,
      y: level.elevation + (part.y0 + part.y1) / 2,
      z: element.y + lx * sin + lz * cos,
    },
    size: { x: part.w, y: part.y1 - part.y0, z: part.d },
    rotationY: -angle,
    look: part.look,
    shape: part.shape ?? 'box',
  }
}

/**
 * Volumes 3D d'un objet : plusieurs pour un parasol, une voiture, un arbre ou une piscine, un seul
 * (boîte ou cylindre, de la hauteur du catalogue) pour les autres. Aucun pour un objet inconnu, une
 * zone de référence, un symbole conventionnel ou un objet à plat.
 */
export function buildFurnitureParts(element: FurnitureElement, level: Level): FurniturePiece[] {
  const def = getSymbol(element.symbol)
  if (!def || def.zone || def.nominal || FLAT_CATEGORIES.has(def.category)) return []
  const parts = recipe(element.symbol, element.width, element.depth, def.height)
  if (parts) return parts.flatMap((part) => place(element, level, part) ?? [])
  const box = buildFurniture(element, level)
  return box ? [{ ...box, look: lookOf(element.symbol), shape: shapeOf(element.symbol) }] : []
}
