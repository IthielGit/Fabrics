import type { Level, StairElement } from '../../types/document'
import type { Point } from '../geometry/viewport'

// Escaliers entre niveaux (M9) : fonctions pures. Règles : docs/02-ARCHITECTURE.md,
// « Escaliers et trémies (M9) ». Toutes les valeurs sont en mm.

/** Hauteur de contremarche maximale. */
export const MAX_RISER_HEIGHT = 180
/** Giron minimal. */
export const MIN_TREAD_DEPTH = 250
/** Marge de la trémie autour de l'emprise de l'escalier, par défaut. */
export const DEFAULT_VOID_MARGIN = 50
/** Emmarchement par défaut. */
export const DEFAULT_STAIR_WIDTH = 1000
/** Jour central par défaut d'un escalier en U. */
export const DEFAULT_STAIR_GAP = 100

type StairGeometryInput = Pick<StairElement, 'shape' | 'width' | 'length' | 'length2' | 'gap' | 'mirrored'>

/** Nombre de contremarches : le plus petit entier n tel que `rise / n ≤ 180 mm` (0 si rien à monter). */
export function riserCount(rise: number): number {
  if (!(rise > 0)) return 0
  // La tolérance évite qu'un flottant comme 2700 / 180 = 15,000000000000002 donne 16.
  return Math.max(1, Math.ceil(rise / MAX_RISER_HEIGHT - 1e-9))
}

/** Marches calculées d'un escalier pour une hauteur à monter donnée. */
export interface StairSteps {
  /** Nombre de contremarches (n). */
  risers: number
  /** Nombre de girons (n − 1). */
  treads: number
  /** Hauteur d'une contremarche (rise / n), en mm. */
  riserHeight: number
  /** Giron : longueur totale des volées / (n − 1), en mm (0 s'il n'y a aucun giron). */
  treadDepth: number
  /** Longueur totale des volées (les paliers ne comptent pas). */
  run: number
  /** Longueur nécessaire pour respecter le giron minimal : (n − 1) × 250 mm. */
  requiredRun: number
  /** Vrai si la longueur des volées ne suffit pas (giron < 250 mm). */
  tooShort: boolean
}

/** Longueur totale des volées (une seule pour l'escalier droit). */
export function stairRun(stair: Pick<StairElement, 'shape' | 'length' | 'length2'>): number {
  return stair.shape === 'straight' ? stair.length : stair.length + (stair.length2 ?? 0)
}

/** Contremarches, girons et longueur nécessaire pour monter `rise` mm. `null` si rien à monter. */
export function computeStairSteps(
  stair: Pick<StairElement, 'shape' | 'length' | 'length2'>,
  rise: number,
): StairSteps | null {
  const risers = riserCount(rise)
  if (risers === 0) return null
  const treads = risers - 1
  const run = stairRun(stair)
  const requiredRun = treads * MIN_TREAD_DEPTH
  return {
    risers,
    treads,
    riserHeight: rise / risers,
    treadDepth: treads > 0 ? run / treads : 0,
    run,
    requiredRun,
    tooShort: run < requiredRun,
  }
}

/** Niveau juste au-dessus du niveau `levelId` (niveaux triés par altitude), ou `undefined`. */
export function levelAboveOf(levels: readonly Level[] | undefined, levelId: string | undefined): Level | undefined {
  if (!levels || levelId === undefined) return undefined
  const sorted = [...levels].sort((a, b) => a.elevation - b.elevation)
  const index = sorted.findIndex((level) => level.id === levelId)
  return index >= 0 ? sorted[index + 1] : undefined
}

/** Niveau de départ d'un escalier : le sien, ou le premier niveau si l'escalier n'en a pas. */
function startLevel(levels: readonly Level[] | undefined, stair: Pick<StairElement, 'levelId'>): Level | undefined {
  if (!levels || levels.length === 0) return undefined
  const sorted = [...levels].sort((a, b) => a.elevation - b.elevation)
  return sorted.find((level) => level.id === stair.levelId) ?? sorted[0]
}

/** État d'un escalier dans un plan : ses marches, ou la raison pour laquelle il n'en a pas. */
export type StairStatus =
  | { kind: 'ok'; rise: number; upper: Level; steps: StairSteps }
  /** Longueur insuffisante : `steps.requiredRun` donne la longueur nécessaire. */
  | { kind: 'too-short'; rise: number; upper: Level; steps: StairSteps }
  /** Aucun niveau au-dessus (le niveau a été supprimé, ou l'escalier est sur le dernier niveau). */
  | { kind: 'no-level-above' }

/**
 * État d'un escalier : hauteur à monter = altitude du niveau du dessus − altitude du niveau de
 * départ ; marches recalculées dès qu'une altitude ou une hauteur d'étage change.
 */
export function stairStatus(
  stair: Pick<StairElement, 'shape' | 'length' | 'length2' | 'levelId'>,
  levels: readonly Level[] | undefined,
): StairStatus {
  const start = startLevel(levels, stair)
  const upper = levelAboveOf(levels, start?.id)
  if (!start || !upper) return { kind: 'no-level-above' }
  const rise = upper.elevation - start.elevation
  const steps = computeStairSteps(stair, rise)
  if (!steps) return { kind: 'no-level-above' }
  return { kind: steps.tooShort ? 'too-short' : 'ok', rise, upper, steps }
}

// --- Géométrie -------------------------------------------------------------------------------

/** Une volée dans le repère de l'escalier (origine = coin haut-gauche de son emprise, avant rotation). */
export interface Flight {
  x: number
  y: number
  width: number
  height: number
  /** Sens de la montée : `up` = vers le haut (y décroissant), `right`, `down`. */
  direction: 'up' | 'right' | 'down'
  /** Nombre de girons de la volée. */
  treads: number
}

/** Un palier (rectangle) dans le repère de l'escalier. */
export interface Landing {
  x: number
  y: number
  width: number
  height: number
}

export interface StairLayout {
  flights: Flight[]
  landing: Landing | null
  /** Taille de l'emprise rectangulaire de l'escalier. */
  width: number
  height: number
  /** Contour exact de l'emprise (volées et paliers), sans le jour central d'un U. */
  outline: Point[]
}

/** Répartit les `treads` girons entre les volées proportionnellement à leur longueur. */
function splitTreads(treads: number, lengths: readonly number[]): number[] {
  if (lengths.length === 1) return [treads]
  const total = lengths[0] + lengths[1]
  if (treads <= 1) return [treads, 0]
  const first = Math.min(treads - 1, Math.max(1, Math.round((treads * lengths[0]) / total)))
  return [first, treads - first]
}

/**
 * Plan de l'escalier dans son repère local (avant retournement, rotation et position).
 * - droit : une volée `width × length`, montée vers le haut ;
 * - L : volée 1 vers le haut, palier carré de côté `width`, volée 2 vers la droite ;
 * - U : volée 1 vers le haut, palier `(2 × width + gap) × width`, volée 2 vers le bas.
 * `treads` = nombre de girons à répartir (0 si inconnu : aucune ligne de marche).
 */
export function stairLayout(stair: StairGeometryInput, treads = 0): StairLayout {
  const w = stair.width
  const l1 = stair.length
  const l2 = stair.length2 ?? 0
  const gap = stair.gap ?? 0

  if (stair.shape === 'l') {
    const [t1, t2] = splitTreads(treads, [l1, l2])
    return {
      flights: [
        { x: 0, y: w, width: w, height: l1, direction: 'up', treads: t1 },
        { x: w, y: 0, width: l2, height: w, direction: 'right', treads: t2 },
      ],
      landing: { x: 0, y: 0, width: w, height: w },
      width: w + l2,
      height: w + l1,
      outline: [
        { x: 0, y: 0 },
        { x: w + l2, y: 0 },
        { x: w + l2, y: w },
        { x: w, y: w },
        { x: w, y: w + l1 },
        { x: 0, y: w + l1 },
      ],
    }
  }
  if (stair.shape === 'u') {
    const [t1, t2] = splitTreads(treads, [l1, l2])
    const total = 2 * w + gap
    const depth = w + Math.max(l1, l2)
    return {
      flights: [
        { x: 0, y: w, width: w, height: l1, direction: 'up', treads: t1 },
        { x: w + gap, y: w, width: w, height: l2, direction: 'down', treads: t2 },
      ],
      landing: { x: 0, y: 0, width: total, height: w },
      width: total,
      height: depth,
      outline: [
        { x: 0, y: 0 },
        { x: total, y: 0 },
        { x: total, y: w + l2 },
        { x: w + gap, y: w + l2 },
        { x: w + gap, y: w },
        { x: w, y: w },
        { x: w, y: w + l1 },
        { x: 0, y: w + l1 },
      ],
    }
  }
  return {
    flights: [{ x: 0, y: 0, width: w, height: l1, direction: 'up', treads }],
    landing: null,
    width: w,
    height: l1,
    outline: [
      { x: 0, y: 0 },
      { x: w, y: 0 },
      { x: w, y: l1 },
      { x: 0, y: l1 },
    ],
  }
}

/** Emprise de l'escalier (largeur × hauteur de sa boîte), sans tenir compte de la rotation. */
export function stairSize(stair: StairGeometryInput): { width: number; height: number } {
  const { width, height } = stairLayout(stair)
  return { width, height }
}

const toRadians = (degrees: number) => (degrees * Math.PI) / 180

/** Point du repère local de l'escalier → plan : retournement, rotation autour de (x, y), position. */
export function stairToWorld(
  stair: Pick<StairElement, 'x' | 'y' | 'rotation' | 'mirrored'> & StairGeometryInput,
  point: Point,
): Point {
  const { width } = stairLayout(stair)
  const local = stair.mirrored && stair.shape !== 'straight' ? { x: width - point.x, y: point.y } : point
  const angle = toRadians(stair.rotation)
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return {
    x: stair.x + local.x * cos - local.y * sin,
    y: stair.y + local.x * sin + local.y * cos,
  }
}

/** Contour de l'emprise de l'escalier dans le plan (sommets dans l'ordre du contour). */
export function stairFootprint(stair: Pick<StairElement, 'x' | 'y' | 'rotation'> & StairGeometryInput): Point[] {
  return stairLayout(stair).outline.map((p) => stairToWorld(stair, p))
}

/**
 * Agrandit un polygone orthogonal ou quelconque de `margin` mm de chaque côté (angles vifs).
 * Chaque côté est décalé vers l'extérieur ; les sommets sont les croisements des côtés voisins.
 */
export function offsetPolygon(points: readonly Point[], margin: number): Point[] {
  const count = points.length
  if (count < 3 || margin === 0) return points.map((p) => ({ ...p }))
  // Orientation : l'aire signée donne le côté « extérieur » des côtés.
  let signed = 0
  for (let i = 0; i < count; i++) {
    const a = points[i]
    const b = points[(i + 1) % count]
    signed += a.x * b.y - b.x * a.y
  }
  const sign = signed >= 0 ? 1 : -1
  // Droite décalée de chaque côté : point + direction.
  const lines = points.map((a, i) => {
    const b = points[(i + 1) % count]
    const dx = b.x - a.x
    const dy = b.y - a.y
    const length = Math.hypot(dx, dy) || 1
    // Normale sortante : pour une aire signée positive (sens horaire à l'écran), (dy, -dx).
    const nx = (sign * dy) / length
    const ny = (-sign * dx) / length
    return { px: a.x + nx * margin, py: a.y + ny * margin, dx, dy }
  })
  return points.map((_, i) => {
    const previous = lines[(i - 1 + count) % count]
    const next = lines[i]
    const cross = previous.dx * next.dy - previous.dy * next.dx
    if (Math.abs(cross) < 1e-9) return { x: next.px, y: next.py } // côtés alignés
    const t = ((next.px - previous.px) * next.dy - (next.py - previous.py) * next.dx) / cross
    return { x: Math.round(previous.px + previous.dx * t), y: Math.round(previous.py + previous.dy * t) }
  })
}

/**
 * Trémie de l'escalier : son emprise agrandie de `voidMargin`, dans le plan ; jamais stockée. Droit :
 * rectangle ; L : polygone en L ; U : rectangle englobant (volées, palier et jour central).
 */
export function stairVoid(stair: Pick<StairElement, 'x' | 'y' | 'rotation' | 'voidMargin'> & StairGeometryInput): Point[] {
  const layout = stairLayout(stair)
  const local: Point[] =
    stair.shape === 'u'
      ? [
          { x: 0, y: 0 },
          { x: layout.width, y: 0 },
          { x: layout.width, y: layout.height },
          { x: 0, y: layout.height },
        ]
      : layout.outline
  const grown = offsetPolygon(local, stair.voidMargin)
  return grown.map((p) => stairToWorld(stair, p))
}

/** Longueur par défaut des volées d'un escalier neuf, selon la hauteur à monter (jamais trop court). */
export function defaultStairLengths(
  shape: StairElement['shape'],
  rise: number,
): { length: number; length2?: number; gap?: number } {
  const steps = computeStairSteps({ shape, length: 0, length2: 0 }, rise)
  const required = steps ? steps.requiredRun : 0
  const round = (value: number) => Math.max(MIN_TREAD_DEPTH, Math.ceil(value / 50) * 50)
  if (shape === 'l') {
    const first = round(required / 2)
    return { length: first, length2: round(Math.max(required - first, MIN_TREAD_DEPTH)) }
  }
  if (shape === 'u') {
    const half = round(required / 2)
    return { length: half, length2: half, gap: DEFAULT_STAIR_GAP }
  }
  return { length: round(required) }
}
