import type { AxisElement, CanvasElement, OpeningElement, WallElement } from '../../types/document'
import { toPoints } from '../geometry/polygon'
import type { Point } from '../geometry/viewport'
import { wallFaces } from '../geometry/walls'
import { outerBoxDimensions, wallsOuterBox } from './clientDimensions'
import type { AutoDimension } from './types'

/**
 * Cotes **Exécution** des façades d'un niveau (M10 ter lot B) : trois chaînes par côté du
 * bâtiment, au **nu brut** des murs (D38), de la plus proche à la plus éloignée :
 * 1. baies et trumeaux : bords des faces extérieures vues de ce côté et tableaux des ouvertures ;
 * 2. murs de refend et axes : axes des murs perpendiculaires à la façade, axes de construction ;
 * 3. longueur totale.
 * Une chaîne qui ne dirait rien de plus que la longueur totale n'est pas dessinée.
 *
 * Limite : seuls les murs horizontaux et verticaux du plan sont pris en compte (un mur en biais
 * n'entre dans aucune chaîne de façade ; la longueur totale l'englobe quand même).
 */
export interface FacadeChainOptions {
  /** Distance entre la face extérieure des murs et la 1re chaîne, en mm. */
  gap: number
  /** Écart entre deux chaînes, en mm. */
  step: number
}

export const DEFAULT_FACADE_OPTIONS: FacadeChainOptions = { gap: 800, step: 600 }

export type Side = 'top' | 'right' | 'bottom' | 'left'
const SIDES: Side[] = ['top', 'right', 'bottom', 'left']

/** Écart d'alignement toléré pour un mur « horizontal » ou « vertical », en mm. */
const ALIGN_TOLERANCE = 0.5
/** Deux graduations plus proches que cela sont confondues, en mm. */
const TICK_MERGE = 1

/**
 * Repère local d'un côté : `u` le long de la façade (croissant comme x ou y), `v` vers l'extérieur.
 * Pour les côtés haut et gauche, l'extérieur est vers les x ou y décroissants.
 */
function toLocal(side: Side, p: Point): { u: number; v: number } {
  switch (side) {
    case 'top': return { u: p.x, v: -p.y }
    case 'bottom': return { u: p.x, v: p.y }
    case 'left': return { u: p.y, v: -p.x }
    case 'right': return { u: p.y, v: p.x }
  }
}

/** La façade est-elle horizontale (haut, bas) ? */
const horizontal = (side: Side) => side === 'top' || side === 'bottom'

/** Morceau de face extérieure tourné vers un côté. */
interface FacePiece {
  wallId: string
  segmentIndex: number
  u0: number
  u1: number
  /** Distance vers l'extérieur (plus grand = plus en avant). */
  v: number
}

/** Faces des murs parallèles au côté, tournées vers lui. */
function facePieces(walls: readonly WallElement[], side: Side): FacePiece[] {
  const pieces: FacePiece[] = []
  for (const wall of walls) {
    const axis = toPoints(wall.points)
    const { left, right } = wallFaces(wall.points, wall.thickness)
    // `wallFaces` retire les points doublés : on ne garde que les tracés sans doublon (cas courant).
    if (left.length !== axis.length) continue
    for (let i = 0; i + 1 < axis.length; i++) {
      const a = toLocal(side, axis[i])
      const b = toLocal(side, axis[i + 1])
      if (Math.abs(a.v - b.v) > ALIGN_TOLERANCE || Math.abs(a.u - b.u) < ALIGN_TOLERANCE) continue
      for (const face of [left, right]) {
        const fa = toLocal(side, face[i])
        const fb = toLocal(side, face[i + 1])
        if (fa.v <= a.v) continue // face tournée vers l'intérieur
        pieces.push({
          wallId: wall.id,
          segmentIndex: i,
          u0: Math.min(fa.u, fb.u),
          u1: Math.max(fa.u, fb.u),
          v: (fa.v + fb.v) / 2,
        })
      }
    }
  }
  return pieces
}

interface Visible {
  piece: FacePiece
  u0: number
  u1: number
}

/** Parties de faces réellement vues depuis le côté (la plus en avant gagne). */
function visibleFaces(pieces: readonly FacePiece[]): Visible[] {
  const cuts = [...new Set(pieces.flatMap((p) => [p.u0, p.u1]))].sort((a, b) => a - b)
  const result: Visible[] = []
  for (let k = 0; k + 1 < cuts.length; k++) {
    const u0 = cuts[k]
    const u1 = cuts[k + 1]
    if (u1 - u0 < TICK_MERGE) continue
    const middle = (u0 + u1) / 2
    let best: FacePiece | null = null
    for (const p of pieces) {
      if (p.u0 <= middle && middle <= p.u1 && (!best || p.v > best.v)) best = p
    }
    if (!best) continue
    const last = result[result.length - 1]
    if (last && last.piece === best && Math.abs(last.u1 - u0) < TICK_MERGE) last.u1 = u1
    else result.push({ piece: best, u0, u1 })
  }
  return result
}

/** Positions des tableaux (bords) d'une ouverture, le long de l'axe de son mur. */
function openingJambs(opening: OpeningElement, wall: WallElement): [Point, Point] | null {
  const i = opening.segmentIndex * 2
  const [ax, ay, bx, by] = wall.points.slice(i, i + 4)
  if (bx === undefined || by === undefined) return null
  const length = Math.hypot(bx - ax, by - ay)
  if (length === 0) return null
  const dx = (bx - ax) / length
  const dy = (by - ay) / length
  const half = opening.width / 2
  const c = { x: ax + dx * opening.offset, y: ay + dy * opening.offset }
  return [
    { x: c.x - dx * half, y: c.y - dy * half },
    { x: c.x + dx * half, y: c.y + dy * half },
  ]
}

function mergeTicks(values: readonly number[]): number[] {
  const sorted = [...values].sort((a, b) => a - b)
  const result: number[] = []
  for (const value of sorted) {
    if (result.length === 0 || value - result[result.length - 1] >= TICK_MERGE) result.push(value)
  }
  return result
}

/** Graduations des chaînes 1 et 2 d'un côté, en coordonnée `u`, bornées par l'emprise. */
export function facadeTicks(
  elements: readonly CanvasElement[],
  side: Side,
): { openings: number[]; walls: number[]; range: [number, number] } | null {
  const visible = elements.filter((el) => !el.hidden)
  const walls = visible.filter((el): el is WallElement => el.type === 'wall')
  const box = wallsOuterBox(walls)
  if (!box) return null
  const range: [number, number] = horizontal(side) ? [box.minX, box.maxX] : [box.minY, box.maxY]
  const inRange = (u: number) => u > range[0] + TICK_MERGE && u < range[1] - TICK_MERGE

  // Chaîne 1 : bords des faces vues et tableaux des ouvertures posées sur ces faces.
  const seen = visibleFaces(facePieces(walls, side))
  const chain1 = seen.flatMap((s) => [s.u0, s.u1])
  const wallById = new Map(walls.map((w) => [w.id, w]))
  for (const el of visible) {
    if (el.type !== 'opening') continue
    const wall = wallById.get(el.wallId)
    const jambs = wall && openingJambs(el, wall)
    if (!jambs) continue
    for (const jamb of jambs) {
      const u = toLocal(side, jamb).u
      const onFace = seen.some(
        (s) => s.piece.wallId === el.wallId && s.piece.segmentIndex === el.segmentIndex && s.u0 - TICK_MERGE <= u && u <= s.u1 + TICK_MERGE,
      )
      if (onFace) chain1.push(u)
    }
  }

  // Chaîne 2 : axes des murs perpendiculaires à la façade (refends), axes de construction.
  const chain2: number[] = []
  for (const wall of walls) {
    const axis = toPoints(wall.points).map((p) => toLocal(side, p))
    for (let i = 0; i + 1 < axis.length; i++) {
      const a = axis[i]
      const b = axis[i + 1]
      if (Math.abs(a.u - b.u) > ALIGN_TOLERANCE || Math.abs(a.v - b.v) < ALIGN_TOLERANCE) continue
      // Un mur de façade (sur le bord de l'emprise) n'est pas un refend.
      if (a.u - wall.thickness < range[0] || a.u + wall.thickness > range[1]) continue
      chain2.push(a.u)
    }
  }
  for (const el of visible) {
    if (el.type !== 'axis') continue
    const [ax, ay, bx, by] = (el as AxisElement).points
    const a = toLocal(side, { x: ax, y: ay })
    const b = toLocal(side, { x: bx, y: by })
    if (Math.abs(a.u - b.u) <= ALIGN_TOLERANCE) chain2.push(a.u)
  }

  return {
    openings: mergeTicks([...range, ...chain1.filter(inRange)]),
    walls: mergeTicks([...range, ...chain2.filter(inRange)]),
    range,
  }
}

/** Les cotes d'une chaîne : une par intervalle entre deux graduations consécutives. */
function chainDimensions(
  side: Side,
  ticks: readonly number[],
  edge: number,
  offset: number,
  idPrefix: string,
): AutoDimension[] {
  const result: AutoDimension[] = []
  for (let k = 0; k + 1 < ticks.length; k++) {
    const [u0, u1] = [ticks[k], ticks[k + 1]]
    const points: [number, number, number, number] = horizontal(side)
      ? [u0, edge, u1, edge]
      : [edge, u0, edge, u1]
    result.push({ id: `${idPrefix}-${k}`, points, offset })
  }
  return result
}

export function facadeChains(
  elements: readonly CanvasElement[],
  options: FacadeChainOptions = DEFAULT_FACADE_OPTIONS,
): AutoDimension[] {
  const walls = elements.filter((el): el is WallElement => el.type === 'wall' && !el.hidden)
  const box = wallsOuterBox(walls)
  if (!box) return []
  const result: AutoDimension[] = []
  // Signe du décalage vers l'extérieur, comme `outerBoxDimensions` (haut, droite : négatif).
  const outward: Record<Side, number> = { top: -1, right: -1, bottom: 1, left: 1 }
  const edge: Record<Side, number> = { top: box.minY, right: box.maxX, bottom: box.maxY, left: box.minX }
  for (const side of SIDES) {
    const ticks = facadeTicks(elements, side)
    if (!ticks) continue
    let distance = options.gap
    for (const [name, list] of [['openings', ticks.openings], ['walls', ticks.walls]] as const) {
      if (list.length <= 2) continue // rien de plus que la longueur totale
      result.push(...chainDimensions(side, list, edge[side], outward[side] * distance, `facade-${side}-${name}`))
      distance += options.step
    }
    const total = outerBoxDimensions(box, distance, `facade-total`).find((d) => d.id.endsWith(side))
    if (total) result.push(total)
  }
  return result
}
