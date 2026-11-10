import { line, rect } from '../primitives'
import type { Primitive } from '../types'

/**
 * Canapé droit vu de dessus : dossier en haut, face avant vers le bas. Deux accoudoirs et des
 * coussins d'assise (1 de 0 à 1 399 mm, 2 jusqu'à 1 999 mm, 3 au-delà).
 */
export function drawSofa(width: number, depth: number): Primitive[] {
  const arm = Math.min(180, width * 0.12)
  const back = depth * 0.28
  const seatLeft = arm
  const seatWidth = width - arm * 2
  const seatTop = back
  const seatHeight = depth - back - Math.min(30, depth * 0.04)
  const cushions = width >= 2000 ? 3 : width >= 1400 ? 2 : 1

  const primitives: Primitive[] = [
    rect(0, 0, width, depth, 'outline', 70),
    rect(0, 0, width, back, 'detail', 60),
    rect(0, 0, arm, depth, 'detail', 60),
    rect(width - arm, 0, arm, depth, 'detail', 60),
  ]
  const cushionWidth = seatWidth / cushions
  for (let i = 0; i < cushions; i++) {
    primitives.push(rect(seatLeft + i * cushionWidth + 10, seatTop + 10, cushionWidth - 20, seatHeight - 10, 'detail', 40))
  }
  // Ligne de couture entre le dossier et l'assise.
  primitives.push(line([arm, back, width - arm, back], 'detail'))
  return primitives
}
