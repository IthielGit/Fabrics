/**
 * Quantités de métré (M21) : la famille `takeoff`, tirée des quantités géométriques selon la
 * convention retenue (`docs/phases/M21-decisions.md`) et ses règles versionnées (`rules.ts`).
 *
 * - D21-2 : une ouverture n'est déduite que si sa surface dépasse le seuil de la catégorie
 *   (maçonnerie, enduits, peinture) ; 0 m² par défaut, donc toutes les ouvertures sont déduites et
 *   le métré redonne la géométrie. Les ouvertures qui se chevauchent sont déduites par leur union.
 * - D21-3 : tableaux des ouvertures en quantité séparée (pourtour × épaisseur du mur ; pas de
 *   tableau bas quand l'ouverture part du sol).
 * - D21-4 : longueur des murs à l'axe, faces sur les faces, raccords comptés une fois (inchangé).
 * - Revêtements des pièces : sol et plafond = surface nette (trémies déduites) ; plinthes = périmètre
 *   moins la largeur des ouvertures qui partent du sol sur le contour de la pièce.
 * Fonctions pures.
 */
import type { CanvasElement, OpeningElement, RoomElement, WallElement } from '../../../types/document'
import { openingCentre } from '../references'
import { deductedOpeningsArea, measureOpenings, type BuildingMeasurements, type PlacedOpening } from '../measurements'
import { DEFAULT_TAKEOFF_SETTINGS, ruleOf, type TakeoffSettings, type ThresholdCategory } from './rules'
import { QUANTITY_DIMENSIONS, categoryOf, quantityKey, type QuantityCode, type QuantityResult } from './types'

export interface TakeoffContext {
  building: BuildingMeasurements
  /** Éléments du plan (murs, ouvertures, pièces) : rectangles des ouvertures et contours des pièces. */
  elements: readonly CanvasElement[]
  settings?: TakeoffSettings
}

function takeoffResult(
  code: QuantityCode,
  value: number,
  from: Pick<QuantityResult, 'elementIds' | 'partId' | 'levelId'>,
  settings: TakeoffSettings,
): QuantityResult {
  return {
    key: quantityKey('takeoff', code, from.elementIds[0], from.partId),
    family: 'takeoff',
    category: categoryOf(code),
    code,
    dimension: QUANTITY_DIMENSIONS[code],
    value,
    elementIds: [...from.elementIds],
    partId: from.partId,
    levelId: from.levelId,
    rule: ruleOf('takeoff', code, settings),
  }
}

/** Distance d'un point à un segment (mm). */
function distanceToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax
  const dy = by - ay
  const length2 = dx * dx + dy * dy
  const t = length2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / length2))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

/** Distance d'un point au contour fermé d'une pièce (mm). */
function distanceToOutline(x: number, y: number, points: readonly number[]): number {
  let best = Infinity
  const n = points.length / 2
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    best = Math.min(best, distanceToSegment(x, y, points[2 * i], points[2 * i + 1], points[2 * j], points[2 * j + 1]))
  }
  return best
}

/**
 * Ouvertures qui partent du sol (allège 0) posées sur le contour d'une pièce : leur centre, sur l'axe
 * du mur, est à moins d'une demi-épaisseur de mur (+ 1 mm) du contour. La pièce peut être tracée à
 * l'axe des murs ou sur leurs faces.
 */
export function floorOpeningsOfRoom(
  room: Pick<RoomElement, 'points'>,
  openings: readonly OpeningElement[],
  wallById: ReadonlyMap<string, WallElement>,
): OpeningElement[] {
  return openings.filter((opening) => {
    const wall = wallById.get(opening.wallId)
    if (!wall || opening.sillHeight !== 0) return false
    const c = openingCentre(opening, wall)
    return distanceToOutline(c.x, c.y, room.points) <= wall.thickness / 2 + 1
  })
}

/** Pourtour des tableaux d'une ouverture (mm) : deux côtés et le haut, plus le bas si elle a une allège. */
export function revealPerimeter(width: number, height: number, sillHeight: number): number {
  return 2 * height + width + (sillHeight > 0 ? width : 0)
}

/** Quantités de métré d'un bâtiment, à partir de ses quantités géométriques. */
export function takeoffQuantities(geometric: readonly QuantityResult[], context: TakeoffContext): QuantityResult[] {
  const settings = context.settings ?? DEFAULT_TAKEOFF_SETTINGS
  const walls = context.elements.filter((el): el is WallElement => el.type === 'wall')
  const wallById = new Map(walls.map((wall) => [wall.id, wall]))
  const openingElements = context.elements.filter((el): el is OpeningElement => el.type === 'opening')
  const openingById = new Map(openingElements.map((o) => [o.id, o]))
  const roomById = new Map(context.elements.filter((el): el is RoomElement => el.type === 'room').map((room) => [room.id, room]))
  const { rectangles } = measureOpenings(context.elements, wallById)
  const placedById = new Map(rectangles.map((p) => [p.openingId, p]))

  // Surface déduite de chaque mur, par catégorie de seuil (union des ouvertures au-dessus du seuil).
  const deducted = new Map<ThresholdCategory, Map<string, number>>()
  const deductedOf = (category: ThresholdCategory, wallId: string): number => {
    let byWall = deducted.get(category)
    if (!byWall) {
      const threshold = settings.thresholds[category]
      byWall = deductedOpeningsArea(rectangles.filter((p: PlacedOpening) => p.area > threshold))
      deducted.set(category, byWall)
    }
    return byWall.get(wallId) ?? 0
  }

  const wallMeasures = new Map(context.building.levels.flatMap((entry) => entry.measurements.walls.map((w) => [w.id, w] as const)))
  const geometricByKey = new Map(geometric.map((g) => [g.key, g.value]))
  const geometricValue = (code: QuantityCode, id: string) => geometricByKey.get(quantityKey('geometric', code, id, null)) ?? 0
  const out: QuantityResult[] = []
  const valueOf = (q: QuantityResult): number => {
    const wall = q.category === 'wall' ? wallMeasures.get(q.elementIds[0]) : undefined
    if (!wall) return q.value
    switch (q.code) {
      case 'wall.openingsArea':
        return deductedOf('masonry', wall.id)
      case 'wall.netArea':
        return Math.max(0, wall.wallArea - deductedOf('masonry', wall.id))
      case 'wall.netVolume': {
        const gross = wall.volume + wall.openingsArea * wall.thickness
        return Math.max(0, gross - deductedOf('masonry', wall.id) * wall.thickness)
      }
      default:
        return q.value
    }
  }

  for (const q of geometric) {
    if (q.family !== 'geometric') continue
    out.push(takeoffResult(q.code, valueOf(q), q, settings))
    const [id] = q.elementIds
    if (q.code === 'wall.facesNetArea') {
      const wall = wallMeasures.get(id)
      if (wall) {
        out.push(takeoffResult('wall.plasterArea', Math.max(0, wall.facesArea - 2 * deductedOf('plaster', id)), q, settings))
        out.push(takeoffResult('wall.paintArea', Math.max(0, wall.facesArea - 2 * deductedOf('paint', id)), q, settings))
      }
    } else if (q.code === 'opening.area') {
      const placed = placedById.get(id)
      const opening = openingById.get(id)
      const wall = opening ? wallById.get(opening.wallId) : undefined
      // Une ouverture non déduite (hors du mur) n'a pas de tableau.
      const reveal = placed && opening && wall
        ? revealPerimeter(opening.width, placed.area / opening.width, opening.sillHeight) * wall.thickness
        : 0
      out.push(takeoffResult('opening.revealArea', reveal, q, settings))
    } else if (q.code === 'room.habitableArea') {
      const room = roomById.get(id)
      const net = geometricValue('room.netArea', id)
      const perimeter = geometricValue('room.perimeter', id)
      const doors = room ? floorOpeningsOfRoom(room, openingElements, wallById) : []
      out.push(takeoffResult('room.floorCoveringArea', net, q, settings))
      out.push(takeoffResult('room.ceilingArea', net, q, settings))
      out.push(takeoffResult('room.skirtingLength', Math.max(0, perimeter - doors.reduce((sum, d) => sum + d.width, 0)), q, settings))
    }
  }
  return out
}
