import { line, rect } from '../primitives'
import type { Primitive } from '../types'

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
