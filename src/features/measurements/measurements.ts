import type { CanvasElement } from '../../types/document'
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
  /** Surface d'une face : longueur × hauteur, sans déduction d'ouvertures, en mm². */
  wallArea: number
}

export interface Measurements {
  rooms: RoomMeasure[]
  walls: WallMeasure[]
  totals: {
    roomArea: number // mm²
    wallLength: number // mm
    wallArea: number // mm²
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
      walls.push({
        id: element.id,
        name: element.name,
        length,
        thickness: element.thickness,
        height: element.height,
        wallArea: length * element.height,
      })
    }
  }

  return {
    rooms,
    walls,
    totals: {
      roomArea: rooms.reduce((sum, room) => sum + room.area, 0),
      wallLength: walls.reduce((sum, wall) => sum + wall.length, 0),
      wallArea: walls.reduce((sum, wall) => sum + wall.wallArea, 0),
    },
  }
}
