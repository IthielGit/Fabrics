import { circle, ellipse, ellipseArcPoints, line, polygon, rect } from '../primitives'
import type { Primitive } from '../types'
import { corner, countFor, edge, type DrawFn } from './common'

/** WC vu de dessus, mur en haut : réservoir (au sol et enfant) et cuvette ovale. `wall` : suspendu, réservoir encastré. */
export function toilet(kind: 'floor' | 'wall' | 'child'): DrawFn {
  return (w, d) => {
    const tank = d * (kind === 'floor' ? 0.28 : kind === 'child' ? 0.26 : 0.16)
    const out: Primitive[] = [rect(0, 0, w, tank, 'outline', corner(w, tank, 0.15, 25))]
    out.push(ellipse(w / 2, tank + (d - tank) / 2, w / 2, (d - tank) / 2, 'outline'))
    out.push(ellipse(w / 2, tank + (d - tank) * 0.52, w * 0.34, (d - tank) * 0.36, 'detail'))
    return out
  }
}

/** Urinoir : coque arrondie et siphon. */
export const urinal: DrawFn = (w, d) => [
  rect(0, 0, w, d, 'outline', Math.min(w, d) * 0.3),
  rect(w * 0.2, d * 0.15, w * 0.6, d * 0.55, 'detail', Math.min(w, d) * 0.2),
  circle(w / 2, d * 0.5, Math.min(w, d) * 0.06, 'detail'),
]

/** Bidet : cuvette ovale et robinet. */
export const bidet: DrawFn = (w, d) => [
  rect(0, 0, w, d * 0.18, 'outline', 15),
  ellipse(w / 2, d * 0.18 + (d * 0.82) / 2, w / 2, (d * 0.82) / 2, 'outline'),
  ellipse(w / 2, d * 0.6, w * 0.32, d * 0.28, 'detail'),
  circle(w / 2, d * 0.09, Math.min(w, d) * 0.04, 'detail'),
]

/** Lavabo : plan, une ou deux vasques ovales, robinet(s) contre le mur. */
export function washbasin(basins: 1 | 2 = 1): DrawFn {
  return (w, d) => {
    const e = edge(w, d, 40)
    const out: Primitive[] = [rect(0, 0, w, d, 'outline', corner(w, d, 0.12, 50))]
    const cellWidth = (w - e * 2) / basins
    for (let i = 0; i < basins; i++) {
      const cx = e + cellWidth * (i + 0.5)
      out.push(ellipse(cx, d * 0.58, cellWidth * 0.4, d * 0.32, 'detail'))
      out.push(circle(cx, d * 0.2, Math.min(12, d * 0.04), 'detail'))
    }
    return out
  }
}

/** Meuble vasque : caisson avec vasque ovale (plan de toilette). */
export const vanityUnit: DrawFn = (w, d) => [
  rect(0, 0, w, d, 'outline', corner(w, d, 0.05, 30)),
  ellipse(w / 2, d * 0.55, Math.min(w * 0.32, 230), d * 0.3, 'detail'),
  circle(w / 2, d * 0.16, Math.min(12, d * 0.04), 'detail'),
  line([edge(w, d), d * 0.88, w - edge(w, d), d * 0.88], 'detail'),
]

/** Douche : `square` (receveur carré / rectangulaire), `corner` (quart de rond, asymétrique), `walk-in` (italienne), `pmr` (siège et barre). */
export function shower(kind: 'square' | 'corner' | 'walk-in' | 'pmr'): DrawFn {
  return (w, d) => {
    const e = edge(w, d, 60)
    const out: Primitive[] = []
    if (kind === 'corner') {
      const arc = ellipseArcPoints(0, 0, w, d, 0, 90)
      out.push(polygon([0, 0, ...arc], 'outline'))
      out.push(circle(w * 0.3, d * 0.3, Math.min(w, d) * 0.05, 'detail'))
      out.push(line(ellipseArcPoints(0, 0, w * 0.93, d * 0.93, 0, 90), 'detail'))
      return out
    }
    out.push(rect(0, 0, w, d, 'outline', 20), rect(e, e, w - e * 2, d - e * 2, 'detail', 15))
    if (kind === 'walk-in') {
      // Caniveau le long du fond et paroi de verre partielle (pointillé) côté accès.
      out.push(line([e * 1.5, e * 1.4, w - e * 1.5, e * 1.4], 'detail'), line([0, d * 0.55, 0, d], 'above'))
    } else {
      out.push(circle(w / 2, d / 2, Math.min(w, d) * 0.05, 'detail'))
    }
    if (kind === 'pmr') {
      out.push(rect(w - e - Math.min(450, w * 0.4), e, Math.min(450, w * 0.4), Math.min(450, d * 0.4), 'detail', 10))
      out.push(line([e, e * 2, e, d - e * 2], 'detail'))
    }
    return out
  }
}

/** Baignoire : `rect`, `corner` (cuvette d'angle, asymétrique), `free` (îlot ovale), `small` (sabot). */
export function bathtub(kind: 'rect' | 'corner' | 'free' | 'small'): DrawFn {
  return (w, d) => {
    const e = Math.min(70, w * 0.06, d * 0.1)
    if (kind === 'corner') {
      return [
        polygon([0, 0, w, 0, w, d * 0.42, w * 0.42, d, 0, d], 'outline'),
        polygon([e, e, w - e, e, w - e, d * 0.4, w * 0.4, d - e, e, d - e], 'detail'),
        circle(w * 0.2, d * 0.2, Math.min(w, d) * 0.04, 'detail'),
      ]
    }
    const round = kind === 'free' ? Math.min(w, d) / 2 : Math.min(120, d * 0.3)
    const out: Primitive[] = [rect(0, 0, w, d, 'outline', round), rect(e, e, w - e * 2, d - e * 2, 'detail', Math.max(round - e, 20))]
    out.push(circle(e * 2.2, d / 2, Math.min(22, d * 0.05), 'detail')) // bonde
    out.push(circle(w - e * 1.2, d / 2, Math.min(16, d * 0.04), 'detail')) // robinet
    return out
  }
}

/** Bain à remous : cuve et buses (cercles). */
export const whirlpool: DrawFn = (w, d) => {
  const e = Math.min(80, w * 0.06, d * 0.06)
  const out: Primitive[] = [rect(0, 0, w, d, 'outline', Math.min(w, d) * 0.12), rect(e, e, w - e * 2, d - e * 2, 'detail', Math.min(w, d) * 0.1)]
  const jets = 6
  for (let i = 0; i < jets; i++) {
    const a = (i / jets) * Math.PI * 2
    out.push(circle(w / 2 + Math.cos(a) * w * 0.28, d / 2 + Math.sin(a) * d * 0.28, Math.min(w, d) * 0.03, 'detail'))
  }
  return out
}

/** Cabine de bien-être (sauna, hammam) : pièce, banquettes en gradins et poêle / bouche de vapeur. */
export function wellness(kind: 'sauna' | 'hammam'): DrawFn {
  return (w, d) => {
    const bench = Math.min(500, w * 0.25)
    const out: Primitive[] = [rect(0, 0, w, d, 'outline', 10), rect(0, 0, w, bench, 'detail'), rect(0, 0, bench, d, 'detail')]
    if (kind === 'sauna') {
      out.push(rect(0, 0, w, bench * 0.5, 'detail'), circle(w - bench * 0.6, d - bench * 0.6, Math.min(w, d) * 0.06, 'detail'))
    } else {
      out.push(circle(w - bench * 0.6, d - bench * 0.6, Math.min(w, d) * 0.04, 'detail'), line([w * 0.3, d - bench * 0.4, w * 0.5, d - bench * 0.4], 'detail'))
    }
    return out
  }
}

/** Sèche-serviettes : barre fine et traverses régulières. */
export const towelRadiator: DrawFn = (w, d) => {
  const out: Primitive[] = [rect(0, 0, w, d, 'outline', Math.min(d / 2, 15))]
  const n = countFor(w, 100, 3)
  for (let i = 1; i < n; i++) out.push(line([(w * i) / n, 0, (w * i) / n, d], 'detail'))
  return out
}

/** Barre d'appui : barre fine avec deux fixations aux extrémités. */
export const grabBar: DrawFn = (w, d) => [
  rect(0, 0, w, d, 'outline', d / 2),
  circle(d, d / 2, d * 0.28, 'detail'),
  circle(w - d, d / 2, d * 0.28, 'detail'),
]

/** Siège de douche rabattable : assise et deux charnières. */
export const showerSeat: DrawFn = (w, d) => [
  rect(0, 0, w, d, 'outline', 20),
  line([w * 0.1, d * 0.12, w * 0.9, d * 0.12], 'detail'),
  rect(w * 0.1, d * 0.2, w * 0.8, d * 0.68, 'detail', 15),
]

/** WC accessible PMR : WC, barre d'appui à gauche (rabattable) et barre au fond (asymétrique). */
export const toiletPmr: DrawFn = (w, d) => {
  const bowlWidth = Math.min(400, w * 0.5)
  const x0 = w - bowlWidth - Math.min(80, w * 0.05)
  const bar = Math.min(40, d * 0.06)
  return [
    rect(0, 0, w, d, 'soft'),
    ...toilet('floor')(bowlWidth, d).map((p) => moveBy(p, x0, 0)),
    rect(w * 0.04, d * 0.05, bar, d * 0.5, 'outline', bar / 2),
    rect(x0 - bar * 1.5, d * 0.05, w - x0 + bar * 1.5 - 4, bar, 'outline', bar / 2),
  ]
}

function moveBy(p: Primitive, dx: number, dy: number): Primitive {
  switch (p.kind) {
    case 'rect':
      return { ...p, x: p.x + dx, y: p.y + dy }
    case 'circle':
    case 'ellipse':
    case 'arc':
      return { ...p, cx: p.cx + dx, cy: p.cy + dy }
    case 'line':
    case 'polygon':
      return { ...p, points: p.points.map((v, i) => v + (i % 2 === 0 ? dx : dy)) }
  }
}

/** Cabine de sanitaires : cloisons, WC et débattement de la porte. */
export const toiletCubicle: DrawFn = (w, d) => {
  const wc = toilet('floor')(Math.min(w * 0.45, 400), Math.min(d * 0.5, 700))
  const door = Math.min(w * 0.8, d * 0.5)
  return [
    rect(0, 0, w, d, 'outline', 10),
    ...wc.map((p) => moveBy(p, (w - Math.min(w * 0.45, 400)) / 2, d * 0.04)),
    line([w - door - 20, d, w - 20, d], 'detail'),
    line(ellipseArcPoints(w - 20, d, door, door, 180, 270), 'detail'),
  ]
}

/** Panier à linge, poubelle sanitaire : cercle et anneau. */
export const basket: DrawFn = (w, d) => [
  rect(0, 0, w, d, 'outline', Math.min(w, d) * 0.3),
  rect(w * 0.12, d * 0.12, w * 0.76, d * 0.76, 'detail', Math.min(w, d) * 0.22),
]
