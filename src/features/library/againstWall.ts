import type { CanvasElement } from '../../types/document'
import { toPoints } from '../geometry/polygon'
import type { Point } from '../geometry/viewport'

// Pose contre un mur (M11 bis, lot F) : un objet « mural » (WC, lavabo, radiateur, meuble de cuisine,
// armoire…) se colle à la face du mur le plus proche, le dos contre le mur, la face avant vers la
// pièce. Convention du catalogue (docs/06-BIBLIOTHEQUE.md) : à rotation 0, le dos est en haut du
// dessin et la face avant vers le bas. Fonctions pures.

/**
 * Objets qui se posent contre un mur : sanitaires, chauffage, cuisine équipée, électroménager encastré,
 * rangements et meubles bas ou hauts, objets fixés en hauteur. Les tables, lits, canapés et autres
 * meubles libres gardent leur orientation.
 */
const WALL_BACKED =
  /^(wc|urinal|bidet|washbasin|vanity-unit|bathtub|whirlpool|towel-radiator|mirror-wall|bathroom-cabinet|bathroom-shelf|baby-changing-wall|radiator|convector|manifold|ac-split|vent-grille|kitchen-(base|wall|corner|tall|linear|parallel|l|u|american)|worktop|sink-|hob-|cooker|oven-built-in|hood$|fridge|freezer|dishwasher|wine-cooler|pantry-cabinet|washing-machine|dryer|washer-dryer|utility-sink|water-heater|boiler|buffer-tank|electrical-panel|meter-cupboard|cabinet-|shelving|shelf-wall|coat-rack-wall|garage-rack|tool-cabinet|workbench|wardrobe-|dresser|bookcase|sideboard|console|tv-unit|tv-wall|display-cabinet|buffet-dining|filing-cabinet|shelf-unit|lockers|whiteboard|blackboard|library-shelf|medical-cabinet|fireplace|wood-stove|bar-back|mailbox-indoor|grab-bar|shower-seat|gas-meter)/

/** Vrai si l'objet de la bibliothèque `symbolId` se pose contre un mur. */
export function isWallBacked(symbolId: string): boolean {
  return WALL_BACKED.test(symbolId)
}

/** Un côté de l'axe d'un mur, avec son épaisseur. */
export interface WallSide {
  a: Point
  b: Point
  thickness: number
}

/** Côtés (segments d'axe) des murs visibles, pour `placeAgainstWall`. */
export function collectWallSides(elements: readonly CanvasElement[]): WallSide[] {
  const sides: WallSide[] = []
  for (const element of elements) {
    if (element.type !== 'wall' || element.hidden) continue
    const points = toPoints(element.points)
    for (let i = 0; i + 1 < points.length; i++) {
      if (Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y) > 1e-6) {
        sides.push({ a: points[i], b: points[i + 1], thickness: element.thickness })
      }
    }
  }
  return sides
}

export interface AgainstWallResult {
  /** Coin haut-gauche de l'objet avant rotation (mm entiers), comme `FurnitureElement.x / y`. */
  x: number
  y: number
  /** Rotation en degrés (0 à 359) : dos au mur, face avant vers la pièce. */
  rotation: number
}

/**
 * Pose d'un objet de `width × depth` mm dont le centre est visé en `center` : si une face de mur est
 * à moins de `reach` mm de son bord arrière, l'objet se colle à cette face (son dos touche le mur),
 * se tourne face à la pièce et glisse le long du mur sous le curseur, sans dépasser du mur. `null`
 * s'il n'y a pas de mur assez proche. Le côté du mur choisi est celui où se trouve le centre visé.
 */
export function placeAgainstWall(
  size: { width: number; depth: number },
  center: Point,
  walls: readonly WallSide[],
  reach: number,
): AgainstWallResult | null {
  let best: { distance: number; point: Point; normal: Point } | null = null
  for (const wall of walls) {
    const dx = wall.b.x - wall.a.x
    const dy = wall.b.y - wall.a.y
    const length = Math.hypot(dx, dy)
    const along = { x: dx / length, y: dy / length }
    const left = { x: -along.y, y: along.x }
    const t = (center.x - wall.a.x) * along.x + (center.y - wall.a.y) * along.y
    const offset = (center.x - wall.a.x) * left.x + (center.y - wall.a.y) * left.y
    const side = offset >= 0 ? 1 : -1
    const normal = { x: left.x * side, y: left.y * side }
    // Distance du bord arrière (centre reculé de la demi-profondeur) à la face du mur.
    const distance = Math.abs(Math.abs(offset) - wall.thickness / 2 - size.depth / 2)
    // Le centre doit être au droit du mur (à la demi-largeur près, pour ne pas dépasser en bout).
    if (t < -size.width / 2 || t > length + size.width / 2) continue
    if (distance > reach) continue
    if (!best || distance < best.distance) {
      const clampedT =
        length >= size.width ? Math.min(Math.max(t, size.width / 2), length - size.width / 2) : length / 2
      best = {
        distance,
        normal,
        point: {
          x: wall.a.x + along.x * clampedT + normal.x * (wall.thickness / 2 + size.depth / 2),
          y: wall.a.y + along.y * clampedT + normal.y * (wall.thickness / 2 + size.depth / 2),
        },
      }
    }
  }
  if (!best) return null

  // Face avant (local +y) = normale du mur, vers la pièce : (−sin θ, cos θ) = normal.
  const degrees = (Math.atan2(-best.normal.x, best.normal.y) * 180) / Math.PI
  const rotation = Math.round(((degrees % 360) + 360) % 360) % 360
  const rad = (rotation * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const u = size.width / 2
  const v = size.depth / 2
  return {
    x: Math.round(best.point.x - (u * cos - v * sin)),
    y: Math.round(best.point.y - (u * sin + v * cos)),
    rotation,
  }
}
