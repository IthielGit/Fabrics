import { arc, circle, line, polygon, rect } from '../primitives'
import type { Primitive } from '../types'
import type { DrawFn } from './common'

/** Giron (profondeur d'une marche) visé par les escaliers dessinés, en mm. */
export const TREAD_DEPTH_MM = 250

/** Nombre de marches d'une volée de longueur `length` : un giron d'environ 250 mm, au moins 3 marches. */
export function stairSteps(length: number): number {
  return Math.max(3, Math.round(length / TREAD_DEPTH_MM))
}

/**
 * Flèche de montée : ligne de (x1, y1) à (x2, y2) et pointe de longueur `head` à l'arrivée.
 * Le dessin reste dans la boîte si l'extrémité est à au moins `head` des bords.
 */
function arrow(x1: number, y1: number, x2: number, y2: number, head: number): Primitive[] {
  const angle = Math.atan2(y2 - y1, x2 - x1)
  const spread = (28 * Math.PI) / 180
  return [
    line([x1, y1, x2, y2], 'detail'),
    line([x2 - Math.cos(angle - spread) * head, y2 - Math.sin(angle - spread) * head, x2, y2, x2 - Math.cos(angle + spread) * head, y2 - Math.sin(angle + spread) * head], 'detail'),
  ]
}

/** Marches d'une volée verticale (montée vers le haut) : traits horizontaux entre `y0` et `y1`, de `x0` à `x1`. */
function treadsUp(x0: number, x1: number, y0: number, y1: number): Primitive[] {
  const n = stairSteps(y1 - y0)
  const out: Primitive[] = []
  for (let i = 1; i < n; i++) out.push(line([x0, y0 + ((y1 - y0) * i) / n, x1, y0 + ((y1 - y0) * i) / n], 'detail'))
  return out
}

/** Marches d'une volée horizontale (montée vers la droite) : traits verticaux entre `x0` et `x1`, de `y0` à `y1`. */
function treadsRight(x0: number, x1: number, y0: number, y1: number): Primitive[] {
  const n = stairSteps(x1 - x0)
  const out: Primitive[] = []
  for (let i = 1; i < n; i++) out.push(line([x0 + ((x1 - x0) * i) / n, y0, x0 + ((x1 - x0) * i) / n, y1], 'detail'))
  return out
}

/** Escalier droit : contour, marches et flèche de montée vers le haut. */
export const straightStair: DrawFn = (w, d) => {
  const head = Math.min(w * 0.25, 150)
  return [
    rect(0, 0, w, d, 'outline', 6),
    ...treadsUp(0, w, 0, d),
    ...arrow(w / 2, d - head * 1.2, w / 2, head * 1.2, head),
  ]
}

/**
 * Escalier tournant : `quarter` (quart tournant : volée puis palier d'angle), `half` (demi-tournant,
 * deux volées côte à côte et palier), `u` (idem avec palier plat), `l` (deux volées à angle droit et palier).
 * Le virage est à gauche ; « Retourner » le met à droite.
 */
export function turningStair(kind: 'quarter' | 'half' | 'u' | 'l'): DrawFn {
  return (w, d) => {
    const head = Math.min(120, w * 0.12, d * 0.08)
    if (kind === 'l') {
      const fw = Math.min(1000, w * 0.45, d * 0.45)
      return [
        polygon([0, 0, w, 0, w, fw, fw, fw, fw, d, 0, d], 'outline'),
        rect(0, 0, fw, fw, 'detail'),
        ...treadsUp(0, fw, fw, d),
        ...treadsRight(fw, w, 0, fw),
        line([fw / 2, d - head * 1.2, fw / 2, fw / 2, w - head * 1.2, fw / 2], 'detail'),
        ...arrow(w - head * 3, fw / 2, w - head * 1.2, fw / 2, head),
      ]
    }
    if (kind === 'quarter') {
      const fw = w
      return [
        rect(0, 0, w, d, 'outline', 6),
        rect(0, 0, fw, fw, 'detail'),
        line([0, 0, fw, fw], 'detail'),
        line([fw, 0, 0, fw], 'detail'),
        ...treadsUp(0, w, fw, d),
        line([w / 2, d - head * 1.2, w / 2, fw / 2], 'detail'),
        ...arrow(w / 2, fw / 2, head * 1.2, fw / 2, head),
      ]
    }
    // half et u : deux volées parallèles reliées par un palier.
    const gap = Math.min(120, w * 0.06)
    const fw = (w - gap) / 2
    const landing = Math.min(fw, d * 0.3)
    const out: Primitive[] = [
      rect(0, 0, w, d, 'outline', 6),
      rect(0, 0, w, landing, 'detail'),
      ...treadsUp(0, fw, landing, d),
      ...treadsUp(w - fw, w, landing, d),
      line([fw, landing, fw, d], 'detail'),
      line([w - fw, landing, w - fw, d], 'detail'),
    ]
    if (kind === 'half') {
      // Palier avec marches balancées : deux lignes en éventail.
      out.push(line([fw, landing, 0, 0], 'detail'), line([w - fw, landing, w, 0], 'detail'))
    }
    out.push(line([fw / 2, d - head * 1.2, fw / 2, landing / 2, w - fw / 2, landing / 2], 'detail'))
    out.push(...arrow(w - fw / 2, landing / 2 + head * 0.2, w - fw / 2, landing + head * 2, head))
    return out
  }
}

/** Escalier hélicoïdal : disque, noyau central, marches en rayons et flèche en arc (sens horaire ; « Retourner » l'inverse). */
export const spiralStair: DrawFn = (w, d) => {
  const r = Math.min(w, d) / 2
  const cx = w / 2
  const cy = d / 2
  const out: Primitive[] = [circle(cx, cy, r, 'outline'), circle(cx, cy, r * 0.12, 'detail')]
  const steps = 12
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2
    out.push(line([cx + Math.cos(a) * r * 0.12, cy + Math.sin(a) * r * 0.12, cx + Math.cos(a) * r, cy + Math.sin(a) * r], 'detail'))
  }
  out.push(arc(cx, cy, r * 0.62, 200, 440, 'detail'))
  const end = (440 * Math.PI) / 180
  const tx = cx + Math.cos(end) * r * 0.62
  const ty = cy + Math.sin(end) * r * 0.62
  const head = r * 0.14
  // Pointe dans le sens de la marche (tangente au cercle, sens horaire).
  const tangent = end + Math.PI / 2
  out.push(line([tx - Math.cos(tangent - 0.5) * head, ty - Math.sin(tangent - 0.5) * head, tx, ty, tx - Math.cos(tangent + 0.5) * head, ty - Math.sin(tangent + 0.5) * head], 'detail'))
  return out
}

/** Échelle de meunier : deux montants et des barreaux réguliers. */
export const ladderStair: DrawFn = (w, d) => {
  const out: Primitive[] = [rect(0, 0, w, d, 'outline', 6)]
  const n = Math.max(3, Math.round(d / 300))
  for (let i = 1; i < n; i++) out.push(line([0, (d * i) / n, w, (d * i) / n], 'detail'))
  return out
}

/** Rampe : contour, rives (mains courantes) et flèche de montée avec chevrons. */
export const ramp: DrawFn = (w, d) => {
  const rail = Math.min(60, w * 0.06)
  const head = Math.min(w * 0.22, 180)
  const out: Primitive[] = [rect(0, 0, w, d, 'outline', 4), line([rail, 0, rail, d], 'detail'), line([w - rail, 0, w - rail, d], 'detail')]
  const chevrons = Math.max(2, Math.round(d / 1500))
  for (let i = 1; i <= chevrons; i++) {
    const y = (d * i) / (chevrons + 1)
    out.push(line([w * 0.3, y + head * 0.5, w / 2, y - head * 0.3, w * 0.7, y + head * 0.5], 'detail'))
  }
  out.push(...arrow(w / 2, d - head * 1.2, w / 2, head * 1.2, head))
  return out
}

/** Ascenseur, monte-charge, plateforme élévatrice : cabine, croix de gaine et seuil de la porte en façade. */
export const lift: DrawFn = (w, d) => {
  const wall = Math.min(60, w * 0.07, d * 0.07)
  const door = w * 0.6
  return [
    rect(0, 0, w, d, 'outline', 4),
    rect(wall, wall, w - wall * 2, d - wall * 2, 'detail'),
    line([wall, wall, w - wall, d - wall], 'detail'),
    line([w - wall, wall, wall, d - wall], 'detail'),
    line([(w - door) / 2, d - wall, (w + door) / 2, d - wall], 'outline'),
  ]
}

/** Escalier mécanique : contour, marches serrées et flèche. */
export const escalator: DrawFn = (w, d) => {
  const head = Math.min(w * 0.22, 150)
  const out: Primitive[] = [rect(0, 0, w, d, 'outline', 6), line([w * 0.18, 0, w * 0.18, d], 'detail'), line([w * 0.82, 0, w * 0.82, d], 'detail')]
  const n = Math.max(6, Math.round(d / 400))
  for (let i = 1; i < n; i++) out.push(line([w * 0.18, (d * i) / n, w * 0.82, (d * i) / n], 'detail'))
  out.push(...arrow(w / 2, d - head * 1.2, w / 2, head * 1.2, head))
  return out
}

/** Gaine technique, trémie : rectangle barré d'une croix (zone de référence). */
export const shaft: DrawFn = (w, d) => [rect(0, 0, w, d, 'outline', 0), line([0, 0, w, d], 'detail'), line([0, d, w, 0], 'detail')]
