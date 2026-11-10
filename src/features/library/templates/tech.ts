import { arc, circle, line, polygon, rect } from '../primitives'
import type { Primitive } from '../types'
import { corner, countFor, edge, type DrawFn } from './common'

// --- Pictogrammes conventionnels (électricité, sécurité) ---

/** Repère dans le carré centré de côté `s`, coordonnées unitaires [0, 1] → mm. */
interface Glyph {
  s: number
  x: (u: number) => number
  y: (v: number) => number
  c: (u: number, v: number, r: number, filled?: boolean) => Primitive
  l: (...uv: number[]) => Primitive
}

function glyphFrame(w: number, d: number): Glyph {
  const s = Math.min(w, d)
  const ox = (w - s) / 2
  const oy = (d - s) / 2
  const x = (u: number) => ox + u * s
  const y = (v: number) => oy + v * s
  return {
    s,
    x,
    y,
    c: (u, v, r, filled = false) => circle(x(u), y(v), r * s, filled ? 'soft' : 'detail'),
    l: (...uv) => line(uv.map((value, i) => (i % 2 === 0 ? x(value) : y(value))), 'detail'),
  }
}

type GlyphName =
  | 'socket' | 'socket2' | 'floor' | 'rj45' | 'tv' | 'usb' | 'switch' | 'switch2' | 'dimmer' | 'push'
  | 'light-c' | 'light-w' | 'smoke' | 'thermo' | 'bell' | 'intercom' | 'ev' | 'camera'
  | 'extinguisher' | 'hose' | 'alarm' | 'emergency' | 'aed' | 'firstaid' | 'assembly' | 'firecomp' | 'wheelchair'

/** Fond du pictogramme : cercle (par défaut) ou carré. */
const SQUARE_BASE: ReadonlySet<GlyphName> = new Set<GlyphName>(['floor', 'intercom', 'ev', 'alarm', 'firstaid', 'firecomp', 'extinguisher', 'hose', 'camera'])

function glyphPrimitives(name: GlyphName, g: Glyph): Primitive[] {
  const { c, l, x, y, s } = g
  switch (name) {
    case 'socket':
      return [l(0.38, 0.32, 0.38, 0.55), l(0.62, 0.32, 0.62, 0.55), l(0.3, 0.7, 0.7, 0.7)]
    case 'socket2':
      return [l(0.3, 0.3, 0.3, 0.52), l(0.45, 0.3, 0.45, 0.52), l(0.55, 0.3, 0.55, 0.52), l(0.7, 0.3, 0.7, 0.52), l(0.25, 0.7, 0.75, 0.7)]
    case 'floor':
      return [c(0.5, 0.5, 0.25), l(0.4, 0.4, 0.4, 0.55), l(0.6, 0.4, 0.6, 0.55)]
    case 'rj45':
      return [rect(x(0.28), y(0.32), 0.44 * s, 0.34 * s, 'detail', 4), l(0.4, 0.66, 0.4, 0.78, 0.6, 0.78, 0.6, 0.66)]
    case 'tv':
      return [polygon([x(0.35), y(0.3), x(0.7), y(0.5), x(0.35), y(0.7)], 'detail')]
    case 'usb':
      return [rect(x(0.3), y(0.38), 0.4 * s, 0.24 * s, 'detail', 3), l(0.42, 0.45, 0.42, 0.55), l(0.58, 0.45, 0.58, 0.55)]
    case 'switch':
      return [c(0.38, 0.62, 0.07, true), l(0.38, 0.62, 0.7, 0.28)]
    case 'switch2':
      return [c(0.5, 0.7, 0.07, true), l(0.5, 0.7, 0.28, 0.3), l(0.5, 0.7, 0.72, 0.3)]
    case 'dimmer':
      return [c(0.38, 0.62, 0.07, true), l(0.38, 0.62, 0.7, 0.28), l(0.3, 0.3, 0.55, 0.3, 0.55, 0.4)]
    case 'push':
      return [c(0.5, 0.5, 0.2), c(0.5, 0.5, 0.08, true)]
    case 'light-c':
      return [l(0.28, 0.28, 0.72, 0.72), l(0.28, 0.72, 0.72, 0.28)]
    case 'light-w':
      return [l(0.3, 0.3, 0.7, 0.7), l(0.3, 0.7, 0.7, 0.3), l(0.2, 0.85, 0.8, 0.85)]
    case 'smoke':
      return [c(0.5, 0.5, 0.22), c(0.5, 0.5, 0.1, true)]
    case 'thermo':
      return [l(0.5, 0.25, 0.5, 0.6), c(0.5, 0.7, 0.1, true)]
    case 'bell':
      return [polygon([x(0.5), y(0.22), x(0.72), y(0.66), x(0.28), y(0.66)], 'detail'), c(0.5, 0.78, 0.06, true)]
    case 'intercom':
      return [rect(x(0.28), y(0.25), 0.44 * s, 0.3 * s, 'detail', 3), c(0.5, 0.72, 0.07, true)]
    case 'ev':
      return [l(0.55, 0.22, 0.38, 0.55, 0.52, 0.55, 0.42, 0.8)]
    case 'camera':
      return [c(0.45, 0.5, 0.14), polygon([x(0.62), y(0.42), x(0.82), y(0.3), x(0.82), y(0.7), x(0.62), y(0.58)], 'detail')]
    case 'extinguisher':
      return [rect(x(0.36), y(0.38), 0.28 * s, 0.46 * s, 'detail', 6), l(0.5, 0.38, 0.5, 0.2, 0.68, 0.2)]
    case 'hose':
      return [c(0.5, 0.5, 0.26), c(0.5, 0.5, 0.12)]
    case 'alarm':
      return [c(0.5, 0.5, 0.2), c(0.5, 0.5, 0.08, true)]
    case 'emergency':
      return [l(0.28, 0.28, 0.72, 0.72), l(0.28, 0.72, 0.72, 0.28), c(0.5, 0.5, 0.06, true)]
    case 'aed':
      return [polygon([x(0.5), y(0.78), x(0.24), y(0.48), x(0.3), y(0.3), x(0.5), y(0.38), x(0.7), y(0.3), x(0.76), y(0.48)], 'detail'), l(0.44, 0.5, 0.5, 0.58, 0.56, 0.44)]
    case 'firstaid':
      return [l(0.5, 0.25, 0.5, 0.75), l(0.25, 0.5, 0.75, 0.5)]
    case 'assembly':
      return [l(0.5, 0.12, 0.5, 0.4), l(0.5, 0.88, 0.5, 0.6), l(0.12, 0.5, 0.4, 0.5), l(0.88, 0.5, 0.6, 0.5), c(0.5, 0.5, 0.08, true)]
    case 'firecomp':
      return [l(0.1, 0.9, 0.9, 0.1), l(0.1, 0.55, 0.55, 0.1), l(0.45, 0.9, 0.9, 0.45)]
    case 'wheelchair':
      return [c(0.45, 0.22, 0.07, true), l(0.45, 0.3, 0.45, 0.58, 0.68, 0.58, 0.76, 0.82), arc(x(0.45), y(0.68), 0.2 * s, 100, 300, 'detail')]
  }
}

/** Pictogramme conventionnel (prise, interrupteur, détecteur, extincteur…) : fond (cercle ou carré) et symbole. */
export function marker(name: GlyphName): DrawFn {
  return (w, d) => {
    const g = glyphFrame(w, d)
    const out: Primitive[] = []
    const squareLike = SQUARE_BASE.has(name) || Math.abs(w - d) > Math.min(w, d) * 0.05
    if (squareLike) out.push(rect(0, 0, w, d, 'outline', Math.min(w, d) * 0.12))
    else out.push(circle(w / 2, d / 2, Math.min(w, d) / 2, 'outline'))
    out.push(...glyphPrimitives(name, g))
    return out
  }
}

/** Sortie de secours : panneau et flèche vers la droite avec un point (personnage). */
export const exitSign: DrawFn = (w, d) => [
  rect(0, 0, w, d, 'outline', Math.min(w, d) * 0.12),
  circle(w * 0.22, d * 0.3, d * 0.09, 'soft'),
  line([w * 0.22, d * 0.45, w * 0.22, d * 0.8], 'detail'),
  line([w * 0.45, d / 2, w * 0.85, d / 2, w * 0.74, d * 0.32], 'detail'),
  line([w * 0.85, d / 2, w * 0.74, d * 0.68], 'detail'),
]

/** Flèche d'évacuation : longue flèche pleine. */
export const evacuationArrow: DrawFn = (w, d) => [
  polygon([0, d * 0.3, w * 0.7, d * 0.3, w * 0.7, 0, w, d / 2, w * 0.7, d, w * 0.7, d * 0.7, 0, d * 0.7], 'outline'),
]

/** Cercle de manœuvre : disque en pointillé (zone de référence). */
export const turningCircle: DrawFn = (w, d) => {
  const r = Math.min(w, d) / 2
  return [circle(w / 2, d / 2, r, 'outline'), line([w / 2 - r * 0.25, d / 2, w / 2 + r * 0.25, d / 2], 'detail'), line([w / 2, d / 2 - r * 0.25, w / 2, d / 2 + r * 0.25], 'detail')]
}

/** Espace d'usage : rectangle et flèche d'accès (zone de référence). */
export const clearZone: DrawFn = (w, d) => [rect(0, 0, w, d, 'outline', 0), line([w / 2, d * 0.8, w / 2, d * 0.2], 'detail')]

/** Débattement de porte : quart de disque (arc et deux rayons). */
export const doorSwing: DrawFn = (w, d) => {
  const r = Math.min(w, d)
  return [polygon([0, d, r, d, ...swingArc(0, d, r)], 'outline'), arc(0, d, r, -90, 0, 'detail')]
}

function swingArc(cx: number, cy: number, r: number): number[] {
  const points: number[] = []
  for (let i = 0; i <= 18; i++) {
    const a = ((-i * 5) * Math.PI) / 180
    points.push(cx + r * Math.cos(a), cy + r * Math.sin(a))
  }
  return points
}

// --- Luminaires ---

/** Luminaires : `ceiling` (plafonnier), `pendant` (suspension), `chandelier`, `spot`, `wall` (applique), `rail`. */
export function lamp(kind: 'ceiling' | 'pendant' | 'chandelier' | 'spot' | 'wall' | 'rail'): DrawFn {
  return (w, d) => {
    const cx = w / 2
    const cy = d / 2
    const r = Math.min(w, d) / 2
    switch (kind) {
      case 'ceiling':
        return [circle(cx, cy, r, 'outline'), line([cx - r * 0.55, cy - r * 0.55, cx + r * 0.55, cy + r * 0.55], 'detail'), line([cx - r * 0.55, cy + r * 0.55, cx + r * 0.55, cy - r * 0.55], 'detail')]
      case 'pendant':
        return [circle(cx, cy, r, 'outline'), circle(cx, cy, r * 0.55, 'detail'), circle(cx, cy, r * 0.12, 'soft')]
      case 'chandelier': {
        const out: Primitive[] = [circle(cx, cy, r, 'outline'), circle(cx, cy, r * 0.2, 'detail')]
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2
          out.push(line([cx + Math.cos(a) * r * 0.2, cy + Math.sin(a) * r * 0.2, cx + Math.cos(a) * r * 0.7, cy + Math.sin(a) * r * 0.7], 'detail'))
          out.push(circle(cx + Math.cos(a) * r * 0.82, cy + Math.sin(a) * r * 0.82, r * 0.1, 'detail'))
        }
        return out
      }
      case 'spot':
        return [circle(cx, cy, r, 'outline'), circle(cx, cy, r * 0.4, 'soft')]
      case 'wall':
        return [rect(0, 0, w, d, 'outline', Math.min(w, d) * 0.15), arc(cx, d, Math.min(w, d * 2) * 0.4, 180, 360, 'detail')]
      case 'rail': {
        const out: Primitive[] = [rect(0, 0, w, d, 'outline', d / 2)]
        const n = countFor(w, 400)
        for (let i = 0; i < n; i++) out.push(circle((w * (i + 0.5)) / n, cy, d * 0.3, 'detail'))
        return out
      }
    }
  }
}

// --- Chauffage, ventilation, plomberie ---

/** Radiateurs : `panel` (à panneaux), `column` (à éléments), `convector` (convecteur), `floor` (convecteur de sol). */
export function radiator(kind: 'panel' | 'column' | 'convector' | 'floor'): DrawFn {
  return (w, d) => {
    const out: Primitive[] = [rect(0, 0, w, d, 'outline', Math.min(d / 2, 15))]
    const e = edge(w, d, 15)
    switch (kind) {
      case 'panel':
        out.push(line([e, d / 2, w - e, d / 2], 'detail'), circle(e * 1.2, d * 0.5, Math.min(d * 0.14, 8), 'detail'))
        break
      case 'column': {
        const n = countFor(w, 45, 3)
        for (let i = 1; i < n; i++) out.push(line([(w * i) / n, 0, (w * i) / n, d], 'detail'))
        break
      }
      case 'convector':
      case 'floor': {
        const n = countFor(w, kind === 'floor' ? 60 : 40, 4)
        for (let i = 0; i < n; i++) {
          const x = (w * (i + 0.5)) / n
          out.push(line([x - Math.min(8, w / n / 3), d * 0.25, x + Math.min(8, w / n / 3), d * 0.75], 'detail'))
        }
        break
      }
    }
    return out
  }
}

/** Collecteur de plancher chauffant : coffret et départs (cercles). */
export const manifold: DrawFn = (w, d) => {
  const out: Primitive[] = [rect(0, 0, w, d, 'outline', 6)]
  const n = countFor(w, 70, 4)
  for (let i = 0; i < n; i++) out.push(circle((w * (i + 0.5)) / n, d / 2, Math.min(d * 0.2, (w / n) * 0.3), 'detail'))
  return out
}

/** Climatisation : unité murale (grille), cassette (carré et bouches), unité extérieure (ventilateur) ou pompe à chaleur. */
export function airConditioner(kind: 'split' | 'cassette' | 'outdoor' | 'heat-pump'): DrawFn {
  return (w, d) => {
    const out: Primitive[] = [rect(0, 0, w, d, 'outline', corner(w, d, 0.08, 40))]
    switch (kind) {
      case 'split':
        out.push(line([w * 0.06, d * 0.7, w * 0.94, d * 0.7], 'detail'), line([w * 0.06, d * 0.45, w * 0.94, d * 0.45], 'detail'))
        break
      case 'cassette':
        out.push(rect(w * 0.15, d * 0.15, w * 0.7, d * 0.7, 'detail', 10), line([0, 0, w, d], 'detail'), line([0, d, w, 0], 'detail'))
        break
      case 'outdoor':
        out.push(circle(w * 0.5, d * 0.5, Math.min(w, d) * 0.36, 'detail'), line([w * 0.5 - Math.min(w, d) * 0.36, d * 0.5, w * 0.5 + Math.min(w, d) * 0.36, d * 0.5], 'detail'), line([w * 0.5, d * 0.5 - Math.min(w, d) * 0.36, w * 0.5, d * 0.5 + Math.min(w, d) * 0.36], 'detail'))
        break
      case 'heat-pump':
        out.push(circle(w * 0.3, d * 0.5, Math.min(w * 0.22, d * 0.36), 'detail'), circle(w * 0.7, d * 0.5, Math.min(w * 0.22, d * 0.36), 'detail'))
        break
    }
    return out
  }
}

/** Bouche de ventilation, conduit, siphon, regard : cercle ou carré avec un repère intérieur. */
export function fitting(kind: 'vent' | 'flue' | 'drain' | 'water' | 'downpipe' | 'chamber'): DrawFn {
  return (w, d) => {
    const cx = w / 2
    const cy = d / 2
    const r = Math.min(w, d) / 2
    switch (kind) {
      case 'vent':
        return [circle(cx, cy, r, 'outline'), line([cx - r * 0.6, cy - r * 0.35, cx + r * 0.6, cy - r * 0.35], 'detail'), line([cx - r * 0.7, cy, cx + r * 0.7, cy], 'detail'), line([cx - r * 0.6, cy + r * 0.35, cx + r * 0.6, cy + r * 0.35], 'detail')]
      case 'flue':
        return [rect(0, 0, w, d, 'outline', 4), circle(cx, cy, r * 0.62, 'detail')]
      case 'drain':
        return [circle(cx, cy, r, 'outline'), line([cx - r * 0.6, cy, cx + r * 0.6, cy], 'detail'), line([cx, cy - r * 0.6, cx, cy + r * 0.6], 'detail')]
      case 'water':
        return [circle(cx, cy, r, 'outline'), circle(cx, cy, r * 0.45, 'soft')]
      case 'downpipe':
        return [circle(cx, cy, r, 'outline'), circle(cx, cy, r * 0.6, 'detail')]
      case 'chamber':
        return [rect(0, 0, w, d, 'outline', 6), circle(cx, cy, r * 0.62, 'detail'), line([w * 0.2, d * 0.2, w * 0.8, d * 0.8], 'detail')]
    }
  }
}

/** Panneau solaire : cadre et cellules (quadrillage). */
export const solarPanel: DrawFn = (w, d) => {
  const out: Primitive[] = [rect(0, 0, w, d, 'outline', 6)]
  const cols = countFor(w, 170, 4)
  const rows = countFor(d, 170, 4)
  for (let i = 1; i < cols; i++) out.push(line([(w * i) / cols, 0, (w * i) / cols, d], 'detail'))
  for (let i = 1; i < rows; i++) out.push(line([0, (d * i) / rows, w, (d * i) / rows], 'detail'))
  return out
}

/** Compteur (gaz, eau) : coffret et cadran. */
export const meter: DrawFn = (w, d) => [rect(0, 0, w, d, 'outline', 8), circle(w / 2, d / 2, Math.min(w, d) * 0.28, 'detail'), line([w / 2, d / 2, w / 2 + Math.min(w, d) * 0.2, d / 2 - Math.min(w, d) * 0.12], 'detail')]
