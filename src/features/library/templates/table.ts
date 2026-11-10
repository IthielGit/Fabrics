import { circle, ellipse, rect } from '../primitives'
import type { Primitive } from '../types'
import { corner, edge } from './common'

/** Table ronde vue de dessus : un plateau circulaire inscrit dans la boîte, et un liseré intérieur. */
export function drawRoundTable(width: number, depth: number): Primitive[] {
  const radius = Math.min(width, depth) / 2
  const cx = width / 2
  const cy = depth / 2
  return [circle(cx, cy, radius, 'outline'), circle(cx, cy, Math.max(radius - 60, radius * 0.8), 'detail')]
}

/** Objet circulaire (pouf, tabouret, poêle…) : disque et anneau intérieur proportionnel. */
export function drawRound(width: number, depth: number): Primitive[] {
  const radius = Math.min(width, depth) / 2
  const cx = width / 2
  const cy = depth / 2
  return [circle(cx, cy, radius, 'outline'), circle(cx, cy, radius * 0.7, 'detail')]
}

/** Table rectangulaire ou carrée : plateau et liseré. */
export function drawRectTable(width: number, depth: number): Primitive[] {
  const e = edge(width, depth, 50)
  const r = corner(width, depth, 0.05, 40)
  return [rect(0, 0, width, depth, 'outline', r), rect(e, e, width - e * 2, depth - e * 2, 'detail', r / 2)]
}

/** Table ovale : plateau elliptique et liseré. */
export function drawOvalTable(width: number, depth: number): Primitive[] {
  const cx = width / 2
  const cy = depth / 2
  const inset = Math.min(60, width * 0.1, depth * 0.1)
  return [ellipse(cx, cy, cx, cy, 'outline'), ellipse(cx, cy, cx - inset, cy - inset, 'detail')]
}
