import type { RoomElement, WallElement } from '../../types/document'
import { createRoomElement, createWallElement } from './elements'

export interface Corner {
  x: number
  y: number
}

/** Les quatre coins du rectangle dont `a` et `b` sont deux coins opposés (sens horaire depuis le haut-gauche). */
export function rectangleCorners(a: Corner, b: Corner): Corner[] {
  const left = Math.min(a.x, b.x)
  const right = Math.max(a.x, b.x)
  const top = Math.min(a.y, b.y)
  const bottom = Math.max(a.y, b.y)
  return [
    { x: left, y: top },
    { x: right, y: top },
    { x: right, y: bottom },
    { x: left, y: bottom },
  ]
}

/** Vrai si les deux coins donnent un rectangle de surface non nulle. */
export function isRectangle(a: Corner, b: Corner): boolean {
  return Math.abs(a.x - b.x) > 1e-6 && Math.abs(a.y - b.y) > 1e-6
}

function flatten(corners: Corner[]): number[] {
  return corners.flatMap((corner) => [corner.x, corner.y])
}

/** Points d'un mur droit (deux points). */
export function straightWallPoints(a: Corner, b: Corner): number[] {
  return [a.x, a.y, b.x, b.y]
}

/**
 * Axe d'un mur fermé dont le rectangle `a`–`b` est la face intérieure : le rectangle est agrandi
 * d'une demi-épaisseur de chaque côté, et le contour est refermé (dernier point = premier).
 */
export function closedWallAxisAround(a: Corner, b: Corner, thickness: number): number[] {
  const half = thickness / 2
  const [topLeft, topRight, bottomRight, bottomLeft] = rectangleCorners(a, b)
  const outer: Corner[] = [
    { x: topLeft.x - half, y: topLeft.y - half },
    { x: topRight.x + half, y: topRight.y - half },
    { x: bottomRight.x + half, y: bottomRight.y + half },
    { x: bottomLeft.x - half, y: bottomLeft.y + half },
  ]
  return [...flatten(outer), outer[0].x, outer[0].y]
}

/** Pièce rectangulaire dessinée entre deux coins opposés. */
export function createRectangleRoom(name: string, a: Corner, b: Corner): RoomElement {
  return createRoomElement(name, flatten(rectangleCorners(a, b)))
}

/**
 * Pièce + un seul mur fermé placé à l'extérieur du rectangle tracé (les faces intérieures du mur
 * suivent le tracé : la surface de la pièce reste celle du rectangle).
 */
export function createRoomWithWalls(
  roomName: string,
  wallName: string,
  a: Corner,
  b: Corner,
  thickness: number,
  wallHeight: number,
): [WallElement, RoomElement] {
  return [
    createWallElement(wallName, closedWallAxisAround(a, b, thickness), thickness, wallHeight),
    createRectangleRoom(roomName, a, b),
  ]
}
