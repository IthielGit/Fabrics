import type { CanvasElement, RoomElement, WallElement } from '../../types/document'
import { polygonCentroid } from '../geometry/polygon'
import { wallFaces } from '../geometry/walls'
import type { RoomMeasure } from '../measurements/measurements'
import { roomDimensionsText } from '../measurements/clientView'
import { formatArea } from '../units/format'
import type { AutoAnnotations, AutoDimension, AutoLabel } from './types'

/**
 * Cotes **Client** d'un niveau (M10 ter lot B) : peu de cotes, sans vocabulaire technique.
 * - Dimensions extérieures totales du bâtiment : une cote par côté du rectangle qui englobe les
 *   faces extérieures des murs.
 * - Dans chaque pièce : son nom, ses dimensions (`4000 × 3000` pour une pièce rectangulaire ; pour
 *   une autre forme, une cote le long de chaque côté, à l'intérieur) et sa surface au sol.
 *
 * Les dimensions d'une pièce sont celles de son contour tel qu'il est dessiné (décision A du
 * 2026-11-12) ; la surface vient des métrés (`RoomMeasure.netArea`, trémie déduite) : cotes et
 * métrés ne peuvent pas se contredire. Les éléments masqués ne sont pas cotés.
 */
export interface ClientDimensionOptions {
  /** Distance entre la face extérieure des murs et la cote totale, en mm. */
  outerGap: number
  /** Distance entre un côté de pièce (forme libre) et sa cote, vers l'intérieur, en mm. */
  roomInset: number
}

export const DEFAULT_CLIENT_OPTIONS: ClientDimensionOptions = { outerGap: 800, roomInset: 400 }

interface Box {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

/** Rectangle qui englobe les faces des murs, ou `null` sans mur. */
export function wallsOuterBox(walls: readonly WallElement[]): Box | null {
  let box: Box | null = null
  for (const wall of walls) {
    const { left, right } = wallFaces(wall.points, wall.thickness)
    for (const p of [...left, ...right]) {
      if (!box) box = { minX: p.x, minY: p.y, maxX: p.x, maxY: p.y }
      else {
        box.minX = Math.min(box.minX, p.x)
        box.minY = Math.min(box.minY, p.y)
        box.maxX = Math.max(box.maxX, p.x)
        box.maxY = Math.max(box.maxY, p.y)
      }
    }
  }
  return box
}

/** Quatre cotes totales (haut, droite, bas, gauche), à l'extérieur du rectangle. */
export function outerBoxDimensions(box: Box, gap: number, idPrefix: string): AutoDimension[] {
  const { minX, minY, maxX, maxY } = box
  if (maxX - minX <= 0 || maxY - minY <= 0) return []
  // La normale gauche de A → B est (-dy, dx) : un décalage positif va de ce côté.
  return [
    { id: `${idPrefix}-top`, points: [minX, minY, maxX, minY], offset: -gap }, // normale vers le bas
    { id: `${idPrefix}-right`, points: [maxX, minY, maxX, maxY], offset: -gap }, // normale vers la gauche
    { id: `${idPrefix}-bottom`, points: [minX, maxY, maxX, maxY], offset: gap },
    { id: `${idPrefix}-left`, points: [minX, minY, minX, maxY], offset: gap },
  ]
}

/** Aire signée (positive : l'intérieur est du côté de la normale gauche de chaque côté). */
function signedArea(flat: readonly number[]): number {
  let sum = 0
  const n = flat.length / 2
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    sum += flat[2 * i] * flat[2 * j + 1] - flat[2 * j] * flat[2 * i + 1]
  }
  return sum / 2
}

/** Une cote par côté du contour, tournée vers l'intérieur de la pièce. */
function roomSideDimensions(room: RoomElement, inset: number): AutoDimension[] {
  const p = room.points
  const n = Math.floor(p.length / 2)
  if (n < 3) return []
  const inward = signedArea(p) >= 0 ? 1 : -1
  const result: AutoDimension[] = []
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    const points: [number, number, number, number] = [p[2 * i], p[2 * i + 1], p[2 * j], p[2 * j + 1]]
    if (Math.hypot(points[2] - points[0], points[3] - points[1]) < 1) continue
    result.push({ id: `room-${room.id}-side-${i}`, points, offset: inward * inset })
  }
  return result
}

export function clientDimensions(
  elements: readonly CanvasElement[],
  rooms: readonly RoomMeasure[],
  options: ClientDimensionOptions = DEFAULT_CLIENT_OPTIONS,
): AutoAnnotations {
  const visible = elements.filter((el) => !el.hidden)
  const walls = visible.filter((el): el is WallElement => el.type === 'wall')
  const dimensions: AutoDimension[] = []
  const labels: AutoLabel[] = []

  const box = wallsOuterBox(walls)
  if (box) dimensions.push(...outerBoxDimensions(box, options.outerGap, 'outer'))

  const measureById = new Map(rooms.map((room) => [room.id, room]))
  for (const room of visible) {
    if (room.type !== 'room') continue
    const measure = measureById.get(room.id)
    const centre = polygonCentroid(room.points)
    if (!measure || !centre) continue
    const lines = [room.name]
    if (measure.dimensions) lines.push(roomDimensionsText(measure.dimensions))
    else dimensions.push(...roomSideDimensions(room, options.roomInset))
    lines.push(formatArea(measure.netArea))
    labels.push({ id: `room-${room.id}`, x: centre.x, y: centre.y, lines })
  }
  return { dimensions, labels }
}
