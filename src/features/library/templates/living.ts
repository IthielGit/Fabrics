import { circle, ellipseArcPoints, line, polygon, rect } from '../primitives'
import { corner, edge, type DrawFn } from './common'

/** Piano droit : contour et clavier le long de la façade. */
export const drawUprightPiano: DrawFn = (w, d) => {
  const keys = Math.min(d * 0.35, 220)
  return [
    rect(0, 0, w, d, 'outline', corner(w, d, 0.05, 30)),
    rect(w * 0.04, d - keys, w * 0.92, keys, 'detail'),
    line([w * 0.04, d - keys * 0.45, w * 0.96, d - keys * 0.45], 'detail'),
  ]
}

/**
 * Piano à queue : clavier en bas, flanc gauche droit, côté droit en courbe jusqu'à la queue
 * (asymétrique : « Retourner » met la courbe à gauche).
 */
export const drawGrandPiano: DrawFn = (w, d) => {
  const keys = Math.min(d * 0.14, 220)
  const curve = ellipseArcPoints(w * 0.5, d * 0.5, w * 0.5, d * 0.5, 0, -90)
  return [
    polygon([0, d, w, d, ...curve, 0, d * 0.3], 'outline'),
    rect(w * 0.05, d - keys, w * 0.9, keys, 'detail'),
    line([w * 0.05, d - keys * 0.45, w * 0.95, d - keys * 0.45], 'detail'),
  ]
}

/** Tapis : bordure et motif central (zone de référence, pas un obstacle). */
export const drawRug: DrawFn = (w, d) => {
  const e = Math.min(80, w * 0.06, d * 0.06)
  return [rect(0, 0, w, d, 'outline', 20), rect(e, e, w - e * 2, d - e * 2, 'detail', 10), rect(e * 2, e * 2, w - e * 4, d - e * 4, 'detail', 10)]
}

/** Tapis rond : disque, bordure et anneau. */
export const drawRoundRug: DrawFn = (w, d) => {
  const r = Math.min(w, d) / 2
  const cx = w / 2
  const cy = d / 2
  return [circle(cx, cy, r, 'outline'), circle(cx, cy, r * 0.88, 'detail'), circle(cx, cy, r * 0.7, 'detail')]
}

/** Poêle à bois : caisson et conduit de fumée au centre. */
export const drawStove: DrawFn = (w, d) => {
  const r = Math.min(w, d)
  return [rect(0, 0, w, d, 'outline', corner(w, d, 0.1, 40)), circle(w / 2, d / 2, r * 0.18, 'detail'), line([w * 0.15, d * 0.85, w * 0.85, d * 0.85], 'detail')]
}

/** Cheminée : contour, foyer et seuil. */
export const drawFireplace: DrawFn = (w, d) => {
  const e = edge(w, d, 60)
  return [rect(0, 0, w, d, 'outline', 10), rect(e, e, w - e * 2, d * 0.6, 'detail', 6), line([0, d * 0.85, w, d * 0.85], 'detail')]
}

/** Plante, arbre ou arbuste : contour irrégulier (toujours le même) et petit cercle au centre. */
export const drawPlant: DrawFn = (w, d) => {
  const cx = w / 2
  const cy = d / 2
  const points: number[] = []
  const lobes = 14
  for (let k = 0; k < lobes * 2; k++) {
    const a = (k / (lobes * 2)) * Math.PI * 2
    // Rayon entre 80 % et 100 % : alternance régulière + petite variation déterministe.
    const wobble = 0.9 + 0.1 * Math.sin(k * 1.7) * (k % 2 === 0 ? 1 : 0.6)
    const scale = k % 2 === 0 ? 1 : 0.88
    points.push(cx + cx * Math.cos(a) * Math.min(1, scale * wobble), cy + cy * Math.sin(a) * Math.min(1, scale * wobble))
  }
  return [polygon(points, 'outline'), circle(cx, cy, Math.min(w, d) * 0.07, 'detail')]
}

/** Lampadaire ou objet ponctuel : cercle et croix. */
export const drawPoint: DrawFn = (w, d) => {
  const r = Math.min(w, d) / 2
  const cx = w / 2
  const cy = d / 2
  return [circle(cx, cy, r, 'outline'), line([cx - r * 0.6, cy, cx + r * 0.6, cy], 'detail'), line([cx, cy - r * 0.6, cx, cy + r * 0.6], 'detail')]
}

/** Paravent : trait en zigzag entre des charnières. */
export const drawScreen: DrawFn = (w, d) => {
  const panels = Math.max(2, Math.round(w / 450))
  const points: number[] = []
  for (let i = 0; i <= panels; i++) points.push((w * i) / panels, i % 2 === 0 ? 0 : d)
  return [rect(0, 0, w, d, 'soft'), line(points, 'outline')]
}
