import type { CanvasElement } from '../../types/document'
import { elementBounds } from '../export/bounds'
import type { Box } from './box'
import { unionBoxes } from './box'
import type { Guide } from './guides'
import { toPoints } from './polygon'
import type { Point } from './viewport'

/**
 * Lignes d'aimantation : abscisses des lignes verticales (`xs`) et ordonnées des lignes
 * horizontales (`ys`), en mm, tirées de la vraie géométrie des éléments (faces et axes des murs,
 * contours des pièces, emprises), sans les traits, étiquettes ni textes du dessin.
 */
export interface SnapLines {
  xs: number[]
  ys: number[]
}

/** Aimantation d'une pose ou d'un déplacement : cibles, distance d'accroche (mm) et grille. */
export interface PlacementSnap {
  targets: SnapLines
  /** Distance d'accroche, en mm (8 px à l'écran divisés par l'échelle). */
  threshold: number
  /** Pas de la grille (mm), ou `null` si l'aimantation à la grille est désactivée. */
  grid: number | null
}

export interface LineSnapResult {
  /** Correction à ajouter au déplacement. */
  dx: number
  dy: number
  guides: Guide[]
}

export const EMPTY_SNAP_LINES: SnapLines = { xs: [], ys: [] }

/** Tolérance pour dire qu'un segment est horizontal ou vertical, en mm. */
const AXIS_ALIGNED = 0.5
/** Deux lignes à moins de ce écart sont confondues (guides). */
const SAME_POSITION = 0.01

/** Bords et centre d'une boîte, plus ses bords rentrés de chaque valeur de `insets`. */
export function boxSnapLines(box: Box, insets: readonly number[] = []): SnapLines {
  const xs = [box.x, box.x + box.width / 2, box.x + box.width]
  const ys = [box.y, box.y + box.height / 2, box.y + box.height]
  for (const inset of insets) {
    xs.push(box.x + inset, box.x + box.width - inset)
    ys.push(box.y + inset, box.y + box.height - inset)
  }
  return { xs, ys }
}

/** Axe et deux faces de chaque segment horizontal ou vertical d'un mur, plus son emprise. */
function wallLines(points: readonly number[], thickness: number, bounds: Box | null): SnapLines {
  const lines: SnapLines = bounds ? boxSnapLines(bounds) : { xs: [], ys: [] }
  const half = thickness / 2
  const vertices = toPoints(points)
  for (let i = 0; i + 1 < vertices.length; i++) {
    const a = vertices[i]
    const b = vertices[i + 1]
    if (Math.abs(a.x - b.x) <= AXIS_ALIGNED && Math.abs(a.y - b.y) > AXIS_ALIGNED) {
      lines.xs.push(a.x - half, a.x, a.x + half)
    } else if (Math.abs(a.y - b.y) <= AXIS_ALIGNED && Math.abs(a.x - b.x) > AXIS_ALIGNED) {
      lines.ys.push(a.y - half, a.y, a.y + half)
    }
  }
  return lines
}

/** Lignes d'aimantation d'un élément (vide pour une ouverture, une cote ou une ligne de coupe). */
export function elementSnapLines(element: CanvasElement): SnapLines {
  switch (element.type) {
    case 'opening':
    case 'dimension':
    case 'section':
      return { xs: [], ys: [] }
    case 'wall':
      return wallLines(element.points, element.thickness, elementBounds(element))
    case 'room':
    case 'platform': {
      const vertices = toPoints(element.points)
      return { xs: vertices.map((p) => p.x), ys: vertices.map((p) => p.y) }
    }
    case 'axis': {
      const [ax, ay, bx, by] = element.points
      if (Math.abs(ax - bx) <= AXIS_ALIGNED) return { xs: [ax], ys: [] }
      if (Math.abs(ay - by) <= AXIS_ALIGNED) return { xs: [], ys: [ay] }
      return { xs: [], ys: [] }
    }
    default: {
      const bounds = elementBounds(element)
      return bounds ? boxSnapLines(bounds) : { xs: [], ys: [] }
    }
  }
}

/** Réunit plusieurs jeux de lignes. */
export function mergeSnapLines(...sets: readonly SnapLines[]): SnapLines {
  return { xs: sets.flatMap((set) => set.xs), ys: sets.flatMap((set) => set.ys) }
}

/** Lignes de tous les éléments visibles, sauf ceux de `exclude`. */
export function collectSnapLines(
  elements: readonly CanvasElement[],
  exclude: ReadonlySet<string> = new Set(),
): SnapLines {
  return mergeSnapLines(
    ...elements
      .filter((element) => !element.hidden && !exclude.has(element.id))
      .map(elementSnapLines),
  )
}

/**
 * Lignes d'un groupe d'éléments déplacés ensemble : un seul élément donne ses propres lignes ;
 * plusieurs donnent l'emprise commune (bords et centre) et les lignes de leurs murs, pièces et
 * plateformes (le mobilier intérieur d'une pièce n'attire pas le groupe).
 */
export function movingSnapLines(elements: readonly CanvasElement[]): SnapLines {
  if (elements.length === 1) return elementSnapLines(elements[0])
  const box = unionBoxes(
    elements.flatMap((element) => {
      const bounds = elementBounds(element)
      return bounds ? [bounds] : []
    }),
  )
  const structure = elements.filter(
    (element) => element.type === 'wall' || element.type === 'room' || element.type === 'platform',
  )
  return mergeSnapLines(box ? boxSnapLines(box) : EMPTY_SNAP_LINES, ...structure.map(elementSnapLines))
}

/** Plus petite correction qui amène une ligne mobile sur une cible, dans la tolérance (`null` sinon). */
function bestDelta(lines: readonly number[], targets: readonly number[], threshold: number): number | null {
  let best: number | null = null
  for (const line of lines) {
    for (const target of targets) {
      const delta = target - line
      if (Math.abs(delta) <= threshold && (best === null || Math.abs(delta) < Math.abs(best))) {
        best = delta
      }
    }
  }
  return best
}

function gridDelta(value: number, grid: number | null): number {
  return grid !== null && grid > 0 ? Math.round(value / grid) * grid - value : 0
}

function alignedPositions(lines: readonly number[], targets: readonly number[]): number[] {
  const found = new Set<number>()
  for (const target of targets) {
    if (lines.some((line) => Math.abs(line - target) < SAME_POSITION)) found.add(target)
  }
  return [...found]
}

/**
 * Aimantation de lignes mobiles sur des lignes cibles. Sur chaque axe : la cible la plus proche
 * dans la tolérance gagne (un guide est affiché) ; sinon `anchor` (en général le coin haut-gauche
 * de l'emprise) est aimanté à la grille. La correction amène `anchor` sur un mm entier.
 */
export function snapLinesTo(
  moving: SnapLines,
  anchor: Point,
  snap: PlacementSnap,
): LineSnapResult {
  const toTargetX = bestDelta(moving.xs, snap.targets.xs, snap.threshold)
  const toTargetY = bestDelta(moving.ys, snap.targets.ys, snap.threshold)
  let dx = toTargetX ?? gridDelta(anchor.x, snap.grid)
  let dy = toTargetY ?? gridDelta(anchor.y, snap.grid)
  // L'emprise posée ou déplacée reste en mm entiers.
  dx = Math.round(anchor.x + dx) - anchor.x
  dy = Math.round(anchor.y + dy) - anchor.y

  const guides: Guide[] = []
  if (toTargetX !== null) {
    const shifted = moving.xs.map((x) => x + dx)
    for (const position of alignedPositions(shifted, snap.targets.xs)) {
      guides.push({ orientation: 'vertical', position })
    }
  }
  if (toTargetY !== null) {
    const shifted = moving.ys.map((y) => y + dy)
    for (const position of alignedPositions(shifted, snap.targets.ys)) {
      guides.push({ orientation: 'horizontal', position })
    }
  }
  return { dx, dy, guides }
}

export interface SnappedBox {
  /** Coin haut-gauche aimanté, en mm entiers. */
  x: number
  y: number
  guides: Guide[]
}

/**
 * Pose d'une emprise rectangulaire : ses bords et son centre (et ses bords rentrés de `insets`,
 * par exemple l'axe et la face intérieure d'un mur) s'aimantent aux cibles ; sinon son coin
 * haut-gauche s'aimante à la grille.
 */
export function snapBox(box: Box, snap: PlacementSnap, insets: readonly number[] = []): SnappedBox {
  const { dx, dy, guides } = snapLinesTo(boxSnapLines(box, insets), box, snap)
  return { x: box.x + dx, y: box.y + dy, guides }
}

/** Aimantation à la grille seule (sans cible), pour garder les anciens appels simples. */
export function gridOnly(grid: number | null): PlacementSnap {
  return { targets: EMPTY_SNAP_LINES, threshold: 0, grid }
}
