import type { CanvasElement, OpeningElement, WallElement } from '../../types/document'
import { toPoints } from './polygon'

/** En dessous de cette longueur (mm), un côté est considéré comme nul (sommet en double). */
const MIN_SIDE_LENGTH = 1e-6

export interface SplitWallResult {
  /** Un mur par côté, dans l'ordre du tracé. Le premier garde l'identifiant du mur d'origine. */
  walls: WallElement[]
  /** Ouvertures du mur d'origine, rattachées au mur de leur côté (même place le long du côté). */
  openings: OpeningElement[]
  /** Ouvertures posées sur un côté de longueur nulle : elles n'avaient plus de place, on les retire. */
  removedOpeningIds: string[]
}

/** Un mur à plusieurs côtés peut être séparé : au moins deux côtés de longueur non nulle. */
export function canSplitWall(wall: Pick<WallElement, 'points'>): boolean {
  return sideIndexes(wall).length >= 2
}

/** Numéros des côtés (segments de l'axe) de longueur non nulle. */
function sideIndexes(wall: Pick<WallElement, 'points'>): number[] {
  const points = toPoints(wall.points)
  const sides: number[] = []
  for (let i = 0; i + 1 < points.length; i++) {
    if (Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y) >= MIN_SIDE_LENGTH) {
      sides.push(i)
    }
  }
  return sides
}

/**
 * Sépare un mur en un mur par côté. Chaque mur garde l'épaisseur, la hauteur, la couleur, le
 * matériau, le niveau, le verrouillage et la visibilité du mur d'origine ; seul le premier garde
 * son identifiant. Les ouvertures passent sur le mur de leur côté, à la même distance du début du
 * côté. Fonction pure : `null` si le mur n'a qu'un côté.
 */
export function splitWall(
  wall: WallElement,
  openings: readonly OpeningElement[],
  newId: () => string = () => crypto.randomUUID(),
): SplitWallResult | null {
  const sides = sideIndexes(wall)
  if (sides.length < 2) return null

  const points = toPoints(wall.points)
  const wallOfSide = new Map<number, WallElement>()
  const walls = sides.map((side, rank) => {
    const a = points[side]
    const b = points[side + 1]
    const part: WallElement = {
      ...wall,
      id: rank === 0 ? wall.id : newId(),
      name: `${wall.name} ${rank + 1}`,
      points: [a.x, a.y, b.x, b.y],
    }
    wallOfSide.set(side, part)
    return part
  })

  const moved: OpeningElement[] = []
  const removedOpeningIds: string[] = []
  for (const opening of openings) {
    if (opening.wallId !== wall.id) continue
    const target = wallOfSide.get(opening.segmentIndex)
    if (!target) {
      removedOpeningIds.push(opening.id)
      continue
    }
    moved.push({ ...opening, wallId: target.id, segmentIndex: 0 })
  }
  return { walls, openings: moved, removedOpeningIds }
}

/** Les éléments du document après séparation du mur `wallId`, ou `null` s'il n'y a rien à séparer. */
export function splitWallInDocument(
  elements: readonly CanvasElement[],
  wallId: string,
  newId?: () => string,
): { elements: CanvasElement[]; wallIds: string[]; removedOpenings: number } | null {
  const wall = elements.find((el): el is WallElement => el.id === wallId && el.type === 'wall')
  if (!wall) return null
  const openings = elements.filter((el): el is OpeningElement => el.type === 'opening')
  const result = splitWall(wall, openings, newId)
  if (!result) return null

  const openingById = new Map(result.openings.map((o) => [o.id, o]))
  const removed = new Set(result.removedOpeningIds)
  const next = elements.flatMap<CanvasElement>((el) => {
    if (el.id === wall.id) return result.walls // les côtés prennent la place du mur dans l'ordre d'empilement
    if (removed.has(el.id)) return []
    return [openingById.get(el.id) ?? el]
  })
  return {
    elements: next,
    wallIds: result.walls.map((w) => w.id),
    removedOpenings: result.removedOpeningIds.length,
  }
}
