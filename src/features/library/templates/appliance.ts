import { circle, line, polygon, rect } from '../primitives'
import type { Primitive } from '../types'
import { corner, countFor, edge, type DrawFn } from './common'

/** Appareils vus de dessus (façade vers le bas). */
export type ApplianceKind =
  | 'fridge'
  | 'fridge-side'
  | 'chest'
  | 'dishwasher'
  | 'wine'
  | 'microwave'
  | 'oven'
  | 'washer'
  | 'dryer'
  | 'column'
  | 'boiler'
  | 'softener'
  | 'vmc'
  | 'hood'

export function appliance(kind: ApplianceKind): DrawFn {
  return (w, d) => {
    const r = corner(w, d, 0.05, 30)
    const e = edge(w, d, 30)
    const front = Math.max(e, d * 0.1)
    const out: Primitive[] = [rect(0, 0, w, d, 'outline', r)]
    const cx = w / 2
    const cy = d / 2
    const m = Math.min(w, d)
    switch (kind) {
      case 'fridge':
        out.push(line([e, d - front, w - e, d - front], 'detail'), line([w * 0.7, d - front * 0.5, w * 0.9, d - front * 0.5], 'detail'))
        break
      case 'fridge-side':
        out.push(
          line([e, d - front, w - e, d - front], 'detail'),
          line([cx, d - front, cx, d], 'detail'),
          line([cx - w * 0.08, d - front * 0.5, cx - w * 0.02, d - front * 0.5], 'detail'),
          line([cx + w * 0.02, d - front * 0.5, cx + w * 0.08, d - front * 0.5], 'detail'),
        )
        break
      case 'chest':
        out.push(rect(e, e, w - e * 2, d - e * 2, 'detail', r / 2), line([w * 0.4, d - e * 2.5, w * 0.6, d - e * 2.5], 'detail'))
        break
      case 'dishwasher':
        out.push(rect(e, d - front * 1.6, w - e * 2, front * 1.2, 'detail', 6), line([e, d * 0.5, w - e, d * 0.5], 'detail'))
        break
      case 'wine': {
        out.push(line([e, d - front, w - e, d - front], 'detail'))
        const n = countFor(w, 120, 3)
        for (let i = 1; i < n; i++) out.push(line([(w * i) / n, e, (w * i) / n, d - front], 'detail'))
        break
      }
      case 'microwave':
      case 'oven':
        out.push(rect(e, e, w * 0.65, d - e * 2, 'detail', 6), circle(w * 0.84, cy, Math.min(w * 0.07, d * 0.2), 'detail'))
        break
      case 'washer':
        out.push(circle(cx, d * 0.56, m * 0.32, 'detail'), circle(cx, d * 0.56, m * 0.2, 'detail'), line([e, d * 0.14, w * 0.5, d * 0.14], 'detail'))
        break
      case 'dryer':
        out.push(circle(cx, d * 0.56, m * 0.32, 'detail'), line([e, d * 0.14, w * 0.5, d * 0.14], 'detail'), line([cx - m * 0.18, d * 0.56, cx + m * 0.18, d * 0.56], 'detail'))
        break
      case 'column':
        out.push(circle(cx, d * 0.3, m * 0.24, 'detail'), circle(cx, d * 0.72, m * 0.24, 'detail'), line([e, d * 0.5, w - e, d * 0.5], 'detail'))
        break
      case 'boiler':
        out.push(circle(cx, cy, m * 0.25, 'detail'), rect(w * 0.25, d - front * 1.4, w * 0.5, front, 'detail', 4))
        break
      case 'softener':
        out.push(circle(cx, cy, m * 0.28, 'detail'), line([e, d - front, w - e, d - front], 'detail'))
        break
      case 'vmc':
        out.push(line([0, 0, w, d], 'detail'), line([0, d, w, 0], 'detail'), circle(cx, cy, m * 0.18, 'detail'))
        break
      case 'hood':
        out.push(rect(e, e, w - e * 2, d - e * 2, 'detail', 6), line([e, e, w - e, d - e], 'detail'), line([e, d - e, w - e, e], 'detail'))
        break
    }
    return out
  }
}

/** Table à repasser : plateau à bout pointu et nervure centrale. */
export const ironingBoard: DrawFn = (w, d) => [
  polygon([0, 0, w * 0.72, 0, w, d / 2, w * 0.72, d, 0, d], 'outline'),
  line([w * 0.08, d / 2, w * 0.82, d / 2], 'detail'),
]

/** Séchoir à linge : cadre et barres régulières. */
export const dryingRack: DrawFn = (w, d) => {
  const out: Primitive[] = [rect(0, 0, w, d, 'outline', 10)]
  const n = countFor(w, 90, 4)
  for (let i = 1; i < n; i++) out.push(line([(w * i) / n, d * 0.08, (w * i) / n, d * 0.92], 'detail'))
  return out
}
