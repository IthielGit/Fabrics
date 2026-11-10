import { circle, ellipse, ellipseArcPoints, line, polygon, rect } from '../primitives'
import type { Primitive } from '../types'
import { corner, countFor, edge, type DrawFn } from './common'

// --- Bars ---

/**
 * Comptoir de bar vu de dessus, côté convives en bas (bord de service en pointillé) :
 * - `straight` : droit ; `l` : en L (retour à gauche) ; `u` : en U ;
 * - `curved` : courbe, en arc d'ellipse (asymétrique) ; `round` : bar rond, service au centre.
 */
export function barCounter(kind: 'straight' | 'l' | 'u' | 'curved' | 'round'): DrawFn {
  return (w, d) => {
    const t = Math.min(600, d * 0.4, w * 0.2) // épaisseur du comptoir
    const e = Math.min(40, t * 0.15)
    switch (kind) {
      case 'straight':
        return [rect(0, 0, w, d, 'outline', Math.min(30, d * 0.2)), rect(e, e, w - e * 2, d - e * 2, 'detail', 8), line([e, d - e * 2.2, w - e, d - e * 2.2], 'above')]
      case 'l':
        return [
          polygon([0, 0, w, 0, w, t, t, t, t, d, 0, d], 'outline'),
          line([w - e, t - e * 2, t + e * 2, t - e * 2, t + e * 2, d - e], 'above'),
        ]
      case 'u':
        return [
          polygon([0, 0, w, 0, w, d, w - t, d, w - t, t, t, t, t, d, 0, d], 'outline'),
          line([t + e * 2, d - e, t + e * 2, t + e * 2, w - t - e * 2, t + e * 2, w - t - e * 2, d - e], 'above'),
        ]
      case 'curved': {
        const outer = ellipseArcPoints(w / 2, d, w / 2, d, 180, 330)
        const inner = ellipseArcPoints(w / 2, d, Math.max(w / 2 - t, 1), Math.max(d - t, 1), 330, 180)
        return [polygon([...outer, ...inner], 'outline'), line(ellipseArcPoints(w / 2, d, Math.max(w / 2 - t - e * 2, 1), Math.max(d - t - e * 2, 1), 180, 330), 'above')]
      }
      case 'round': {
        const r = Math.min(w, d) / 2
        return [circle(w / 2, d / 2, r, 'outline'), circle(w / 2, d / 2, Math.max(r - t, r * 0.45), 'detail'), line([w / 2 - r, d / 2, w / 2 - Math.max(r - t, r * 0.45), d / 2], 'detail')]
      }
    }
  }
}

/** Bar d'intérieur : arrière-bar contre le mur (en haut) et comptoir décalé à droite avec bord de service (asymétrique). */
export const homeBar: DrawFn = (w, d) => {
  const back = Math.min(500, d * 0.28)
  const barDepth = Math.min(550, d * 0.32)
  const x0 = w * 0.28
  const e = Math.min(30, barDepth * 0.15)
  return [
    rect(0, 0, w, back, 'outline', 8),
    line([w * 0.33, 0, w * 0.33, back], 'detail'),
    line([w * 0.66, 0, w * 0.66, back], 'detail'),
    rect(x0, d - barDepth, w - x0, barDepth, 'outline', 20),
    line([x0 + e, d - e * 2.2, w - e, d - e * 2.2], 'above'),
  ]
}

/** Poste de service du bar : plan avec bac et robinet. */
export const serviceStation: DrawFn = (w, d) => {
  const e = edge(w, d, 40)
  return [rect(0, 0, w, d, 'outline', 10), rect(w * 0.15, e, w * 0.35, d - e * 2, 'detail', 8), circle(w * 0.7, d / 2, Math.min(d * 0.25, w * 0.08), 'detail')]
}

/** Bar de piscine : îlot ovale entouré de tabourets. */
export const poolBar: DrawFn = (w, d) => {
  const out: Primitive[] = [ellipse(w / 2, d / 2, w * 0.36, d * 0.3, 'outline'), ellipse(w / 2, d / 2, w * 0.26, d * 0.18, 'detail')]
  const stools = 10
  for (let i = 0; i < stools; i++) {
    const a = (i / stools) * Math.PI * 2
    out.push(circle(w / 2 + Math.cos(a) * w * 0.43, d / 2 + Math.sin(a) * d * 0.4, Math.min(w, d) * 0.045, 'detail'))
  }
  return out
}

/** Table haute de bar et ses quatre tabourets. */
export const highBarTable: DrawFn = (w, d) => {
  const m = Math.min(w, d)
  const tableR = m * 0.24
  const stool = m * 0.1
  const cx = w / 2
  const cy = d / 2
  const o = m * 0.36
  return [
    circle(cx, cy, tableR, 'outline'),
    circle(cx - o, cy - o, stool, 'outline'),
    circle(cx + o, cy - o, stool, 'outline'),
    circle(cx - o, cy + o, stool, 'outline'),
    circle(cx + o, cy + o, stool, 'outline'),
  ]
}

// --- Commerce, restauration ---

/** Portant à vêtements, étal : barre et cintres (traits courts réguliers). */
export const clothesRack: DrawFn = (w, d) => {
  const out: Primitive[] = [rect(0, 0, w, d, 'outline', 10), line([w * 0.04, d / 2, w * 0.96, d / 2], 'detail')]
  const n = countFor(w, 90, 6)
  for (let i = 0; i < n; i++) {
    const x = (w * (i + 0.5)) / n
    out.push(line([x - 15, d * 0.3, x + 15, d * 0.7], 'detail'))
  }
  return out
}

/** Cabine d'essayage : cloisons, assise et rideau / porte avec débattement. */
export const fittingRoom: DrawFn = (w, d) => [
  rect(0, 0, w, d, 'outline', 8),
  rect(w * 0.1, d * 0.08, w * 0.8, d * 0.2, 'detail', 8),
  line([w * 0.2, d, w * 0.9, d], 'detail'),
  line(ellipseArcPoints(w * 0.9, d, w * 0.7, Math.min(w * 0.7, d * 0.55), 180, 270), 'detail'),
]

/** Chambre froide : local, porte avec débattement et étagères sur trois côtés. */
export const coldRoom: DrawFn = (w, d) => {
  const e = Math.min(300, w * 0.15, d * 0.15)
  return [
    rect(0, 0, w, d, 'outline', 0),
    rect(e, e, w - e * 2, d - e * 2, 'detail', 0),
    line([w * 0.3, d, w * 0.7, d], 'outline'),
    line(ellipseArcPoints(w * 0.3, d, w * 0.4, Math.min(w * 0.4, d * 0.45), 270, 360), 'detail'),
  ]
}

/** Régie, cabine de mixage : plan et deux platines rondes. */
export const djBooth: DrawFn = (w, d) => [
  rect(0, 0, w, d, 'outline', 12),
  circle(w * 0.3, d / 2, Math.min(d * 0.32, w * 0.14), 'detail'),
  circle(w * 0.7, d / 2, Math.min(d * 0.32, w * 0.14), 'detail'),
  rect(w * 0.44, d * 0.3, w * 0.12, d * 0.4, 'detail', 4),
]

/** Banc d'église : assise et dossier le long du bord arrière. */
export const pew: DrawFn = (w, d) => [rect(0, 0, w, d, 'outline', 10), rect(0, 0, w, d * 0.25, 'detail', 6), rect(w * 0.02, d * 0.35, w * 0.96, d * 0.55, 'detail', 6)]

// --- Santé et enseignement ---

/** Table médicale : `exam` (table d'examen), `massage` (avec trou facial), `stretcher` (brancard avec roues). */
export function medicalTable(kind: 'exam' | 'massage' | 'stretcher'): DrawFn {
  return (w, d) => {
    const out: Primitive[] = [rect(0, 0, w, d, 'outline', corner(w, d, 0.1, 50)), rect(w * 0.08, d * 0.03, w * 0.84, d * 0.16, 'detail', 20)]
    if (kind === 'massage') out.push(ellipse(w / 2, d * 0.06, w * 0.14, d * 0.025, 'detail'))
    if (kind === 'stretcher') {
      for (const [x, y] of [[w * 0.12, d * 0.12], [w * 0.88, d * 0.12], [w * 0.12, d * 0.88], [w * 0.88, d * 0.88]]) out.push(circle(x, y, Math.min(w, d) * 0.07, 'detail'))
    }
    return out
  }
}

/** Fauteuil roulant : deux grandes roues, assise et poignées de poussée. */
export const wheelchair: DrawFn = (w, d) => [
  rect(0, d * 0.35, w * 0.12, d * 0.4, 'outline', 20),
  rect(w * 0.88, d * 0.35, w * 0.12, d * 0.4, 'outline', 20),
  rect(w * 0.16, d * 0.3, w * 0.68, d * 0.4, 'outline', 20),
  rect(w * 0.16, d * 0.12, w * 0.68, d * 0.12, 'detail', 10),
  rect(w * 0.2, d * 0.85, w * 0.12, d * 0.1, 'detail', 6),
  rect(w * 0.68, d * 0.85, w * 0.12, d * 0.1, 'detail', 6),
]

/** Fauteuil de soins dentaires : assise, dossier, repose-pieds et scialytique rond. */
export const dentalChair: DrawFn = (w, d) => [
  rect(w * 0.15, 0, w * 0.7, d * 0.5, 'outline', 40),
  rect(w * 0.2, d * 0.5, w * 0.6, d * 0.2, 'outline', 20),
  rect(w * 0.25, d * 0.7, w * 0.5, d * 0.28, 'detail', 20),
  circle(w * 0.88, d * 0.1, Math.min(w, d) * 0.1, 'detail'),
]

/** Pèse-personne, toise : plateau et cadran. */
export const scale: DrawFn = (w, d) => [rect(0, 0, w, d, 'outline', Math.min(w, d) * 0.2), circle(w / 2, d * 0.3, Math.min(w, d) * 0.12, 'detail'), line([w * 0.25, d * 0.75, w * 0.75, d * 0.75], 'detail')]

/** Pupitre d'élève : plateau et chaise attenante. */
export function schoolDesk(seats: 1 | 2): DrawFn {
  return (w, d) => {
    const out: Primitive[] = [rect(0, 0, w, d, 'outline', 12)]
    const cell = w / seats
    for (let i = 0; i < seats; i++) {
      out.push(rect(cell * i + cell * 0.1, d * 0.1, cell * 0.8, d * 0.45, 'detail', 8), rect(cell * i + cell * 0.25, d * 0.68, cell * 0.5, d * 0.25, 'detail', 8))
    }
    return out
  }
}

/** Paillasse de laboratoire : plan avec évier et prises. */
export const labBench: DrawFn = (w, d) => {
  const e = edge(w, d, 40)
  return [rect(0, 0, w, d, 'outline', 10), rect(w * 0.1, e, w * 0.2, d - e * 2, 'detail', 8), circle(w * 0.7, d / 2, Math.min(d * 0.2, w * 0.04), 'detail'), circle(w * 0.85, d / 2, Math.min(d * 0.2, w * 0.04), 'detail')]
}

// --- Loisirs et sport ---

/** Table de jeu à filet ou à poches : `tennis` (tennis de table), `billiard`, `foosball` (baby-foot). */
export function gameTable(kind: 'tennis' | 'billiard' | 'foosball'): DrawFn {
  return (w, d) => {
    const out: Primitive[] = [rect(0, 0, w, d, 'outline', 20)]
    if (kind === 'tennis') {
      out.push(rect(w * 0.04, d * 0.02, w * 0.92, d * 0.96, 'detail', 10), line([0, d / 2, w, d / 2], 'detail'), line([w / 2, d * 0.02, w / 2, d * 0.98], 'detail'))
    } else if (kind === 'billiard') {
      const pocket = Math.min(w, d) * 0.06
      out.push(rect(w * 0.06, d * 0.04, w * 0.88, d * 0.92, 'detail', 10))
      for (const [x, y] of [[pocket, pocket], [w - pocket, pocket], [pocket, d - pocket], [w - pocket, d - pocket], [pocket, d / 2], [w - pocket, d / 2]]) out.push(circle(x, y, pocket * 0.8, 'detail'))
    } else {
      out.push(rect(w * 0.06, d * 0.06, w * 0.88, d * 0.88, 'detail', 8))
      for (let i = 1; i <= 4; i++) out.push(line([w * 0.02, (d * i) / 5, w * 0.98, (d * i) / 5], 'detail'))
    }
    return out
  }
}

/** Appareils de sport : tapis de course, vélo d'appartement, banc de musculation. */
export function fitness(kind: 'treadmill' | 'bike' | 'bench'): DrawFn {
  return (w, d) => {
    switch (kind) {
      case 'treadmill':
        return [rect(0, 0, w, d, 'outline', 20), rect(w * 0.12, d * 0.2, w * 0.76, d * 0.76, 'detail', 15), rect(w * 0.1, d * 0.04, w * 0.8, d * 0.12, 'detail', 10)]
      case 'bike':
        return [rect(0, 0, w, d, 'outline', 20), circle(w / 2, d * 0.62, Math.min(w, d) * 0.2, 'detail'), line([w * 0.1, d * 0.12, w * 0.9, d * 0.12], 'detail')]
      case 'bench':
        return [rect(0, 0, w, d, 'outline', 15), rect(w * 0.25, d * 0.12, w * 0.5, d * 0.7, 'detail', 15), line([0, d * 0.08, w, d * 0.08], 'detail')]
    }
  }
}

/** Tapis de yoga : bande roulée à une extrémité (zone de référence). */
export const yogaMat: DrawFn = (w, d) => [rect(0, 0, w, d, 'outline', 15), circle(w / 2, d * 0.04, Math.min(w * 0.4, d * 0.04), 'detail')]

/** Rangée de fauteuils de cinéma (trois places) : chaque fauteuil avec son dossier. */
export const cinemaRow: DrawFn = (w, d) => {
  const out: Primitive[] = []
  const n = 3
  for (let i = 0; i < n; i++) {
    const x = (w * i) / n
    out.push(rect(x + 8, 0, w / n - 16, d, 'outline', 40), rect(x + 8, 0, w / n - 16, d * 0.3, 'detail', 30))
  }
  return out
}

/** Aquarium : cuve, cadre intérieur et quelques poissons (ellipses). */
export const aquarium: DrawFn = (w, d) => {
  const e = edge(w, d, 40)
  return [rect(0, 0, w, d, 'outline', 10), rect(e, e, w - e * 2, d - e * 2, 'detail', 6), ellipse(w * 0.3, d * 0.5, w * 0.04, d * 0.1, 'detail'), ellipse(w * 0.6, d * 0.4, w * 0.035, d * 0.09, 'detail'), ellipse(w * 0.75, d * 0.62, w * 0.03, d * 0.08, 'detail')]
}

/** Panier d'animal : bord arrondi et coussin. */
export const petBed: DrawFn = (w, d) => [rect(0, 0, w, d, 'outline', Math.min(w, d) * 0.4), rect(w * 0.14, d * 0.18, w * 0.72, d * 0.64, 'detail', Math.min(w, d) * 0.3)]

/** Machine d'atelier : bâti, plateau et volant. */
export const lathe: DrawFn = (w, d) => [rect(0, 0, w, d, 'outline', 12), rect(w * 0.1, d * 0.2, w * 0.6, d * 0.6, 'detail', 8), circle(w * 0.85, d / 2, Math.min(d * 0.28, w * 0.14), 'detail')]

/** Terrain de sport : `basket`, `tennis`, `five` (football à 5), `petanque` — lignes réglementaires simplifiées (zone de référence). */
export function court(kind: 'basket' | 'tennis' | 'five' | 'petanque'): DrawFn {
  return (w, d) => {
    const out: Primitive[] = [rect(0, 0, w, d, 'outline', 0)]
    const cx = w / 2
    const cy = d / 2
    const m = Math.min(w, d)
    switch (kind) {
      case 'basket':
        out.push(line([0, cy, w, cy], 'detail'), circle(cx, cy, m * 0.12, 'detail'), rect(w * 0.32, 0, w * 0.36, d * 0.2, 'detail', 0), rect(w * 0.32, d * 0.8, w * 0.36, d * 0.2, 'detail', 0))
        break
      case 'tennis':
        out.push(line([0, cy, w, cy], 'detail'), line([w * 0.12, 0, w * 0.12, d], 'detail'), line([w * 0.88, 0, w * 0.88, d], 'detail'), line([w * 0.12, d * 0.27, w * 0.88, d * 0.27], 'detail'), line([w * 0.12, d * 0.73, w * 0.88, d * 0.73], 'detail'), line([cx, d * 0.27, cx, d * 0.73], 'detail'))
        break
      case 'five':
        out.push(line([0, cy, w, cy], 'detail'), circle(cx, cy, m * 0.1, 'detail'), rect(w * 0.3, 0, w * 0.4, d * 0.15, 'detail', 0), rect(w * 0.3, d * 0.85, w * 0.4, d * 0.15, 'detail', 0))
        break
      case 'petanque':
        out.push(line([0, d * 0.5, w, d * 0.5], 'detail'), circle(cx, d * 0.1, m * 0.1, 'detail'), circle(cx, d * 0.9, m * 0.1, 'detail'))
        break
    }
    return out
  }
}
