import type { CanvasElement, OpeningElement, WallElement } from '../../types/document'
import { elementBounds } from '../export/bounds'
import type { Box } from './box'
import { clampOpeningOffset, openingGeometry, openingInterval, wallSegment, type Interval } from './openings'
import { translateElement } from './transform'
import type { Point } from './viewport'

// Étirer par zone (comme « stretch » en CAO) : on entoure une partie du plan d'un rectangle et on
// la déplace. Les sommets de murs, de pièces et de cotes qui sont dans le rectangle bougent, les
// autres restent : les murs qui traversent le bord du rectangle s'allongent ou se raccourcissent.
// Les ouvertures gardent leur taille et leur place réelle ; les objets posés (meubles, escaliers,
// cheminées, plateformes) bougent si leur centre est dans la zone.

const EPSILON = 1e-6

export interface StretchResult {
  /** Éléments modifiés, à remplacer par identifiant. */
  elements: CanvasElement[]
  /** Ouvertures qui ne tiennent plus sur leur mur raccourci : à supprimer. */
  removedIds: string[]
}

/** Vrai si le point est dans la zone (bords compris). */
export function pointInZone(point: Point, zone: Box): boolean {
  return (
    point.x >= zone.x - EPSILON &&
    point.x <= zone.x + zone.width + EPSILON &&
    point.y >= zone.y - EPSILON &&
    point.y <= zone.y + zone.height + EPSILON
  )
}

/** Éléments dont les points sont déformés par l'étirement. */
function hasStretchablePoints(element: CanvasElement): boolean {
  return element.type === 'wall' || element.type === 'room' || element.type === 'dimension'
}

/** Éléments posés : ils gardent leur taille et se déplacent entiers. */
function isPlaced(element: CanvasElement): boolean {
  return (
    element.type === 'furniture' ||
    element.type === 'stair' ||
    element.type === 'chimney' ||
    element.type === 'platform'
  )
}

/** Côtés (paires de sommets consécutifs) d'un mur (ouvert) ou d'une pièce (fermée). */
function edges(element: CanvasElement): [Point, Point][] {
  if (element.type !== 'wall' && element.type !== 'room') return []
  const points: Point[] = []
  for (let i = 0; i + 1 < element.points.length; i += 2) {
    points.push({ x: element.points[i], y: element.points[i + 1] })
  }
  const pairs: [Point, Point][] = []
  for (let i = 0; i + 1 < points.length; i++) pairs.push([points[i], points[i + 1]])
  if (element.type === 'room' && points.length >= 3) pairs.push([points[points.length - 1], points[0]])
  return pairs
}

/**
 * Déplacement donné au clavier (en mm entiers, sans unité = mm) : la distance tapée s'applique
 * dans la direction dominante du déplacement à la souris (`wanted`), vers le côté où pointe la
 * souris ; un « - » devant inverse le sens. `null` si le texte n'est pas un nombre entier.
 */
export function typedStretchDelta(typed: string, wanted: Point): Point | null {
  if (!/^-?\d+$/.test(typed.trim())) return null
  const value = Number(typed.trim())
  const horizontal = Math.abs(wanted.x) >= Math.abs(wanted.y)
  const along = horizontal ? wanted.x : wanted.y
  const sign = typed.trim().startsWith('-') ? -1 : along < 0 ? -1 : 1
  const distance = Math.abs(value) * sign
  return horizontal ? { x: distance, y: 0 } : { x: 0, y: distance }
}

export interface StretchDelta {
  /** Déplacement autorisé, en mm (entiers). */
  delta: Point
  /** Vrai si un côté en biais traverse la zone : rien ne peut bouger (angles droits seulement). */
  blockedByDiagonal: boolean
}

/**
 * Ramène un déplacement souhaité à ce qui garde les angles droits : un mur horizontal qui traverse
 * le bord de la zone ne peut pas être déplacé verticalement (il deviendrait oblique), et
 * inversement. Un côté en biais qui traverse la zone bloque tout.
 */
export function constrainStretch(
  elements: readonly CanvasElement[],
  zone: Box,
  desired: Point,
): StretchDelta {
  let dx = Math.round(desired.x)
  let dy = Math.round(desired.y)
  let blockedByDiagonal = false
  for (const element of elements) {
    if (element.locked) continue
    for (const [a, b] of edges(element)) {
      if (pointInZone(a, zone) === pointInZone(b, zone)) continue
      if (Math.abs(a.y - b.y) < EPSILON) dy = 0
      else if (Math.abs(a.x - b.x) < EPSILON) dx = 0
      else blockedByDiagonal = true
    }
  }
  if (blockedByDiagonal) return { delta: { x: 0, y: 0 }, blockedByDiagonal }
  return { delta: { x: dx, y: dy }, blockedByDiagonal }
}

/** Même fonction avec les points d'un élément en tableau plat, déplacés si dans la zone. */
function movePoints(points: readonly number[], zone: Box, delta: Point): number[] {
  const next: number[] = []
  for (let i = 0; i + 1 < points.length; i += 2) {
    const inside = pointInZone({ x: points[i], y: points[i + 1] }, zone)
    next.push(points[i] + (inside ? delta.x : 0), points[i + 1] + (inside ? delta.y : 0))
  }
  return next
}

/**
 * Étire la zone `zone` de `delta` mm (voir `constrainStretch` pour garder les angles droits).
 * `elements` : ceux du niveau (murs, pièces, cotes, ouvertures, objets posés). Verrouillés ignorés.
 * Renvoie `null` si rien ne change.
 */
export function stretchZone(
  elements: readonly CanvasElement[],
  zone: Box,
  delta: Point,
): StretchResult | null {
  const dx = Math.round(delta.x)
  const dy = Math.round(delta.y)
  if (dx === 0 && dy === 0) return null

  const moved = { x: dx, y: dy }
  const free = elements.filter((el) => !el.locked)
  const out: CanvasElement[] = []
  const wallChanges = new Map<string, { before: WallElement; after: WallElement }>()

  for (const el of free) {
    if (!hasStretchablePoints(el)) continue
    if (el.type === 'wall' || el.type === 'room') {
      const points = movePoints(el.points, zone, moved)
      if (points.some((value, i) => value !== el.points[i])) {
        const next = { ...el, points }
        out.push(next)
        if (next.type === 'wall' && el.type === 'wall') wallChanges.set(el.id, { before: el, after: next })
      }
    } else if (el.type === 'dimension') {
      const points = movePoints(el.points, zone, moved) as typeof el.points
      if (points.some((value, i) => value !== el.points[i])) out.push({ ...el, points })
    }
  }

  // Objets posés : déplacés entiers quand leur centre est dans la zone.
  for (const el of free) {
    if (!isPlaced(el)) continue
    const box = elementBounds(el)
    if (!box) continue
    if (pointInZone({ x: box.x + box.width / 2, y: box.y + box.height / 2 }, zone)) {
      out.push(translateElement(el, dx, dy))
    }
  }

  // Ouvertures des murs modifiés : même taille, même place réelle (suit le mur si elle est dans la
  // zone), ramenée sur le mur s'il a changé de longueur ; retirée si elle n'y tient plus.
  const removedIds: string[] = []
  const groups = new Map<string, OpeningElement[]>()
  for (const el of free) {
    if (el.type !== 'opening' || !wallChanges.has(el.wallId)) continue
    const key = `${el.wallId}:${el.segmentIndex}`
    groups.set(key, [...(groups.get(key) ?? []), el])
  }
  for (const group of groups.values()) {
    const first = group[0]
    const change = wallChanges.get(first.wallId)!
    const newSegment = wallSegment(change.after, first.segmentIndex)
    if (!newSegment) {
      removedIds.push(...group.map((o) => o.id))
      continue
    }
    const occupied: Interval[] = []
    for (const opening of [...group].sort((a, b) => a.offset - b.offset)) {
      const old = openingGeometry(opening, change.before)
      if (!old) {
        removedIds.push(opening.id)
        continue
      }
      const target = pointInZone(old.center, zone)
        ? { x: old.center.x + dx, y: old.center.y + dy }
        : old.center
      const desired =
        (target.x - newSegment.a.x) * newSegment.direction.x +
        (target.y - newSegment.a.y) * newSegment.direction.y
      const offset = clampOpeningOffset(desired, opening.width, newSegment.length, occupied)
      if (offset === null) {
        removedIds.push(opening.id)
        continue
      }
      const rounded = Math.round(offset)
      occupied.push(openingInterval({ offset: rounded, width: opening.width }))
      if (rounded !== opening.offset) out.push({ ...opening, offset: rounded })
    }
  }

  return out.length > 0 || removedIds.length > 0 ? { elements: out, removedIds } : null
}
