import { polygonArea, polygonCentroid, polygonPerimeter } from '../geometry/polygon'
import type { Point } from '../geometry/viewport'

/**
 * Plan de démonstration de la page d'introduction : un séjour, une cuisine et une entrée,
 * coordonnées en mm (contour intérieur, comme une pièce tracée dans l'éditeur).
 * Les métrés affichés sur la page sont calculés ici, avec les mêmes fonctions que l'éditeur.
 */
export type DemoRoomId = 'sejour' | 'cuisine' | 'entree'

export interface DemoRoom {
  id: DemoRoomId
  /** Polygone aplati [x0, y0, x1, y1, …] en mm. */
  points: readonly number[]
}

export interface DemoRoomMeasure {
  id: DemoRoomId
  areaMm2: number
  perimeterMm: number
  /** Point où poser l'étiquette de la pièce, en mm. */
  center: Point
}

/** Largeur et profondeur totales du plan, en mm. */
export const DEMO_PLAN_SIZE = { width: 8700, depth: 4200 } as const

export const DEMO_ROOMS: readonly DemoRoom[] = [
  { id: 'sejour', points: [0, 0, 5200, 0, 5200, 4200, 0, 4200] },
  { id: 'cuisine', points: [5200, 0, 8700, 0, 8700, 3200, 5200, 3200] },
  { id: 'entree', points: [5200, 3200, 8700, 3200, 8700, 4200, 5200, 4200] },
]

/** Cotes affichées autour du plan : chaîne du bas et chaîne de droite, en mm. */
export const DEMO_DIMENSIONS = {
  bottom: [5200, 3500],
  right: [3200, 1000],
  left: [4200],
} as const

export function measureDemoRooms(rooms: readonly DemoRoom[] = DEMO_ROOMS): DemoRoomMeasure[] {
  return rooms.map((room) => ({
    id: room.id,
    areaMm2: polygonArea(room.points),
    perimeterMm: polygonPerimeter(room.points),
    center: polygonCentroid(room.points) ?? { x: 0, y: 0 },
  }))
}

export function totalDemoArea(measures: readonly DemoRoomMeasure[]): number {
  return measures.reduce((sum, room) => sum + room.areaMm2, 0)
}
