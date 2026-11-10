import { line, rect } from '../primitives'
import type { Primitive } from '../types'
import { corner, countFor, edge, type DrawFn } from './common'

/**
 * Aspect d'un meuble caisson vu de dessus (face avant vers le bas) :
 * - `plain` : un simple contour ;
 * - `top` : plateau (liseré intérieur) ;
 * - `drawers` : plateau et arête de façade (tiroirs) ;
 * - `doors` : arête de façade et séparations de portes (une porte tous les ~450 mm) ;
 * - `shelves` : compartiments verticaux (un tous les ~300 mm) ;
 * - `open` : cadre ouvert avec une barre centrale (dressing, rack) ;
 * - `cross` : croix (meuble haut ou colonne).
 */
export type BoxKind = 'plain' | 'top' | 'drawers' | 'doors' | 'shelves' | 'open' | 'cross'

export function box(kind: BoxKind): DrawFn {
  return (w, d) => {
    const r = corner(w, d)
    const e = edge(w, d)
    const front = Math.max(e, d * 0.12)
    const out: Primitive[] = [rect(0, 0, w, d, 'outline', r)]
    switch (kind) {
      case 'plain':
        break
      case 'top':
        out.push(rect(e, e, w - e * 2, d - e * 2, 'detail', r / 2))
        break
      case 'drawers':
        out.push(rect(e, e, w - e * 2, d - e * 2, 'detail', r / 2), line([e, d - front, w - e, d - front], 'detail'))
        break
      case 'doors': {
        out.push(line([0, d - front, w, d - front], 'detail'))
        const n = countFor(w, 450)
        for (let i = 1; i < n; i++) out.push(line([(w * i) / n, d - front, (w * i) / n, d], 'detail'))
        break
      }
      case 'shelves': {
        out.push(rect(e, e, w - e * 2, d - e * 2, 'detail', r / 2))
        const n = countFor(w, 300)
        for (let i = 1; i < n; i++) out.push(line([(w * i) / n, e, (w * i) / n, d - e], 'detail'))
        break
      }
      case 'open':
        out.push(rect(e * 1.5, e * 1.5, w - e * 3, d - e * 3, 'detail', r / 2), line([e * 1.5, d / 2, w - e * 1.5, d / 2], 'detail'))
        break
      case 'cross':
        out.push(line([0, 0, w, d], 'detail'), line([0, d, w, 0], 'detail'))
        break
    }
    return out
  }
}

/** Élément mural mince (étagère, barre de portemanteaux) : contour et crochets / repères régulièrement espacés. */
export function wallStrip(markEvery = 250): DrawFn {
  return (w, d) => {
    const out: Primitive[] = [rect(0, 0, w, d, 'outline', corner(w, d, 0.2, 20))]
    const n = countFor(w, markEvery)
    const y = d / 2
    for (let i = 0; i < n; i++) {
      const x = (w * (i + 0.5)) / n
      out.push(line([x, y - d * 0.15, x, y + d * 0.15], 'detail'))
    }
    return out
  }
}
