import { circle, line, polygon, rect } from '../primitives'
import type { Primitive } from '../types'
import { corner, edge, type DrawFn } from './common'

/** Poste de travail vu de dessus : plateau, écran(s) contre le fond et clavier(s) devant. `sets` = nombre de postes (1 ou 2). */
export function desk(sets: 1 | 2 = 1, executive = false): DrawFn {
  return (w, d) => {
    const e = edge(w, d, 50)
    const out: Primitive[] = [rect(0, 0, w, d, 'outline', corner(w, d, 0.04, 30)), rect(e, e, w - e * 2, d - e * 2, 'detail', 10)]
    if (executive) out.push(rect(e * 2, e * 2, w - e * 4, d - e * 4, 'detail', 8))
    const cell = w / sets
    for (let i = 0; i < sets; i++) {
      const cx = cell * (i + 0.5)
      const monitor = Math.min(550, cell * 0.45)
      out.push(rect(cx - monitor / 2, d * 0.1, monitor, Math.min(40, d * 0.06), 'detail', 4))
      const keyboard = Math.min(450, cell * 0.34)
      out.push(rect(cx - keyboard / 2, d * 0.42, keyboard, Math.min(140, d * 0.2), 'detail', 6))
    }
    return out
  }
}

/** Bureau d'angle en L (le retour est à gauche ; « Retourner » le met à droite). */
export const cornerDesk: DrawFn = (w, d) => {
  const arm = Math.min(700, w * 0.45, d * 0.45)
  return [
    polygon([0, 0, w, 0, w, arm, arm, arm, arm, d, 0, d], 'outline'),
    rect(w * 0.45, arm * 0.2, Math.min(500, w * 0.3), Math.min(40, arm * 0.1), 'detail', 4),
    rect(w * 0.48, arm * 0.5, Math.min(420, w * 0.25), Math.min(120, arm * 0.2), 'detail', 6),
    line([arm, arm, arm, 0], 'detail'),
  ]
}

/** Imprimante, photocopieur : caisson, capot et bac papier en façade. */
export const printer: DrawFn = (w, d) => {
  const e = edge(w, d, 30)
  return [
    rect(0, 0, w, d, 'outline', corner(w, d, 0.06, 30)),
    rect(e, e, w - e * 2, d * 0.5, 'detail', 6),
    rect(e, d - d * 0.28, w - e * 2, d * 0.2, 'detail', 4),
  ]
}

/** Cabine isolée (phone box) : cloisons, assise et table. */
export const phoneBooth: DrawFn = (w, d) => [
  rect(0, 0, w, d, 'outline', 20),
  rect(w * 0.15, d * 0.1, w * 0.7, d * 0.18, 'detail', 8),
  circle(w / 2, d * 0.62, Math.min(w, d) * 0.18, 'detail'),
]

/** Coin détente : deux fauteuils face à face et une table basse ronde. */
export const lounge: DrawFn = (w, d) => {
  const seat = Math.min(w * 0.34, d * 0.34)
  const cy = d / 2
  return [
    rect(0, cy - seat / 2, seat, seat, 'outline', seat * 0.2),
    rect(w - seat, cy - seat / 2, seat, seat, 'outline', seat * 0.2),
    circle(w / 2, cy, Math.min(w, d) * 0.16, 'outline'),
  ]
}
