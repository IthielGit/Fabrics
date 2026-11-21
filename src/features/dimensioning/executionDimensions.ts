import type { CanvasElement, Level, WallElement } from '../../types/document'
import { flattenPoints, polygonCentroid } from '../geometry/polygon'
import type { Point } from '../geometry/viewport'
import { axisAlignedRectangle, type Measurements } from '../measurements/measurements'
import { roomDimensionsText } from '../measurements/clientView'
import { stairFootprint } from '../stairs/stairs'
import type { StairVoid } from '../stairs/voids'
import { formatArea } from '../units/format'
import { wallsOuterBox } from './clientDimensions'
import { DEFAULT_FACADE_OPTIONS, facadeChains, type FacadeChainOptions } from './facadeChains'
import type { AutoAnnotations, AutoDimension, AutoLabel } from './types'

/**
 * Cotes **Exécution** d'un niveau (M10 ter lot B), au nu brut des murs (D38) :
 * - les trois chaînes de chaque façade (`facadeChains`) ;
 * - dans chaque pièce, une cote de largeur et une de profondeur au nu des murs (D20-9, M20) ;
 * - chaque baie en dimensions brutes de maçonnerie (D39), au format de la référence de l'utilisateur
 *   (D20-9) : porte `PP: 900 x 2100`, fenêtre `1500 x 1000` et allège `All. 1100` ; les repères `P01`,
 *   `F01` restent dans les métrés ;
 * - chaque pièce : nom et surface (D20-9 ; altitudes dans les métrés et sur les coupes) ;
 * - les plateformes (altitude du dessus), les trémies (dimensions) et les escaliers (nombre de
 *   contremarches, hauteur, giron).
 * Les nombres viennent des métrés et des repères : plan et métrés d'exécution ne se contredisent pas.
 */
export interface ExecutionLabels {
  /** « All. 900 ». */
  sill: (mm: number) => string
  /** Porte ou baie : « PP: 900 x 2100 ». */
  door: (width: number, height: number) => string
  /** Fenêtre : « 1500 x 1000 ». */
  window: (width: number, height: number) => string
  /** « Sol ±0 ». */
  floor: (altitude: string) => string
  /** « Dalle +2700 ». */
  slab: (altitude: string) => string
  /** « +2650 sous plafond ». */
  ceiling: (altitude: string) => string
  /** « N » : lettre de la flèche du nord. */
  north: string
  /** « E », « S », « O » : les autres lettres de la rose des vents (sans elles, seul le N est écrit). */
  east?: string
  south?: string
  west?: string
  /** « Niveau RDC (±0) » : repère de niveau du plan. */
  levelMark: (levelName: string, altitude: string) => string
  /** « Trémie ». */
  stairVoid: string
  /** « 16 CM × 175 ». */
  risers: (count: number, height: number) => string
  /** « Giron 260 ». */
  tread: (mm: number) => string
}

export interface ExecutionContext {
  level: Level
  /** Niveau juste au-dessus (altitude de la dalle haute) ; absent : haut des murs du niveau. */
  levelAbove?: Level
  measurements: Pick<Measurements, 'rooms' | 'stairs'>
  /** Trémies qui percent ce niveau. */
  voids: readonly StairVoid[]
  labels: ExecutionLabels
}

export interface ExecutionOptions extends FacadeChainOptions {
  /** Distance entre le centre d'une pièce et ses cotes de largeur et de profondeur, en mm (pour ne pas couvrir le nom). */
  innerShift: number
  /** Distance entre la face d'un mur et l'étiquette d'une ouverture, en mm. */
  openingLabelGap: number
}

export const DEFAULT_EXECUTION_OPTIONS: ExecutionOptions = {
  ...DEFAULT_FACADE_OPTIONS,
  innerShift: 700,
  openingLabelGap: 450,
}

/** Rectangle qui englobe une liste de points `[x1, y1, x2, y2, …]`. */
function pointsBox(flat: readonly number[]) {
  const xs = flat.filter((_, i) => i % 2 === 0)
  const ys = flat.filter((_, i) => i % 2 === 1)
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) }
}

/** Altitude en mm entiers, avec son signe : `±0`, `+2850`, `-450`. */
export function formatAltitude(mm: number): string {
  const rounded = Math.round(mm)
  if (rounded === 0) return '±0'
  return rounded > 0 ? `+${rounded}` : `${rounded}`
}


/**
 * Intervalle intérieur d'une pièce (polygone `[x1, y1, …]`) sur une ligne horizontale (`y = at`) ou
 * verticale (`x = at`) : celui qui contient `around`, sinon le plus long ; `null` si la ligne ne
 * traverse pas la pièce. Sert à la cote de largeur et de profondeur de chaque pièce (D20-9).
 */
export function roomChord(
  flat: readonly number[],
  direction: 'horizontal' | 'vertical',
  at: number,
  around: number,
): [number, number] | null {
  const hits: number[] = []
  const n = flat.length / 2
  for (let i = 0; i < n; i++) {
    const [ax, ay] = [flat[2 * i], flat[2 * i + 1]]
    const [bx, by] = [flat[(2 * i + 2) % flat.length], flat[(2 * i + 3) % flat.length]]
    // Coordonnée « en travers » de la ligne (c) et « le long » (s).
    const [ca, cb, sa, sb] = direction === 'horizontal' ? [ay, by, ax, bx] : [ax, bx, ay, by]
    if (ca === cb || at < Math.min(ca, cb) || at >= Math.max(ca, cb)) continue
    hits.push(sa + ((at - ca) / (cb - ca)) * (sb - sa))
  }
  hits.sort((x, y) => x - y)
  const spans: [number, number][] = []
  for (let k = 0; k + 1 < hits.length; k += 2) if (hits[k + 1] - hits[k] > 1) spans.push([hits[k], hits[k + 1]])
  if (spans.length === 0) return null
  return spans.find(([lo, hi]) => around >= lo && around <= hi) ?? spans.reduce((best, sp) => (sp[1] - sp[0] > best[1] - best[0] ? sp : best))
}

/** Centre d'une ouverture sur l'axe de son mur, et normale du mur (vecteur unitaire). */
function openingFrame(
  opening: { segmentIndex: number; offset: number },
  wall: WallElement,
): { centre: Point; normal: Point } | null {
  const i = opening.segmentIndex * 2
  const [ax, ay, bx, by] = wall.points.slice(i, i + 4)
  if (bx === undefined || by === undefined) return null
  const length = Math.hypot(bx - ax, by - ay)
  if (length === 0) return null
  const dx = (bx - ax) / length
  const dy = (by - ay) / length
  return { centre: { x: ax + dx * opening.offset, y: ay + dy * opening.offset }, normal: { x: -dy, y: dx } }
}

export function executionDimensions(
  elements: readonly CanvasElement[],
  context: ExecutionContext,
  options: ExecutionOptions = DEFAULT_EXECUTION_OPTIONS,
): AutoAnnotations {
  const { level, measurements, voids, labels } = context
  const visible = elements.filter((el) => !el.hidden)
  const walls = visible.filter((el): el is WallElement => el.type === 'wall')
  const dimensions: AutoDimension[] = [...facadeChains(visible, options)]
  const result: AutoLabel[] = []

  // Pièces : nom et surface ; une cote de largeur et une de profondeur, au nu des murs.
  const roomById = new Map(measurements.rooms.map((room) => [room.id, room]))
  for (const room of visible) {
    if (room.type !== 'room') continue
    const centre = polygonCentroid(room.points)
    const measure = roomById.get(room.id)
    if (!centre || !measure) continue
    result.push({
      id: `room-${room.id}`,
      x: centre.x,
      y: centre.y,
      lines: [room.name, formatArea(measure.netArea)],
      bounds: pointsBox(room.points),
    })
    for (const direction of ['horizontal', 'vertical'] as const) {
      const at = direction === 'horizontal' ? centre.y + options.innerShift : centre.x + options.innerShift
      const around = direction === 'horizontal' ? centre.x : centre.y
      const chord = roomChord(room.points, direction, at, around)
      if (!chord) continue
      const [lo, hi] = chord
      const points: [number, number, number, number] = direction === 'horizontal' ? [lo, at, hi, at] : [at, lo, at, hi]
      dimensions.push({ id: `room-${room.id}-${direction === 'horizontal' ? 'width' : 'depth'}`, points, offset: 0 })
    }
  }

  // Ouvertures : repère, baie brute « largeur / hauteur », allège. Étiquette du côté extérieur.
  const box = wallsOuterBox(walls)
  const middle = box ? { x: (box.minX + box.maxX) / 2, y: (box.minY + box.maxY) / 2 } : { x: 0, y: 0 }
  const wallById = new Map(walls.map((wall) => [wall.id, wall]))
  for (const opening of visible) {
    if (opening.type !== 'opening') continue
    const wall = wallById.get(opening.wallId)
    const frame = wall && openingFrame(opening, wall)
    if (!wall || !frame) continue
    const { centre, normal } = frame
    const outward = (centre.x - middle.x) * normal.x + (centre.y - middle.y) * normal.y >= 0 ? 1 : -1
    const distance = wall.thickness / 2 + options.openingLabelGap
    const width = Math.round(opening.width)
    const height = Math.round(opening.height)
    const lines = [opening.kind === 'window' ? labels.window(width, height) : labels.door(width, height)]
    if (opening.sillHeight > 0) lines.push(labels.sill(Math.round(opening.sillHeight)))
    result.push({
      id: `opening-${opening.id}`,
      x: centre.x + normal.x * distance * outward,
      y: centre.y + normal.y * distance * outward,
      lines,
      // Si l'emplacement est pris : l'autre côté du mur.
      alternatives: [{ x: centre.x - normal.x * distance * outward, y: centre.y - normal.y * distance * outward }],
    })
  }

  // Plateformes : altitude du dessus.
  for (const platform of visible) {
    if (platform.type !== 'platform') continue
    const centre = polygonCentroid(platform.points)
    if (!centre) continue
    result.push({
      id: `platform-${platform.id}`,
      x: centre.x,
      y: centre.y,
      lines: [platform.name, labels.floor(formatAltitude(level.elevation + platform.elevation))],
    })
  }

  // Trémies qui percent ce niveau : nom et dimensions (rectangle) ou une cote par côté.
  for (const stairVoid of voids) {
    const flat = flattenPoints(stairVoid.polygon)
    const centre = polygonCentroid(flat)
    if (!centre) continue
    const size = axisAlignedRectangle(flat)
    const lines = [labels.stairVoid]
    if (size) lines.push(roomDimensionsText(size))
    else {
      for (let i = 0; i < stairVoid.polygon.length; i++) {
        const a = stairVoid.polygon[i]
        const b = stairVoid.polygon[(i + 1) % stairVoid.polygon.length]
        dimensions.push({ id: `void-${stairVoid.stairId}-${i}`, points: [a.x, a.y, b.x, b.y], offset: 0 })
      }
    }
    result.push({ id: `void-${stairVoid.stairId}`, x: centre.x, y: centre.y, lines })
  }

  // Escaliers : contremarches, hauteur, giron (escalier complet, avec un niveau au-dessus).
  const stairById = new Map(measurements.stairs.map((stair) => [stair.id, stair]))
  for (const stair of visible) {
    if (stair.type !== 'stair') continue
    const measure = stairById.get(stair.id)
    const centre = polygonCentroid(flattenPoints(stairFootprint(stair)))
    if (!measure || !centre || measure.risers === null || measure.riserHeight === null) continue
    const lines = [labels.risers(measure.risers, Math.round(measure.riserHeight))]
    if (measure.treadDepth !== null) lines.push(labels.tread(Math.round(measure.treadDepth)))
    result.push({ id: `stair-${stair.id}`, x: centre.x, y: centre.y, lines })
  }

  return { dimensions, labels: result }
}
