import { circle, ellipse, line, polygon, rect } from '../primitives'
import type { Primitive } from '../types'
import { corner, countFor, edge, type DrawFn } from './common'
import { drawPlant } from './living'

/** Arbre feuillu, arbuste : contour irrégulier et tronc. (Même dessin que la plante d'intérieur.) */
export const tree: DrawFn = drawPlant

/** Conifère : étoile à pointes régulières et tronc. */
export const conifer: DrawFn = (w, d) => {
  const cx = w / 2
  const cy = d / 2
  const points: number[] = []
  const spikes = 18
  for (let k = 0; k < spikes * 2; k++) {
    const a = (k / (spikes * 2)) * Math.PI * 2
    const f = k % 2 === 0 ? 1 : 0.7
    points.push(cx + cx * Math.cos(a) * f, cy + cy * Math.sin(a) * f)
  }
  return [polygon(points, 'outline'), circle(cx, cy, Math.min(w, d) * 0.06, 'detail')]
}

/** Palmier : feuilles en éventail depuis le tronc. */
export const palm: DrawFn = (w, d) => {
  const cx = w / 2
  const cy = d / 2
  const out: Primitive[] = [circle(cx, cy, Math.min(w, d) / 2, 'outline')]
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2
    out.push(line([cx, cy, cx + Math.cos(a) * cx * 0.92, cy + Math.sin(a) * cy * 0.92], 'detail'))
  }
  out.push(circle(cx, cy, Math.min(w, d) * 0.06, 'soft'))
  return out
}

/** Haie : bande arrondie et touffes régulières. */
export const hedge: DrawFn = (w, d) => {
  const out: Primitive[] = [rect(0, 0, w, d, 'outline', d * 0.4)]
  const n = countFor(w, d)
  for (let i = 0; i < n; i++) out.push(circle((w * (i + 0.5)) / n, d / 2, Math.min(d * 0.34, (w / n) * 0.45), 'detail'))
  return out
}

/** Massif de fleurs ou potager : bordure et semis (cercles) ou rangs (lignes). */
export function bed(kind: 'flowers' | 'vegetables'): DrawFn {
  return (w, d) => {
    const out: Primitive[] = [rect(0, 0, w, d, 'outline', Math.min(w, d) * 0.2)]
    if (kind === 'vegetables') {
      const rows = countFor(d, 300, 2)
      for (let i = 1; i < rows; i++) out.push(line([w * 0.06, (d * i) / rows, w * 0.94, (d * i) / rows], 'detail'))
      return out
    }
    const cols = countFor(w, 350, 2)
    const rows = countFor(d, 350, 2)
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const jitter = (i + j) % 2 === 0 ? 0.08 : -0.08
        out.push(circle((w * (i + 0.5 + jitter)) / cols, (d * (j + 0.5)) / rows, Math.min(w / cols, d / rows) * 0.22, 'detail'))
      }
    }
    return out
  }
}

/** Surface de sol : pelouse (hachures), gravier (points), dallage (joints) — zones de référence. */
export function ground(kind: 'lawn' | 'gravel' | 'paving'): DrawFn {
  return (w, d) => {
    const out: Primitive[] = [rect(0, 0, w, d, 'outline', 0)]
    if (kind === 'paving') {
      const cols = countFor(w, 600, 1)
      const rows = countFor(d, 600, 1)
      for (let i = 1; i < cols; i++) out.push(line([(w * i) / cols, 0, (w * i) / cols, d], 'detail'))
      for (let j = 1; j < rows; j++) out.push(line([0, (d * j) / rows, w, (d * j) / rows], 'detail'))
      return out
    }
    const cols = countFor(w, 500, 2)
    const rows = countFor(d, 500, 2)
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = (w * (i + 0.5)) / cols
        const y = (d * (j + 0.5)) / rows
        if (kind === 'gravel') out.push(circle(x, y, 12, 'detail'))
        else out.push(line([x - 25, y + 20, x, y - 20, x + 25, y + 20], 'detail'))
      }
    }
    return out
  }
}

/** Bassin, mare : contour ovale et rive intérieure. */
export const pond: DrawFn = (w, d) => [ellipse(w / 2, d / 2, w / 2, d / 2, 'outline'), ellipse(w / 2, d / 2, w * 0.4, d * 0.38, 'detail')]

/** Piscine rectangulaire, ronde ou en L (le L est asymétrique) : margelle et bassin. */
export function pool(kind: 'rect' | 'round' | 'l'): DrawFn {
  return (w, d) => {
    const m = Math.min(300, w * 0.06, d * 0.1)
    if (kind === 'round') {
      const r = Math.min(w, d) / 2
      return [circle(w / 2, d / 2, r, 'outline'), circle(w / 2, d / 2, r - m, 'detail')]
    }
    if (kind === 'l') {
      const arm = Math.min(w, d) * 0.5
      return [
        polygon([0, 0, w, 0, w, arm, arm, arm, arm, d, 0, d], 'outline'),
        polygon([m, m, w - m, m, w - m, arm - m, arm + m, arm - m, arm + m, d - m, m, d - m], 'detail'),
      ]
    }
    return [rect(0, 0, w, d, 'outline', 40), rect(m, m, w - m * 2, d - m * 2, 'detail', 20)]
  }
}

/** Spa extérieur : cuve carrée aux angles arrondis et banquette circulaire. */
export const hotTub: DrawFn = (w, d) => [
  rect(0, 0, w, d, 'outline', Math.min(w, d) * 0.15),
  circle(w / 2, d / 2, Math.min(w, d) * 0.38, 'detail'),
  circle(w / 2, d / 2, Math.min(w, d) * 0.12, 'detail'),
]

/** Bain de soleil : cadre, dossier relevé en haut (ligne) et coussin de tête. */
export const sunLounger: DrawFn = (w, d) => [
  rect(0, 0, w, d, 'outline', 40),
  rect(w * 0.1, d * 0.04, w * 0.8, d * 0.14, 'detail', 20),
  line([w * 0.08, d * 0.34, w * 0.92, d * 0.34], 'detail'),
]

/** Parasol : disque et huit baleines (le dessin sera en pointillé, au-dessus du plan de coupe). */
export const parasol: DrawFn = (w, d) => {
  const cx = w / 2
  const cy = d / 2
  const r = Math.min(w, d) / 2
  const out: Primitive[] = [circle(cx, cy, r, 'outline')]
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    out.push(line([cx, cy, cx + Math.cos(a) * r, cy + Math.sin(a) * r], 'detail'))
  }
  return out
}

/** Barbecue : coffre et grille ronde. */
export const barbecue: DrawFn = (w, d) => [
  rect(0, 0, w, d, 'outline', corner(w, d, 0.1, 40)),
  circle(w * 0.36, d / 2, Math.min(w, d) * 0.34, 'detail'),
  line([w * 0.62, d * 0.2, w * 0.62, d * 0.8], 'detail'),
  line([w * 0.78, d * 0.2, w * 0.78, d * 0.8], 'detail'),
]

/** Cuisine d'été : plan avec deux feux et un évier. */
export const outdoorKitchen: DrawFn = (w, d) => {
  const e = edge(w, d, 40)
  return [
    rect(0, 0, w, d, 'outline', 14),
    circle(w * 0.22, d / 2, Math.min(d * 0.28, w * 0.07), 'detail'),
    circle(w * 0.36, d / 2, Math.min(d * 0.28, w * 0.07), 'detail'),
    rect(w * 0.58, e, w * 0.3, d - e * 2, 'detail', 10),
  ]
}

/** Pergola, tonnelle, abri de voiture (au-dessus du plan de coupe) : poteaux aux angles et lames de toiture. */
export function shelter(kind: 'pergola' | 'gazebo' | 'carport'): DrawFn {
  return (w, d) => {
    const post = Math.min(150, w * 0.06, d * 0.06)
    const out: Primitive[] = [rect(0, 0, w, d, 'outline', 0)]
    if (kind === 'pergola') {
      const n = countFor(w, 350, 4)
      for (let i = 1; i < n; i++) out.push(line([(w * i) / n, 0, (w * i) / n, d], 'detail'))
    } else if (kind === 'gazebo') {
      out.push(line([0, 0, w, d], 'detail'), line([0, d, w, 0], 'detail'))
    } else {
      out.push(line([w / 2, 0, w / 2, d], 'detail'))
    }
    for (const [x, y] of [[0, 0], [w - post, 0], [0, d - post], [w - post, d - post]] as const) out.push(rect(x, y, post, post, 'outline', 0))
    return out
  }
}

/** Abri de jardin et serre : volume avec faîtage (ligne centrale) ; la serre a un cadre intérieur. */
export function outbuilding(kind: 'shed' | 'greenhouse'): DrawFn {
  return (w, d) => {
    const out: Primitive[] = [rect(0, 0, w, d, 'outline', 0), line([w / 2, 0, w / 2, d], 'detail')]
    if (kind === 'greenhouse') {
      const e = Math.min(60, w * 0.05, d * 0.05)
      out.push(rect(e, e, w - e * 2, d - e * 2, 'detail', 0))
      const n = countFor(d, 500, 3)
      for (let i = 1; i < n; i++) out.push(line([e, (d * i) / n, w - e, (d * i) / n], 'detail'))
    } else {
      out.push(line([w * 0.7, d, w * 0.7, d - Math.min(w, d) * 0.2], 'detail'))
    }
    return out
  }
}

/** Composteur, bac à sable, bac de plantation : cadre et planches. */
export const crate: DrawFn = (w, d) => {
  const e = edge(w, d, 50)
  const out: Primitive[] = [rect(0, 0, w, d, 'outline', 8), rect(e, e, w - e * 2, d - e * 2, 'detail', 4)]
  const n = countFor(Math.max(w, d), 200, 3)
  for (let i = 1; i < n && w >= d; i++) out.push(line([(w * i) / n, 0, (w * i) / n, e], 'detail'))
  return out
}

/** Citerne et fosse enterrées : disque (zone) et regard central. */
export const buried: DrawFn = (w, d) => {
  const r = Math.min(w, d) / 2
  return [circle(w / 2, d / 2, r, 'outline'), circle(w / 2, d / 2, r * 0.25, 'detail'), line([w / 2 - r, d / 2, w / 2 + r, d / 2], 'detail')]
}

/** Local poubelles : emplacement et bacs ronds. */
export const wasteBins: DrawFn = (w, d) => {
  const out: Primitive[] = [rect(0, 0, w, d, 'outline', 10)]
  const n = countFor(w, 500, 2)
  for (let i = 0; i < n; i++) out.push(circle((w * (i + 0.5)) / n, d / 2, Math.min(d * 0.38, (w / n) * 0.4), 'detail'))
  return out
}

/** Trampoline : toile ronde, anneau de ressorts. */
export const trampoline: DrawFn = (w, d) => {
  const r = Math.min(w, d) / 2
  return [circle(w / 2, d / 2, r, 'outline'), circle(w / 2, d / 2, r * 0.82, 'detail'), circle(w / 2, d / 2, r * 0.3, 'detail')]
}

/** Balançoire : portique et deux sièges. */
export const swingSet: DrawFn = (w, d) => [
  rect(0, d * 0.45, w, d * 0.1, 'outline', 4),
  rect(w * 0.2, d * 0.25, w * 0.18, d * 0.5, 'detail', 6),
  rect(w * 0.62, d * 0.25, w * 0.18, d * 0.5, 'detail', 6),
]

/** Panneau de clôture : fine bande avec poteaux aux extrémités. */
export const fencePanel: DrawFn = (w, d) => [
  rect(0, 0, w, d, 'outline', 0),
  rect(0, 0, d * 1.6, d, 'detail', 0),
  rect(w - d * 1.6, 0, d * 1.6, d, 'detail', 0),
]

/** Boîte aux lettres : petit coffre et fente. */
export const letterBox: DrawFn = (w, d) => [rect(0, 0, w, d, 'outline', 6), line([w * 0.2, d * 0.35, w * 0.8, d * 0.35], 'detail')]
