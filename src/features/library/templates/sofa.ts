import { line, polygon, rect } from '../primitives'
import type { Primitive } from '../types'
import { countFor, type DrawFn } from './common'

/**
 * Canapé en L vu de dessus (le retour est à gauche ; « Retourner » le met à droite) :
 * - `corner` : dossier en haut et le long du retour (canapé d'angle) ;
 * - `chaise` : dossier en haut seulement, le retour est une méridienne.
 * `returnRatio` = largeur du retour / largeur totale.
 */
export function sofaL(kind: 'corner' | 'chaise', returnRatio = 0.38): DrawFn {
  return (w, d) => {
    const run = Math.min(d * 0.6, 950) // profondeur de la partie principale
    const rw = Math.min(w * returnRatio, 950) // largeur du retour
    const back = Math.min(200, run * 0.25)
    const arm = Math.min(180, w * 0.1)
    const gap = Math.min(30, d * 0.04)

    const out: Primitive[] = [
      polygon([0, 0, w, 0, w, run, rw, run, rw, d, 0, d], 'outline'),
      rect(0, 0, w, back, 'detail', 40),
      rect(w - arm, back, arm, run - back, 'detail', 40),
    ]
    if (kind === 'corner') out.push(rect(0, back, back, d - back, 'detail', 40))
    const seatLeft = kind === 'corner' ? back : 0
    // Assise principale (à droite du retour) en coussins.
    const mainWidth = w - rw - arm
    const n = countFor(mainWidth, 600)
    for (let i = 0; i < n; i++) {
      out.push(rect(rw + (mainWidth * i) / n + 8, back + 8, mainWidth / n - 16, run - back - gap - 8, 'detail', 30))
    }
    // Assise du retour (coin et méridienne).
    out.push(rect(seatLeft + 8, back + 8, rw - seatLeft - 16, run - back - gap - 8, 'detail', 30))
    out.push(rect(seatLeft + 8, run + 8, rw - seatLeft - 16, d - run - gap - 8, 'detail', 30))
    out.push(line([rw, back, rw, run], 'detail'))
    return out
  }
}

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
