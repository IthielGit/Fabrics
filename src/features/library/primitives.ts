import type { Primitive, PrimitiveStyle } from './types'

// Aides de dessin : elles évitent d'écrire des objets à la main dans les gabarits.

export function rect(
  x: number,
  y: number,
  w: number,
  h: number,
  style: PrimitiveStyle,
  r?: number,
): Primitive {
  return r ? { kind: 'rect', x, y, w, h, r, style } : { kind: 'rect', x, y, w, h, style }
}

export function circle(cx: number, cy: number, r: number, style: PrimitiveStyle): Primitive {
  return { kind: 'circle', cx, cy, r, style }
}

export function ellipse(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  style: PrimitiveStyle,
): Primitive {
  return { kind: 'ellipse', cx, cy, rx, ry, style }
}

export function line(points: number[], style: PrimitiveStyle): Primitive {
  return { kind: 'line', points, style }
}

export function polygon(points: number[], style: PrimitiveStyle): Primitive {
  return { kind: 'polygon', points, style }
}

export function arc(
  cx: number,
  cy: number,
  r: number,
  from: number,
  to: number,
  style: PrimitiveStyle,
): Primitive {
  return { kind: 'arc', cx, cy, r, from, to, style }
}

/** Points d'un arc de cercle (un point tous les `stepDegrees` degrés au plus), `[x1, y1, x2, y2, …]`. */
export function arcPoints(
  cx: number,
  cy: number,
  r: number,
  from: number,
  to: number,
  stepDegrees = 5,
): number[] {
  const sweep = to - from
  const steps = Math.max(1, Math.ceil(Math.abs(sweep) / stepDegrees))
  const points: number[] = []
  for (let i = 0; i <= steps; i++) {
    const angle = ((from + (sweep * i) / steps) * Math.PI) / 180
    points.push(cx + r * Math.cos(angle), cy + r * Math.sin(angle))
  }
  return points
}

/** Même dessin dans un autre style (par exemple tout en pointillé pour un élément au-dessus du plan de coupe). */
export function restyle(primitives: readonly Primitive[], style: PrimitiveStyle): Primitive[] {
  return primitives.map((p): Primitive => ({ ...p, style }))
}

/** Points d'un arc d'ellipse (angles en degrés, comme `arcPoints`), `[x1, y1, x2, y2, …]`. */
export function ellipseArcPoints(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  from: number,
  to: number,
  stepDegrees = 6,
): number[] {
  const sweep = to - from
  const steps = Math.max(1, Math.ceil(Math.abs(sweep) / stepDegrees))
  const points: number[] = []
  for (let i = 0; i <= steps; i++) {
    const angle = ((from + (sweep * i) / steps) * Math.PI) / 180
    points.push(cx + rx * Math.cos(angle), cy + ry * Math.sin(angle))
  }
  return points
}

/** Symétrie gauche / droite d'une liste de coordonnées à plat : x → largeur − x. */
function mirrorFlat(points: readonly number[], width: number): number[] {
  return points.map((value, index) => (index % 2 === 0 ? width - value : value))
}

/**
 * Retourne un dessin gauche / droite dans une boîte de largeur `width` (la boîte reste la même).
 * Deux retournements redonnent le dessin d'origine.
 */
export function mirrorPrimitives(primitives: readonly Primitive[], width: number): Primitive[] {
  return primitives.map((p): Primitive => {
    switch (p.kind) {
      case 'rect':
        return { ...p, x: width - p.x - p.w }
      case 'circle':
      case 'ellipse':
        return { ...p, cx: width - p.cx }
      case 'line':
      case 'polygon':
        return { ...p, points: mirrorFlat(p.points, width) }
      case 'arc':
        // Un angle θ devient 180° − θ ; le sens de parcours s'inverse, donc from et to s'échangent.
        return { ...p, cx: width - p.cx, from: 180 - p.to, to: 180 - p.from }
    }
  })
}

/** Plus petite boîte qui contient les primitives (sans l'épaisseur des traits), ou `null` si vide. */
export function primitivesBounds(
  primitives: readonly Primitive[],
): { minX: number; minY: number; maxX: number; maxY: number } | null {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  const add = (x: number, y: number) => {
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
  }
  for (const p of primitives) {
    switch (p.kind) {
      case 'rect':
        add(p.x, p.y)
        add(p.x + p.w, p.y + p.h)
        break
      case 'circle':
        add(p.cx - p.r, p.cy - p.r)
        add(p.cx + p.r, p.cy + p.r)
        break
      case 'ellipse':
        add(p.cx - p.rx, p.cy - p.ry)
        add(p.cx + p.rx, p.cy + p.ry)
        break
      case 'line':
      case 'polygon':
        for (let i = 0; i + 1 < p.points.length; i += 2) add(p.points[i], p.points[i + 1])
        break
      case 'arc': {
        const points = arcPoints(p.cx, p.cy, p.r, p.from, p.to)
        for (let i = 0; i + 1 < points.length; i += 2) add(points[i], points[i + 1])
        break
      }
    }
  }
  return minX === Infinity ? null : { minX, minY, maxX, maxY }
}
