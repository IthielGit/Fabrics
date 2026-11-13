import type { CanvasElement, OpeningElement, WallElement } from '../../types/document'
import { isAutoName } from '../naming/autoNames'
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
      // Nom automatique (D58) : chaque morceau prend le sien ; un nom tapé est gardé et numéroté.
      name: isAutoName(wall.name) ? '' : `${wall.name} ${rank + 1}`,
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

/** Pourquoi un mur ne peut pas être coupé à cet endroit. */
export type CutWallProblem = 'too-close' | 'on-opening'

/** Les points de coupe sont arrondis à ce pas (mm) pour obtenir des longueurs « rondes ». */
export const CUT_STEP = 10

/** Distance minimale (mm) entre la coupe et un sommet : au moins l'épaisseur du mur. */
function minCutDistance(wall: Pick<WallElement, 'thickness'>): number {
  return Math.max(wall.thickness, CUT_STEP)
}

/** Distance de coupe retenue (arrondie au pas) pour un clic à `offset` mm du début du côté. */
export function snapCutOffset(offset: number): number {
  return Math.round(offset / CUT_STEP) * CUT_STEP
}

export interface CutWallResult {
  /** Les deux morceaux : le premier garde l'identifiant du mur d'origine. */
  walls: [WallElement, WallElement]
  /** Ouvertures du mur d'origine qui passent sur le second morceau (les autres ne bougent pas). */
  openings: OpeningElement[]
}

/**
 * Pourquoi couper le côté `segmentIndex` à `offset` mm de son début est impossible, ou `null` si la
 * coupe est possible : trop près d'un sommet (un morceau plus court que l'épaisseur du mur), ou au
 * milieu d'une porte, fenêtre ou baie.
 */
export function cutWallProblem(
  wall: WallElement,
  openings: readonly OpeningElement[],
  segmentIndex: number,
  offset: number,
): CutWallProblem | null {
  const points = toPoints(wall.points)
  if (!Number.isInteger(segmentIndex) || segmentIndex < 0 || segmentIndex + 1 >= points.length) {
    return 'too-close'
  }
  const a = points[segmentIndex]
  const b = points[segmentIndex + 1]
  const length = Math.hypot(b.x - a.x, b.y - a.y)
  const margin = minCutDistance(wall)
  if (offset < margin || offset > length - margin) return 'too-close'
  const hit = openings.some(
    (o) =>
      o.wallId === wall.id &&
      o.segmentIndex === segmentIndex &&
      offset > o.offset - o.width / 2 &&
      offset < o.offset + o.width / 2,
  )
  return hit ? 'on-opening' : null
}

/**
 * Coupe un mur en deux au point situé à `offset` mm du début du côté `segmentIndex`. Chaque morceau
 * garde épaisseur, hauteur, couleur, matériau, niveau, verrouillage et visibilité ; seul le premier
 * garde l'identifiant. Les ouvertures passent sur le morceau qui les porte, à la même place dans le
 * document. Fonction pure : renvoie le problème qui empêche la coupe sinon.
 */
export function cutWall(
  wall: WallElement,
  openings: readonly OpeningElement[],
  segmentIndex: number,
  offset: number,
  newId: () => string = () => crypto.randomUUID(),
): { ok: true; result: CutWallResult } | { ok: false; problem: CutWallProblem } {
  const problem = cutWallProblem(wall, openings, segmentIndex, offset)
  if (problem) return { ok: false, problem }

  const points = toPoints(wall.points)
  const a = points[segmentIndex]
  const b = points[segmentIndex + 1]
  const length = Math.hypot(b.x - a.x, b.y - a.y)
  const cut = {
    x: a.x + ((b.x - a.x) / length) * offset,
    y: a.y + ((b.y - a.y) / length) * offset,
  }
  const flat = (list: { x: number; y: number }[]) => list.flatMap((p) => [p.x, p.y])

  const first: WallElement = {
    ...wall,
    // Nom automatique (D58) : chaque morceau prend le sien ; un nom tapé est gardé et numéroté.
    name: isAutoName(wall.name) ? '' : `${wall.name} 1`,
    points: flat([...points.slice(0, segmentIndex + 1), cut]),
  }
  const second: WallElement = {
    ...wall,
    id: newId(),
    name: isAutoName(wall.name) ? '' : `${wall.name} 2`,
    points: flat([cut, ...points.slice(segmentIndex + 1)]),
  }

  const moved: OpeningElement[] = []
  for (const opening of openings) {
    if (opening.wallId !== wall.id) continue
    const onSecond =
      opening.segmentIndex > segmentIndex ||
      (opening.segmentIndex === segmentIndex && opening.offset > offset)
    if (!onSecond) continue // reste sur le premier morceau, même côté et même distance
    moved.push({
      ...opening,
      wallId: second.id,
      segmentIndex: opening.segmentIndex - segmentIndex,
      // Sur le côté coupé, la distance se compte maintenant depuis le point de coupe.
      offset: opening.segmentIndex === segmentIndex ? opening.offset - offset : opening.offset,
    })
  }
  return { ok: true, result: { walls: [first, second], openings: moved } }
}

/** Les éléments du document après coupe du mur `wallId`, ou le problème qui l'empêche. */
export function cutWallInDocument(
  elements: readonly CanvasElement[],
  wallId: string,
  segmentIndex: number,
  offset: number,
  newId?: () => string,
): { ok: true; elements: CanvasElement[]; wallIds: [string, string] } | { ok: false; problem: CutWallProblem } {
  const wall = elements.find((el): el is WallElement => el.id === wallId && el.type === 'wall')
  if (!wall) return { ok: false, problem: 'too-close' }
  const openings = elements.filter((el): el is OpeningElement => el.type === 'opening')
  const cutResult = cutWall(wall, openings, segmentIndex, offset, newId)
  if (!cutResult.ok) return cutResult

  const { walls, openings: moved } = cutResult.result
  const movedById = new Map(moved.map((o) => [o.id, o]))
  const next = elements.flatMap<CanvasElement>((el) => {
    if (el.id === wall.id) return walls // les deux morceaux prennent la place du mur dans l'empilement
    return [movedById.get(el.id) ?? el]
  })
  return { ok: true, elements: next, wallIds: [walls[0].id, walls[1].id] }
}
