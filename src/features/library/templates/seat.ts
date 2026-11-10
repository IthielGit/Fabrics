import { circle, line, rect } from '../primitives'
import type { Primitive } from '../types'
import { corner, edge, type DrawFn } from './common'

/**
 * Siège vu de dessus, dossier en haut :
 * - `chair` : assise et dossier ; `arm` : avec accoudoirs ;
 * - `armchair` : fauteuil (gros dossier et accoudoirs) ; `wing` : à oreilles (dossier plus épais).
 */
export type SeatKind = 'chair' | 'arm' | 'armchair' | 'wing'

export function seat(kind: SeatKind): DrawFn {
  return (w, d) => {
    const r = corner(w, d, 0.12, 70)
    const out: Primitive[] = [rect(0, 0, w, d, 'outline', r)]
    const back = d * (kind === 'chair' ? 0.18 : kind === 'arm' ? 0.2 : kind === 'armchair' ? 0.26 : 0.32)
    out.push(rect(0, 0, w, back, 'detail', r))
    if (kind === 'chair') {
      out.push(rect(w * 0.08, back + d * 0.04, w * 0.84, d - back - d * 0.08, 'detail', r / 2))
      return out
    }
    const armWidth = w * (kind === 'arm' ? 0.1 : 0.17)
    out.push(rect(0, back, armWidth, d - back, 'detail', r / 2), rect(w - armWidth, back, armWidth, d - back, 'detail', r / 2))
    out.push(rect(armWidth + 8, back + 8, w - armWidth * 2 - 16, d - back - 24, 'detail', r / 2))
    return out
  }
}

/** Fauteuil de bureau : assise ronde et étoile à cinq branches. */
export function drawOfficeChair(w: number, d: number): Primitive[] {
  const radius = Math.min(w, d) / 2
  const cx = w / 2
  const cy = d / 2
  const out: Primitive[] = [circle(cx, cy, radius, 'outline'), circle(cx, cy, radius * 0.55, 'detail')]
  for (let i = 0; i < 5; i++) {
    const a = (-90 + i * 72) * (Math.PI / 180)
    out.push(line([cx, cy, cx + Math.cos(a) * radius * 0.92, cy + Math.sin(a) * radius * 0.92], 'detail'))
  }
  return out
}

/** Banc : assise longue avec liseré. */
export function drawBench(w: number, d: number): Primitive[] {
  const e = edge(w, d, 30)
  return [rect(0, 0, w, d, 'outline', corner(w, d, 0.1, 30)), rect(e, e, w - e * 2, d - e * 2, 'detail', 8)]
}
