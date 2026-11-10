import { line, rect } from '../primitives'
import type { Primitive } from '../types'

/** Lit superposé : contour, deux montants d'angle et échelle au pied (barreaux). */
export function drawBunkBed(width: number, depth: number): Primitive[] {
  const post = Math.min(60, width * 0.08)
  const out: Primitive[] = [
    rect(0, 0, width, depth, 'outline', 30),
    rect(post, post, width - post * 2, depth - post * 2, 'detail', 20),
    rect(0, 0, post, post, 'detail'),
    rect(width - post, 0, post, post, 'detail'),
    rect(0, depth - post, post, post, 'detail'),
    rect(width - post, depth - post, post, post, 'detail'),
  ]
  // Échelle : deux montants et des barreaux sur le côté droit, vers le pied.
  const ladderLeft = width - post - Math.min(260, width * 0.3)
  const ladderTop = depth * 0.55
  const ladderBottom = depth - post - 20
  out.push(rect(ladderLeft, ladderTop, width - post - ladderLeft, ladderBottom - ladderTop, 'detail'))
  const rungs = Math.max(3, Math.round((ladderBottom - ladderTop) / 250))
  for (let i = 1; i < rungs; i++) {
    const y = ladderTop + ((ladderBottom - ladderTop) * i) / rungs
    out.push(line([ladderLeft, y, width - post, y], 'detail'))
  }
  return out
}

/** Lit bébé : contour et barreaux réguliers sur les quatre côtés du cadre. */
export function drawCrib(width: number, depth: number): Primitive[] {
  const e = Math.min(40, width * 0.08)
  const out: Primitive[] = [rect(0, 0, width, depth, 'outline', 30), rect(e, e, width - e * 2, depth - e * 2, 'detail', 20)]
  const bars = Math.max(3, Math.round((depth - e * 2) / 90))
  for (let i = 1; i < bars; i++) {
    const y = e + ((depth - e * 2) * i) / bars
    out.push(line([0, y, e, y], 'detail'), line([width - e, y, width, y], 'detail'))
  }
  return out
}

/**
 * Lit vu de dessus : tête de lit en haut, pied en bas (face avant vers le bas).
 * Matelas, un oreiller (lit étroit) ou deux (lit large) et pli de la couette.
 */
export function drawBed(width: number, depth: number): Primitive[] {
  const frame = Math.min(40, width * 0.05)
  const head = Math.min(70, depth * 0.04)
  const mattressTop = head + 10
  const mattressWidth = width - frame * 2
  const mattressHeight = depth - mattressTop - frame

  const pillowHeight = Math.min(360, depth * 0.18)
  const pillowGap = 40
  const pillowTop = mattressTop + 50
  const twoPillows = width >= 1200
  const pillowWidth = twoPillows
    ? (mattressWidth - pillowGap * 3) / 2
    : mattressWidth - pillowGap * 2

  const primitives: Primitive[] = [
    rect(0, 0, width, depth, 'outline', 40),
    rect(frame, mattressTop, mattressWidth, mattressHeight, 'detail', 30),
  ]
  if (twoPillows) {
    primitives.push(
      rect(frame + pillowGap, pillowTop, pillowWidth, pillowHeight, 'detail', 50),
      rect(frame + pillowGap * 2 + pillowWidth, pillowTop, pillowWidth, pillowHeight, 'detail', 50),
    )
  } else {
    primitives.push(rect(frame + pillowGap, pillowTop, pillowWidth, pillowHeight, 'detail', 50))
  }
  // Pli de la couette, au tiers de la longueur du lit.
  const fold = pillowTop + pillowHeight + (depth - pillowTop - pillowHeight) * 0.18
  primitives.push(line([frame, fold, width - frame, fold], 'detail'))
  return primitives
}
