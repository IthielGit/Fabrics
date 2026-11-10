import { circle, ellipse, line, polygon, rect } from '../primitives'
import type { Primitive } from '../types'
import { corner, edge, type DrawFn } from './common'

// --- Éléments isolés ---

/**
 * Évier encastré dans un plan de travail : un ou deux bacs et un robinet ; avec égouttoir, celui-ci
 * est à gauche (asymétrique : « Retourner » le met à droite).
 */
export function sink(basins: 1 | 2, drainer = false): DrawFn {
  return (w, d) => {
    const e = edge(w, d, 40)
    const out: Primitive[] = [rect(0, 0, w, d, 'outline', corner(w, d, 0.04, 30))]
    const drainerWidth = drainer ? Math.min(w * 0.3, 450) : 0
    const left = e + drainerWidth
    const basinWidth = (w - left - e - (basins === 2 ? e : 0)) / basins
    for (let i = 0; i < basins; i++) {
      const x = left + i * (basinWidth + e)
      out.push(rect(x, e * 1.4, basinWidth, d - e * 2.8, 'detail', Math.min(40, basinWidth * 0.1)))
      out.push(circle(x + basinWidth / 2, e * 1.4 + (d - e * 2.8) / 2, Math.min(25, basinWidth * 0.06), 'detail'))
    }
    if (drainer) {
      out.push(rect(e, e * 1.4, drainerWidth - e, d - e * 2.8, 'detail', 10))
      for (let i = 1; i < 5; i++) {
        const y = e * 1.4 + ((d - e * 2.8) * i) / 5
        out.push(line([e * 1.5, y, drainerWidth - e * 0.5, y], 'detail'))
      }
    }
    // Robinet : petit cercle contre le fond, à droite des bacs.
    out.push(circle(w - e * 0.9, e * 0.7, Math.min(14, e * 0.4), 'detail'))
    return out
  }
}

/** Plaque de cuisson : feux (gaz, 4 ou 5) ou zones carrées arrondies (induction). */
export function hob(burners: 4 | 5, induction = false): DrawFn {
  return (w, d) => {
    const out: Primitive[] = [rect(0, 0, w, d, 'outline', corner(w, d, 0.05, 30))]
    const cx = w / 2
    const cy = d / 2
    const r = Math.min(w, d) * 0.19
    const spots: [number, number][] = [
      [w * 0.27, d * 0.28],
      [w * 0.73, d * 0.28],
      [w * 0.27, d * 0.72],
      [w * 0.73, d * 0.72],
    ]
    if (burners === 5) spots.push([cx, cy])
    for (const [x, y] of spots) {
      if (induction) out.push(rect(x - r, y - r, r * 2, r * 2, 'detail', r * 0.3))
      else out.push(circle(x, y, r, 'detail'), circle(x, y, r * 0.45, 'detail'))
    }
    return out
  }
}

/** Cuisinière : plaque de cuisson sur le four (une ligne de façade). */
export const cooker: DrawFn = (w, d) => {
  const base = hob(4)(w, d)
  const front = Math.max(30, d * 0.08)
  return [...base, line([w * 0.1, d - front, w * 0.9, d - front], 'detail')]
}

/** Angle de cuisine : meuble en L (le retour est à gauche, « Retourner » le met à droite). */
export const cornerUnit: DrawFn = (w, d) => {
  const arm = Math.min(600, w * 0.5, d * 0.5)
  const r = 20
  return [
    polygon([0, 0, w, 0, w, arm, arm, arm, arm, d, 0, d], 'outline'),
    line([arm, arm, arm, 0], 'detail'),
    line([0, arm, arm, arm], 'detail'),
    rect(r, r, Math.max(10, arm - r * 2), Math.max(10, arm - r * 2), 'detail', 8),
  ]
}

/** Poubelle, corbeille : ellipse et anneau intérieur. */
export const bin: DrawFn = (w, d) => [
  ellipse(w / 2, d / 2, w / 2, d / 2, 'outline'),
  ellipse(w / 2, d / 2, w * 0.38, d * 0.38, 'detail'),
]

/** Desserte roulante : plateau et quatre roues aux angles. */
export const trolley: DrawFn = (w, d) => {
  const wheel = Math.min(18, w * 0.05, d * 0.1)
  return [
    rect(0, 0, w, d, 'outline', 20),
    rect(edge(w, d), edge(w, d), w - edge(w, d) * 2, d - edge(w, d) * 2, 'detail', 10),
    circle(wheel, wheel, wheel * 0.8, 'detail'),
    circle(w - wheel, wheel, wheel * 0.8, 'detail'),
    circle(wheel, d - wheel, wheel * 0.8, 'detail'),
    circle(w - wheel, d - wheel, wheel * 0.8, 'detail'),
  ]
}

/** Péninsule : plan de travail avec un retour arrondi à droite et un débord pour les convives (asymétrique). */
export const peninsula: DrawFn = (w, d) => {
  const e = edge(w, d, 40)
  return [
    rect(0, 0, w, d, 'outline', Math.min(d / 2, 120)),
    rect(e, e, w - e * 2, d - e * 2, 'detail', 30),
    line([w * 0.4, d - e * 1.2, w - e * 2, d - e * 1.2], 'detail'),
  ]
}

/** Comptoir de bar de cuisine : plateau avec débord (ligne pointillée côté convives, en bas). */
export const barTop: DrawFn = (w, d) => {
  const e = edge(w, d, 40)
  return [
    rect(0, 0, w, d, 'outline', Math.min(30, d * 0.2)),
    rect(e, e, w - e * 2, d - e * 2, 'detail', 10),
    line([e, d - e * 2, w - e, d - e * 2], 'above'),
  ]
}

// --- Cuisines complètes : rangées de meubles le long des murs ---

type CellKind = 'base' | 'sink' | 'hob' | 'fridge' | 'dishwasher' | 'tall'
const CELL_WIDTH: Record<Exclude<CellKind, 'base'>, number> = { sink: 800, hob: 600, fridge: 600, dishwasher: 600, tall: 600 }

/** Rangée de meubles le long du côté haut, de longueur `length` et de profondeur `depth` (coordonnées locales). */
function runPrimitives(length: number, depth: number, cells: readonly CellKind[]): Primitive[] {
  // Largeur fixe des appareils ; les meubles « base » se partagent le reste (jamais négatif).
  const fixed = cells.reduce((sum, kind) => sum + (kind === 'base' ? 0 : CELL_WIDTH[kind]), 0)
  const bases = cells.filter((kind) => kind === 'base').length
  const scale = fixed > length ? length / fixed : 1
  const baseWidth = bases > 0 ? Math.max(0, length - fixed * scale) / bases : 0
  const out: Primitive[] = [rect(0, 0, length, depth, 'outline', 12)]
  let x = 0
  for (const kind of cells) {
    const width = kind === 'base' ? baseWidth : CELL_WIDTH[kind] * scale
    if (width > 1) {
      const cell = cellPrimitives(kind, x, 0, width, depth)
      out.push(...cell)
      if (x > 0) out.push(line([x, 0, x, depth], 'detail'))
    }
    x += width
  }
  return out
}

function cellPrimitives(kind: CellKind, x: number, y: number, w: number, d: number): Primitive[] {
  switch (kind) {
    case 'base':
      return []
    case 'sink':
      return sink(1)(w, d).slice(1).map((p) => shift(p, x, y))
    case 'hob':
      return hob(4)(w, d).slice(1).map((p) => shift(p, x, y))
    case 'fridge':
      return [rect(x + 6, y + 6, w - 12, d - 12, 'detail', 8), line([x + 6, y + d * 0.85, x + w - 6, y + d * 0.85], 'detail')]
    case 'dishwasher':
      return [rect(x + 6, y + 6, w - 12, d - 12, 'detail', 8), line([x + 6, y + d * 0.5, x + w - 6, y + d * 0.5], 'detail')]
    case 'tall':
      return [line([x, y, x + w, y + d], 'detail'), line([x, y + d, x + w, y], 'detail')]
  }
}

/** Décale une primitive simple (rectangle, cercle, ligne) de (dx, dy). */
function shift(p: Primitive, dx: number, dy: number): Primitive {
  switch (p.kind) {
    case 'rect':
      return { ...p, x: p.x + dx, y: p.y + dy }
    case 'circle':
    case 'ellipse':
      return { ...p, cx: p.cx + dx, cy: p.cy + dy }
    case 'line':
    case 'polygon':
      return { ...p, points: p.points.map((v, i) => v + (i % 2 === 0 ? dx : dy)) }
    case 'arc':
      return { ...p, cx: p.cx + dx, cy: p.cy + dy }
  }
}

/** Passe une rangée horizontale (côté haut) en rangée verticale le long du côté gauche. */
function transpose(p: Primitive): Primitive {
  switch (p.kind) {
    case 'rect':
      return { ...p, x: p.y, y: p.x, w: p.h, h: p.w }
    case 'circle':
      return { ...p, cx: p.cy, cy: p.cx }
    case 'ellipse':
      return { ...p, cx: p.cy, cy: p.cx, rx: p.ry, ry: p.rx }
    case 'line':
    case 'polygon': {
      const points = [...p.points]
      for (let i = 0; i + 1 < points.length; i += 2) [points[i], points[i + 1]] = [points[i + 1], points[i]]
      return { ...p, points }
    }
    case 'arc':
      return p
  }
}

/** Rangée placée le long du côté gauche, de `y0` à `y0 + length`, sur une profondeur `depth`. */
function leftRun(y0: number, length: number, depth: number, cells: readonly CellKind[]): Primitive[] {
  return runPrimitives(length, depth, cells).map((p) => shift(transpose(p), 0, y0))
}

/** Rangée placée le long du côté droit (symétrique de la gauche). */
function rightRun(totalWidth: number, y0: number, length: number, depth: number, cells: readonly CellKind[]): Primitive[] {
  return runPrimitives(length, depth, cells).map((p) => {
    const t = transpose(p)
    return mirrorInto(shift(t, 0, y0), totalWidth)
  })
}

function mirrorInto(p: Primitive, width: number): Primitive {
  switch (p.kind) {
    case 'rect':
      return { ...p, x: width - p.x - p.w }
    case 'circle':
    case 'ellipse':
      return { ...p, cx: width - p.cx }
    case 'line':
    case 'polygon':
      return { ...p, points: p.points.map((v, i) => (i % 2 === 0 ? width - v : v)) }
    case 'arc':
      return p
  }
}

type KitchenLayout = 'kitchenette' | 'linear' | 'parallel' | 'l' | 'l-island' | 'u' | 'american' | 'american-l' | 'american-island'

/**
 * Cuisine complète d'un seul bloc : rangées de meubles (mur en haut), évier, plaque, réfrigérateur,
 * lave-vaisselle, îlot ou bar. Les cuisines en L et américaines sont asymétriques (retour à gauche).
 */
export function kitchen(layout: KitchenLayout): DrawFn {
  return (w, d) => {
    const dep = Math.min(600, d * 0.45, w * 0.3)
    const longRun: CellKind[] = ['fridge', 'base', 'sink', 'dishwasher', 'base', 'hob', 'base']
    const out: Primitive[] = []
    switch (layout) {
      case 'kitchenette':
        return runPrimitives(w, d, ['fridge', 'sink', 'base', 'hob'])
      case 'linear':
        return runPrimitives(w, d, longRun)
      case 'parallel': {
        const top = runPrimitives(w, dep, ['fridge', 'base', 'sink', 'dishwasher', 'base'])
        const bottom = runPrimitives(w, dep, ['base', 'hob', 'base']).map((p) => shift(p, 0, d - dep))
        return [...top, ...bottom]
      }
      case 'l':
      case 'l-island': {
        out.push(...runPrimitives(w, dep, ['fridge', 'base', 'sink', 'dishwasher', 'base']))
        out.push(...leftRun(dep, d - dep, dep, ['base', 'hob', 'base']))
        if (layout === 'l-island') {
          const ih = Math.min(900, (d - dep) * 0.45)
          const iw = Math.min(1800, (w - dep) * 0.6)
          const x0 = dep + (w - dep - iw) / 2
          const y0 = dep + (d - dep - ih) / 2
          out.push(...islandPrimitives(x0, y0, iw, ih))
        }
        return out
      }
      case 'u': {
        out.push(...runPrimitives(w, dep, ['base', 'sink', 'dishwasher', 'base']))
        out.push(...leftRun(dep, d - dep, dep, ['fridge', 'base', 'hob', 'base']))
        out.push(...rightRun(w, dep, d - dep, dep, ['base', 'tall', 'base']))
        return out
      }
      case 'american':
      case 'american-l': {
        out.push(...runPrimitives(w, dep, ['fridge', 'base', 'sink', 'dishwasher', 'base', 'hob', 'base']))
        if (layout === 'american-l') out.push(...leftRun(dep, d - dep, dep, ['base', 'tall', 'base']))
        // Bar côté séjour : comptoir avec débord, sur la partie droite seulement.
        const barDepth = Math.min(500, d * 0.22)
        const barLeft = layout === 'american-l' ? dep + (w - dep) * 0.25 : w * 0.3
        out.push(...barPrimitives(barLeft, d - barDepth, w - barLeft, barDepth))
        return out
      }
      case 'american-island': {
        out.push(...runPrimitives(w, dep, ['fridge', 'base', 'sink', 'dishwasher', 'base', 'hob', 'base']))
        const ih = Math.min(900, d * 0.28)
        const x0 = w * 0.22
        out.push(...islandPrimitives(x0, d - ih - Math.min(80, d * 0.03), w * 0.76, ih, true))
        return out
      }
    }
  }
}

function islandPrimitives(x: number, y: number, w: number, h: number, bar = false): Primitive[] {
  const e = Math.min(40, w * 0.05, h * 0.1)
  const out: Primitive[] = [rect(x, y, w, h, 'outline', 14), rect(x + e, y + e, w - e * 2, h - e * 2, 'detail', 8)]
  if (bar) out.push(line([x + e, y + h - e * 2.2, x + w - e, y + h - e * 2.2], 'above'))
  return out
}

function barPrimitives(x: number, y: number, w: number, h: number): Primitive[] {
  const e = Math.min(30, w * 0.05, h * 0.2)
  return [rect(x, y, w, h, 'outline', Math.min(20, h * 0.3)), rect(x + e, y + e, w - e * 2, h - e * 2, 'detail', 8), line([x + e, y + h - e * 2, x + w - e, y + h - e * 2], 'above')]
}
