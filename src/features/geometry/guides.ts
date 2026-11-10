import type { Box } from './box'

export interface Guide {
  orientation: 'vertical' | 'horizontal'
  /** Position dans le document : abscisse d'un guide vertical, ordonnée d'un guide horizontal. */
  position: number
}

export interface SnapResult {
  /** Correction à ajouter au déplacement pour aligner la boîte. */
  dx: number
  dy: number
  guides: Guide[]
}

const SAME_POSITION = 0.001

/** Bord gauche, centre et bord droit (ou haut, milieu, bas) d'une boîte. */
function xLines(box: Box): number[] {
  return [box.x, box.x + box.width / 2, box.x + box.width]
}

function yLines(box: Box): number[] {
  return [box.y, box.y + box.height / 2, box.y + box.height]
}

/** Plus petite correction (en valeur absolue) qui amène une ligne sur une cible, dans la tolérance. */
function bestDelta(lines: number[], targets: number[], threshold: number): number {
  let best: number | null = null
  for (const line of lines) {
    for (const target of targets) {
      const delta = target - line
      if (Math.abs(delta) <= threshold && (best === null || Math.abs(delta) < Math.abs(best))) {
        best = delta
      }
    }
  }
  return best ?? 0
}

/** Positions des cibles qui coïncident avec une ligne de la boîte déplacée. */
function alignedPositions(lines: number[], targets: number[]): number[] {
  const found = new Set<number>()
  for (const target of targets) {
    if (lines.some((line) => Math.abs(line - target) < SAME_POSITION)) found.add(target)
  }
  return [...found]
}

/**
 * Aimantation d'une boîte en cours de déplacement sur les bords et les centres des autres boîtes
 * (éléments voisins, page). `threshold` est la distance d'accroche, dans l'unité du document.
 */
export function computeSnap(moving: Box, targets: readonly Box[], threshold: number): SnapResult {
  const targetX = targets.flatMap(xLines)
  const targetY = targets.flatMap(yLines)

  const dx = bestDelta(xLines(moving), targetX, threshold)
  const dy = bestDelta(yLines(moving), targetY, threshold)

  const snapped = { ...moving, x: moving.x + dx, y: moving.y + dy }
  const guides: Guide[] = [
    ...alignedPositions(xLines(snapped), targetX).map(
      (position): Guide => ({ orientation: 'vertical', position }),
    ),
    ...alignedPositions(yLines(snapped), targetY).map(
      (position): Guide => ({ orientation: 'horizontal', position }),
    ),
  ]
  return { dx, dy, guides }
}
