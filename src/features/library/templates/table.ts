import { circle } from '../primitives'
import type { Primitive } from '../types'

/** Table ronde vue de dessus : un plateau circulaire inscrit dans la boîte, et un liseré intérieur. */
export function drawRoundTable(width: number, depth: number): Primitive[] {
  const radius = Math.min(width, depth) / 2
  const cx = width / 2
  const cy = depth / 2
  return [circle(cx, cy, radius, 'outline'), circle(cx, cy, Math.max(radius - 60, radius * 0.8), 'detail')]
}
