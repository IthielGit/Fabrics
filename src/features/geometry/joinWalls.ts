import type { CanvasElement, OpeningElement, WallElement } from '../../types/document'
import { isAutoName } from '../naming/autoNames'
import { wallSegment } from './openings'
import { toPoints } from './polygon'

/**
 * Pourquoi des murs ne peuvent pas être joints :
 * - `few` : moins de deux murs ; `locked` : un mur est verrouillé ;
 * - `level` : niveaux différents ; `thickness`, `height`, `material` : réglages différents ;
 * - `notChained` : les murs ne se suivent pas bout à bout (écart, croisement ou plusieurs chaînes).
 */
export type JoinWallsProblem =
  | 'few'
  | 'locked'
  | 'level'
  | 'thickness'
  | 'height'
  | 'material'
  | 'notChained'

export type JoinWallsResult =
  | {
      ok: true
      /** Le mur obtenu : il garde l'identifiant du premier des murs joints (ordre du document). */
      wall: WallElement
      /** Ouvertures des murs joints, rattachées au nouveau mur. */
      openings: OpeningElement[]
      /** Ouvertures sans place sur leur segment (longueur nulle) : retirées. */
      removedOpeningIds: string[]
      /** Identifiants des murs absorbés (tous sauf `wall.id`). */
      absorbedIds: string[]
    }
  | { ok: false; problem: JoinWallsProblem }

/** Deux extrémités à moins de ce écart (mm) se touchent. */
const TOUCH = 1

const keyOf = (x: number, y: number): string => `${Math.round(x / TOUCH)},${Math.round(y / TOUCH)}`

interface Placed {
  wall: WallElement
  reversed: boolean
}

/**
 * Joint des murs bout à bout en un seul (l'inverse de « Séparer les côtés »). Les murs doivent être
 * sur le même niveau, avoir la même épaisseur, la même hauteur et le même matériau, et former une
 * chaîne simple (ni embranchement, ni écart) ouverte ou fermée. Un mur pris à l'envers voit ses
 * ouvertures retournées (place depuis l'autre bout, charnière et côté d'ouverture inversés).
 * Fonction pure : le mur obtenu et ses ouvertures sont renvoyés, rien n'est modifié.
 */
export function joinWalls(
  walls: readonly WallElement[],
  openings: readonly OpeningElement[],
): JoinWallsResult {
  if (walls.length < 2) return { ok: false, problem: 'few' }
  const first = walls[0]
  if (walls.some((wall) => wall.locked)) return { ok: false, problem: 'locked' }
  if (walls.some((wall) => wall.levelId !== first.levelId)) return { ok: false, problem: 'level' }
  if (walls.some((wall) => wall.thickness !== first.thickness)) return { ok: false, problem: 'thickness' }
  if (walls.some((wall) => wall.height !== first.height)) return { ok: false, problem: 'height' }
  if (walls.some((wall) => wall.material !== first.material)) return { ok: false, problem: 'material' }

  // Extrémités de chaque mur : un nœud touché par plus de deux murs est un embranchement.
  const ends = new Map<string, { wallIndex: number; end: 'start' | 'end' }[]>()
  const endsOf = walls.map((wall) => {
    const points = toPoints(wall.points)
    return { start: points[0], end: points[points.length - 1], count: points.length }
  })
  for (let i = 0; i < walls.length; i++) {
    if (endsOf[i].count < 2) return { ok: false, problem: 'notChained' }
    for (const end of ['start', 'end'] as const) {
      const key = keyOf(endsOf[i][end].x, endsOf[i][end].y)
      ends.set(key, [...(ends.get(key) ?? []), { wallIndex: i, end }])
    }
  }
  let freeKeys = 0
  for (const list of ends.values()) {
    if (list.length > 2) return { ok: false, problem: 'notChained' }
    if (list.length === 1) freeKeys++
  }
  // Une chaîne ouverte a deux extrémités libres ; une chaîne fermée, aucune.
  if (freeKeys !== 0 && freeKeys !== 2) return { ok: false, problem: 'notChained' }

  // Départ : un mur à l'extrémité libre (chaîne ouverte), ou le premier mur (chaîne fermée).
  let startIndex = 0
  let startReversed = false
  if (freeKeys === 2) {
    outer: for (let i = 0; i < walls.length; i++) {
      for (const end of ['start', 'end'] as const) {
        const list = ends.get(keyOf(endsOf[i][end].x, endsOf[i][end].y))!
        if (list.length === 1) {
          startIndex = i
          startReversed = end === 'end'
          break outer
        }
      }
    }
  }

  const order: Placed[] = []
  const used = new Set<number>()
  let index = startIndex
  let reversed = startReversed
  for (;;) {
    used.add(index)
    order.push({ wall: walls[index], reversed })
    const tail = reversed ? endsOf[index].start : endsOf[index].end
    const next = (ends.get(keyOf(tail.x, tail.y)) ?? []).find((entry) => !used.has(entry.wallIndex))
    if (!next) break
    index = next.wallIndex
    reversed = next.end === 'end'
  }
  if (order.length !== walls.length) return { ok: false, problem: 'notChained' }

  // Tracé unique : le point de jonction n'est écrit qu'une fois.
  const points: number[] = []
  const baseOf = new Map<string, { base: number; reversed: boolean; segments: number }>()
  let segmentBase = 0
  for (const { wall, reversed: flip } of order) {
    const own = toPoints(wall.points)
    const ordered = flip ? [...own].reverse() : own
    for (let i = points.length === 0 ? 0 : 1; i < ordered.length; i++) {
      points.push(ordered[i].x, ordered[i].y)
    }
    baseOf.set(wall.id, { base: segmentBase, reversed: flip, segments: own.length - 1 })
    segmentBase += own.length - 1
  }

  // Le mur obtenu garde l'identifiant du premier mur dans l'ordre reçu.
  const typedName = walls.find((wall) => !isAutoName(wall.name))?.name
  const merged: WallElement = { ...first, name: typedName ?? '', points }

  const movedOpenings: OpeningElement[] = []
  const removedOpeningIds: string[] = []
  for (const opening of openings) {
    const place = baseOf.get(opening.wallId)
    if (!place) continue
    const owner = walls.find((wall) => wall.id === opening.wallId)!
    const segment = wallSegment(owner, opening.segmentIndex)
    if (!segment) {
      removedOpeningIds.push(opening.id)
      continue
    }
    movedOpenings.push({
      ...opening,
      wallId: merged.id,
      segmentIndex: place.base + (place.reversed ? place.segments - 1 - opening.segmentIndex : opening.segmentIndex),
      offset: place.reversed ? segment.length - opening.offset : opening.offset,
      hinge: place.reversed ? (opening.hinge === 'start' ? 'end' : 'start') : opening.hinge,
      side: place.reversed ? (opening.side === 'left' ? 'right' : 'left') : opening.side,
    })
  }

  return {
    ok: true,
    wall: merged,
    openings: movedOpenings,
    removedOpeningIds,
    absorbedIds: walls.filter((wall) => wall.id !== first.id).map((wall) => wall.id),
  }
}

/**
 * Joint les murs `wallIds` dans la liste d'éléments : le mur obtenu prend la place du premier mur
 * dans l'ordre d'empilement, les autres disparaissent. Renvoie le problème rencontré sinon.
 */
export function joinWallsInDocument(
  elements: readonly CanvasElement[],
  wallIds: readonly string[],
):
  | { ok: true; elements: CanvasElement[]; wallId: string; removedOpenings: number }
  | { ok: false; problem: JoinWallsProblem } {
  const wanted = new Set(wallIds)
  // Dans l'ordre du document : le premier mur garde son identifiant.
  const walls = elements.filter((el): el is WallElement => el.type === 'wall' && wanted.has(el.id))
  const owned = new Set(walls.map((wall) => wall.id))
  const openings = elements.filter((el): el is OpeningElement => el.type === 'opening' && owned.has(el.wallId))
  const result = joinWalls(walls, openings)
  if (!result.ok) return result

  const absorbed = new Set(result.absorbedIds)
  const removed = new Set(result.removedOpeningIds)
  const openingById = new Map(result.openings.map((opening) => [opening.id, opening]))
  const next = elements.flatMap<CanvasElement>((el) => {
    if (el.id === result.wall.id) return [result.wall]
    if (absorbed.has(el.id) || removed.has(el.id)) return []
    return [openingById.get(el.id) ?? el]
  })
  return { ok: true, elements: next, wallId: result.wall.id, removedOpenings: result.removedOpeningIds.length }
}
