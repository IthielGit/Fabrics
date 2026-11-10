import type {
  CanvasElement,
  FabricsDocument,
  Level,
  OpeningElement,
  WallElement,
} from '../../types/document'
import { elementsOfLevel } from '../documents/levels'
import { polygonArea, polygonPerimeter, polylineLength } from '../geometry/polygon'

export interface RoomMeasure {
  id: string
  name: string
  /** Surface du contour tracé, en mm². */
  area: number
  /** Périmètre du contour tracé, en mm. */
  perimeter: number
}

export interface WallMeasure {
  id: string
  name: string
  /** Longueur de l'axe, en mm. */
  length: number
  thickness: number // mm
  height: number // mm
  /** Surface brute d'une face : longueur × hauteur, sans déduction d'ouvertures, en mm². */
  wallArea: number
  /** Surface des ouvertures posées sur ce mur, en mm². */
  openingsArea: number
  /** Surface nette : surface brute moins les ouvertures, en mm² (jamais négative). */
  netArea: number
}

export interface OpeningMeasure {
  id: string
  name: string
  kind: OpeningElement['kind']
  wallId: string
  wallName: string
  width: number // mm
  height: number // mm
  sillHeight: number // mm
  /** Surface dans le mur : largeur × hauteur, limitée à la hauteur du mur, en mm². */
  area: number
}

export interface Measurements {
  rooms: RoomMeasure[]
  walls: WallMeasure[]
  /** Ouvertures posées sur un mur existant, dans l'ordre du document. */
  openings: OpeningMeasure[]
  totals: {
    roomArea: number // mm²
    wallLength: number // mm
    /** Surface murale brute. */
    wallArea: number // mm²
    openingsArea: number // mm²
    /** Surface murale nette : brute moins les ouvertures. */
    wallNetArea: number // mm²
    doors: number
    windows: number
    bays: number
  }
}

/** Surface d'une ouverture dans son mur : sa hauteur est limitée à ce qui reste au-dessus de l'allège. */
function openingMeasure(opening: OpeningElement, wall: WallElement): OpeningMeasure {
  const visibleHeight = Math.max(0, Math.min(opening.height, wall.height - opening.sillHeight))
  return {
    id: opening.id,
    name: opening.name,
    kind: opening.kind,
    wallId: wall.id,
    wallName: wall.name,
    width: opening.width,
    height: opening.height,
    sillHeight: opening.sillHeight,
    area: opening.width * visibleHeight,
  }
}

/**
 * Métrés d'un plan (docs/02-ARCHITECTURE.md). Les quantités s'arrêtent aux surfaces et longueurs :
 * aucun prix. Tous les éléments sont comptés, même masqués : masquer ne change que l'affichage.
 * Résultats en mm et mm² ; la mise en forme (m, m²) est faite par `features/units`.
 */
export function computeMeasurements(elements: readonly CanvasElement[]): Measurements {
  const rooms: RoomMeasure[] = []
  const walls: WallMeasure[] = []
  const openings: OpeningMeasure[] = []

  // Les ouvertures d'abord : un mur a besoin de la surface des siennes.
  const wallById = new Map(
    elements.filter((el): el is WallElement => el.type === 'wall').map((wall) => [wall.id, wall]),
  )
  const openingsArea = new Map<string, number>()
  for (const element of elements) {
    if (element.type !== 'opening') continue
    const wall = wallById.get(element.wallId)
    if (!wall) continue // ouverture orpheline : rien à mesurer
    const measure = openingMeasure(element, wall)
    openings.push(measure)
    openingsArea.set(wall.id, (openingsArea.get(wall.id) ?? 0) + measure.area)
  }

  for (const element of elements) {
    if (element.type === 'room') {
      rooms.push({
        id: element.id,
        name: element.name,
        area: polygonArea(element.points),
        perimeter: polygonPerimeter(element.points),
      })
    } else if (element.type === 'wall') {
      const length = polylineLength(element.points)
      const wallArea = length * element.height
      const deducted = openingsArea.get(element.id) ?? 0
      walls.push({
        id: element.id,
        name: element.name,
        length,
        thickness: element.thickness,
        height: element.height,
        wallArea,
        openingsArea: deducted,
        netArea: Math.max(0, wallArea - deducted),
      })
    }
  }

  const count = (kind: OpeningElement['kind']) => openings.filter((o) => o.kind === kind).length

  return {
    rooms,
    walls,
    openings,
    totals: {
      roomArea: rooms.reduce((sum, room) => sum + room.area, 0),
      wallLength: walls.reduce((sum, wall) => sum + wall.length, 0),
      wallArea: walls.reduce((sum, wall) => sum + wall.wallArea, 0),
      openingsArea: walls.reduce((sum, wall) => sum + wall.openingsArea, 0),
      wallNetArea: walls.reduce((sum, wall) => sum + wall.netArea, 0),
      doors: count('door'),
      windows: count('window'),
      bays: count('bay'),
    },
  }
}

export interface LevelMeasurements {
  level: Level
  measurements: Measurements
}

export interface BuildingMeasurements {
  /** Métrés de chaque niveau, du plus bas au plus haut. */
  levels: LevelMeasurements[]
  /** Métrés du bâtiment : les listes et les totaux de tous les niveaux réunis. */
  total: Measurements
}

/** Réunit plusieurs métrés en un seul : listes mises bout à bout, totaux additionnés. */
export function sumMeasurements(list: readonly Measurements[]): Measurements {
  const sum = (pick: (m: Measurements) => number) => list.reduce((acc, m) => acc + pick(m), 0)
  return {
    rooms: list.flatMap((m) => m.rooms),
    walls: list.flatMap((m) => m.walls),
    openings: list.flatMap((m) => m.openings),
    totals: {
      roomArea: sum((m) => m.totals.roomArea),
      wallLength: sum((m) => m.totals.wallLength),
      wallArea: sum((m) => m.totals.wallArea),
      openingsArea: sum((m) => m.totals.openingsArea),
      wallNetArea: sum((m) => m.totals.wallNetArea),
      doors: sum((m) => m.totals.doors),
      windows: sum((m) => m.totals.windows),
      bays: sum((m) => m.totals.bays),
    },
  }
}

/**
 * Métrés par niveau et pour tout le bâtiment. Chaque niveau ne compte que ses propres éléments
 * (ceux dont `levelId` est le sien) ; les totaux du bâtiment sont la somme des niveaux.
 */
export function computeBuildingMeasurements(
  document: Pick<FabricsDocument, 'elements' | 'levels'>,
): BuildingMeasurements {
  const levels = (document.levels ?? []).map((level) => ({
    level,
    measurements: computeMeasurements(elementsOfLevel(document.elements, level.id)),
  }))
  return { levels, total: sumMeasurements(levels.map((l) => l.measurements)) }
}
