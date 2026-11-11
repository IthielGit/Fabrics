import type { CanvasElement, OpeningElement, WallElement } from '../../types/document'
import { elementBounds } from '../export/bounds'
import type { Box } from './box'
import { unionBoxes } from './box'
import { clampOpeningOffset, openingInterval, wallSegment, type Interval } from './openings'
import { toPoints } from './polygon'
import { translateElement } from './transform'
import type { Point } from './viewport'

// Redimensionnement « en bloc » d'une sélection (une pièce préfabriquée, ou toute pièce avec ses
// murs) : les murs, les pièces (le sol) et les cotes s'étirent ; les ouvertures et les meubles
// gardent leur taille réelle. Un meuble contre un mur reste contre ce mur ; sinon il garde sa
// place en proportion.

/** Distance sous laquelle un meuble est considéré comme collé à un mur, en mm. */
export const WALL_CONTACT_TOLERANCE = 250
/** Dimension minimale d'un bloc, en mm. */
export const MIN_BLOCK_SIZE = 500

/** Éléments qui s'étirent avec le bloc (leurs points sont déformés). */
function stretches(element: CanvasElement): boolean {
  return (
    element.type === 'wall' ||
    element.type === 'room' ||
    element.type === 'dimension' ||
    element.type === 'roof'
  )
}

/** Éléments qui gardent leur taille et se déplacent avec le bloc. */
function moves(element: CanvasElement): boolean {
  return (
    element.type === 'furniture' ||
    element.type === 'stair' ||
    element.type === 'chimney' ||
    element.type === 'platform'
  )
}

/**
 * Rectangle de référence du bloc, celui dont on donne la largeur et la profondeur : l'emprise des
 * pièces de la sélection (la face intérieure des murs) ; sans pièce, l'emprise de l'axe des murs.
 * `null` s'il n'y a ni pièce ni mur.
 */
export function blockReference(selection: readonly CanvasElement[]): Box | null {
  const rooms = selection.filter((el) => el.type === 'room' && !el.locked)
  const source = rooms.length > 0 ? rooms : selection.filter((el) => el.type === 'wall' && !el.locked)
  const boxes = source.flatMap((el) => {
    if (el.type !== 'room' && el.type !== 'wall') return []
    const points = toPoints(el.points)
    if (points.length === 0) return []
    const xs = points.map((p) => p.x)
    const ys = points.map((p) => p.y)
    return [{ x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) }]
  })
  const box = unionBoxes(boxes)
  return box && box.width > 0 && box.height > 0 ? box : null
}

export interface BlockResize {
  /** Éléments modifiés, à remplacer par identifiant. */
  elements: CanvasElement[]
  /** Ouvertures qui ne tiennent plus sur leur mur raccourci : à supprimer. */
  removedIds: string[]
}

/** Correspondance d'une coordonnée : étirée à l'intérieur du rectangle, décalée au-delà (les murs gardent leur épaisseur). */
function stretch(value: number, from: number, to: number, newSize: number): number {
  const size = to - from
  if (value <= from) return Math.round(value)
  if (value >= to) return Math.round(value + (newSize - size))
  return Math.round(from + ((value - from) * newSize) / size)
}

/** Nouvelle position (début de l'intervalle) d'un meuble sur un axe, de `start` à `start + length`. */
function placeOnAxis(
  start: number,
  length: number,
  from: number,
  to: number,
  newSize: number,
): number {
  const size = to - from
  const before = start - from
  const after = to - (start + length)
  let next: number
  if (Math.min(before, after) <= WALL_CONTACT_TOLERANCE) {
    // Collé à un mur (le plus proche) : la distance au mur ne change pas.
    next = before <= after ? from + before : from + newSize - after - length
  } else {
    // Au milieu : le centre garde sa place en proportion.
    const center = start + length / 2
    next = from + ((center - from) * newSize) / size - length / 2
  }
  // Toujours dans la pièce, sans changer la taille du meuble (trop grand : contre le début).
  const lowest = from
  const highest = from + newSize - length
  return Math.round(highest < lowest ? lowest : Math.min(Math.max(next, lowest), highest))
}

/**
 * Redimensionne le bloc formé par `selection` à `width × depth` mm (mesurés sur `blockReference`).
 * - murs, pièces, cotes : étirés (les murs gardent leur épaisseur) ;
 * - ouvertures de ces murs : même taille, même place en proportion le long du mur ; celles qui
 *   ne tiennent plus sont retirées (`removedIds`) ;
 * - meubles, escaliers, cheminées, plateformes : même taille ; collés au mur s'ils l'étaient.
 * `all` sert à retrouver les ouvertures des murs sélectionnés. Éléments verrouillés ignorés.
 * Renvoie `null` si la sélection n'a ni pièce ni mur, ou si la taille demandée est invalide.
 */
export function resizeBlock(
  selection: readonly CanvasElement[],
  all: readonly CanvasElement[],
  size: { width: number; depth: number },
): BlockResize | null {
  const reference = blockReference(selection)
  if (!reference) return null
  const width = Math.round(size.width)
  const depth = Math.round(size.depth)
  if (!(width >= MIN_BLOCK_SIZE) || !(depth >= MIN_BLOCK_SIZE)) return null

  const x0 = reference.x
  const x1 = reference.x + reference.width
  const y0 = reference.y
  const y1 = reference.y + reference.height
  const mapX = (x: number) => stretch(x, x0, x1, width)
  const mapY = (y: number) => stretch(y, y0, y1, depth)
  const mapPoint = (p: Point): Point => ({ x: mapX(p.x), y: mapY(p.y) })

  const free = selection.filter((el) => !el.locked)
  const out: CanvasElement[] = []
  const newWalls = new Map<string, WallElement>()

  for (const el of free) {
    if (!stretches(el)) continue
    if (el.type === 'dimension') {
      const [ax, ay, bx, by] = el.points
      out.push({ ...el, points: [mapX(ax), mapY(ay), mapX(bx), mapY(by)] })
      continue
    }
    if (el.type !== 'wall' && el.type !== 'room' && el.type !== 'roof') continue
    const points: number[] = []
    for (let i = 0; i < el.points.length; i += 2) points.push(mapX(el.points[i]), mapY(el.points[i + 1]))
    const next = { ...el, points }
    out.push(next)
    if (next.type === 'wall') newWalls.set(next.id, next)
  }

  // Meubles et autres éléments posés : ils gardent leur taille et se déplacent.
  for (const el of free) {
    if (!moves(el)) continue
    const box = elementBounds(el)
    if (!box) continue
    const x = placeOnAxis(box.x, box.width, x0, x1, width)
    const y = placeOnAxis(box.y, box.height, y0, y1, depth)
    out.push(translateElement(el, x - box.x, y - box.y))
  }

  // Ouvertures des murs étirés : même taille, même place en proportion le long du mur.
  const removedIds: string[] = []
  const openings = all.filter(
    (el): el is OpeningElement => el.type === 'opening' && newWalls.has(el.wallId),
  )
  const groups = new Map<string, OpeningElement[]>()
  for (const opening of openings) {
    const key = `${opening.wallId}:${opening.segmentIndex}`
    groups.set(key, [...(groups.get(key) ?? []), opening])
  }
  const oldWalls = new Map(
    selection.filter((el): el is WallElement => el.type === 'wall').map((wall) => [wall.id, wall]),
  )
  for (const group of groups.values()) {
    const first = group[0]
    const oldWall = oldWalls.get(first.wallId)
    const newWall = newWalls.get(first.wallId)
    const oldSegment = oldWall ? wallSegment(oldWall, first.segmentIndex) : null
    const newSegment = newWall ? wallSegment(newWall, first.segmentIndex) : null
    if (!oldSegment || !newSegment) {
      removedIds.push(...group.map((o) => o.id))
      continue
    }
    const occupied: Interval[] = []
    // De proche en proche, dans l'ordre le long du mur : une ouverture ne chevauche pas la précédente.
    for (const opening of [...group].sort((a, b) => a.offset - b.offset)) {
      const center = {
        x: oldSegment.a.x + oldSegment.direction.x * opening.offset,
        y: oldSegment.a.y + oldSegment.direction.y * opening.offset,
      }
      const moved = mapPoint(center)
      const desired =
        (moved.x - newSegment.a.x) * newSegment.direction.x +
        (moved.y - newSegment.a.y) * newSegment.direction.y
      const offset = clampOpeningOffset(desired, opening.width, newSegment.length, occupied)
      if (offset === null) {
        removedIds.push(opening.id)
        continue
      }
      const rounded = Math.round(offset)
      occupied.push(openingInterval({ offset: rounded, width: opening.width }))
      out.push({ ...opening, offset: rounded })
    }
  }

  return { elements: out, removedIds }
}
