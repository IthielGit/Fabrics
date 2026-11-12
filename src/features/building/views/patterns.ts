import type { FacadeTexture, HatchPattern } from '../materials'

/**
 * Motifs vectoriels des matières (M10 bis lot C), dessinés pour Fabrics : de simples traits
 * découpés dans un polygone. Les mesures sont des multiples de `unit` (la hauteur des textes du
 * dessin) : sur le papier, l'écartement des traits reste le même quelle que soit l'échelle. Les
 * traits partent d'une grille commune (origine du dessin) : deux morceaux voisins d'un même mur se
 * raccordent sans décalage.
 */
export type Segment = [number, number, number, number]
type Pt = readonly [number, number]

const EPS = 1e-9

function pointInPolygon(x: number, y: number, polygon: readonly Pt[]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]
    const [xj, yj] = polygon[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

/** Morceaux du segment a → b situés dans le polygone (simple, convexe ou non). */
export function clipSegmentToPolygon(a: Pt, b: Pt, polygon: readonly Pt[]): Segment[] {
  if (polygon.length < 3) return []
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const ts = [0, 1]
  for (let i = 0; i < polygon.length; i++) {
    const p = polygon[i]
    const q = polygon[(i + 1) % polygon.length]
    const ex = q[0] - p[0]
    const ey = q[1] - p[1]
    const den = dx * ey - dy * ex
    if (Math.abs(den) < EPS) continue
    const t = ((p[0] - a[0]) * ey - (p[1] - a[1]) * ex) / den
    const s = ((p[0] - a[0]) * dy - (p[1] - a[1]) * dx) / den
    if (t > 0 && t < 1 && s >= -EPS && s <= 1 + EPS) ts.push(t)
  }
  ts.sort((m, n) => m - n)
  const out: Segment[] = []
  for (let i = 0; i < ts.length - 1; i++) {
    const t0 = ts[i]
    const t1 = ts[i + 1]
    if (t1 - t0 < 1e-6) continue
    const tm = (t0 + t1) / 2
    if (!pointInPolygon(a[0] + dx * tm, a[1] + dy * tm, polygon)) continue
    const last = out[out.length - 1]
    const x0 = a[0] + dx * t0
    const y0 = a[1] + dy * t0
    if (last && Math.abs(last[2] - x0) < 1e-6 && Math.abs(last[3] - y0) < 1e-6) {
      last[2] = a[0] + dx * t1
      last[3] = a[1] + dy * t1
    } else {
      out.push([x0, y0, a[0] + dx * t1, a[1] + dy * t1])
    }
  }
  return out
}

interface Frame {
  /** Direction des traits (unitaire). */
  d: Pt
  /** Normale (unitaire). */
  n: Pt
}

function extent(polygon: readonly Pt[], axis: Pt): [number, number] {
  let min = Infinity
  let max = -Infinity
  for (const [x, y] of polygon) {
    const v = x * axis[0] + y * axis[1]
    min = Math.min(min, v)
    max = Math.max(max, v)
  }
  return [min, max]
}

function frameAt(angleDeg: number): Frame {
  const r = (angleDeg * Math.PI) / 180
  return { d: [Math.cos(r), Math.sin(r)], n: [-Math.sin(r), Math.cos(r)] }
}

/** Repère du plus long côté du polygone (fil du bois, sens de l'isolant). */
function longestEdgeFrame(polygon: readonly Pt[]): Frame {
  let best = 0
  let d: Pt = [1, 0]
  for (let i = 0; i < polygon.length; i++) {
    const p = polygon[i]
    const q = polygon[(i + 1) % polygon.length]
    const len = Math.hypot(q[0] - p[0], q[1] - p[1])
    if (len > best) {
      best = len
      d = [(q[0] - p[0]) / len, (q[1] - p[1]) / len]
    }
  }
  // Sens canonique : deux morceaux d'un même mur ont le même repère.
  if (d[0] < -EPS || (Math.abs(d[0]) <= EPS && d[1] < 0)) d = [-d[0], -d[1]]
  return { d, n: [-d[1], d[0]] }
}

const at = (f: Frame, along: number, across: number): Pt => [
  f.d[0] * along + f.n[0] * across,
  f.d[1] * along + f.n[1] * across,
]

/** Traits parallèles à `f.d`, écartés de `spacing`, décalés de `phase`, sur la grille commune. */
function parallelLines(polygon: readonly Pt[], f: Frame, spacing: number, phase = 0): Segment[] {
  const [nMin, nMax] = extent(polygon, f.n)
  const [dMin, dMax] = extent(polygon, f.d)
  const out: Segment[] = []
  for (let k = Math.ceil((nMin - phase) / spacing); k * spacing + phase <= nMax; k++) {
    const o = k * spacing + phase
    out.push(...clipSegmentToPolygon(at(f, dMin - 1, o), at(f, dMax + 1, o), polygon))
  }
  return out
}

/**
 * Appareil en quinconce : rangs écartés de `rowHeight` (traits du repère `f.d`) et joints
 * perpendiculaires tous les `jointSpacing`, décalés d'un demi-pas d'un rang à l'autre.
 */
function staggered(polygon: readonly Pt[], f: Frame, rowHeight: number, jointSpacing: number): Segment[] {
  const out = parallelLines(polygon, f, rowHeight)
  const [nMin, nMax] = extent(polygon, f.n)
  const [dMin, dMax] = extent(polygon, f.d)
  for (let row = Math.floor(nMin / rowHeight); row * rowHeight <= nMax; row++) {
    const shift = row % 2 === 0 ? 0 : jointSpacing / 2
    for (let j = Math.ceil((dMin - shift) / jointSpacing); j * jointSpacing + shift <= dMax; j++) {
      const along = j * jointSpacing + shift
      out.push(...clipSegmentToPolygon(at(f, along, row * rowHeight), at(f, along, (row + 1) * rowHeight), polygon))
    }
  }
  return out
}

/** Points (traits très courts) sur une grille en quinconce. */
function dots(polygon: readonly Pt[], spacing: number, length: number): Segment[] {
  const f = frameAt(0)
  const [xMin, xMax] = extent(polygon, f.d)
  const [yMin, yMax] = extent(polygon, f.n)
  const out: Segment[] = []
  for (let row = Math.ceil(yMin / spacing); row * spacing <= yMax; row++) {
    const shift = row % 2 === 0 ? 0 : spacing / 2
    for (let col = Math.ceil((xMin - shift) / spacing); col * spacing + shift <= xMax; col++) {
      const x = col * spacing + shift
      const y = row * spacing
      out.push(...clipSegmentToPolygon([x - length / 2, y], [x + length / 2, y], polygon))
    }
  }
  return out
}

/** Zigzag d'un bord à l'autre de l'épaisseur (isolant), le long du plus long côté. */
function zigzag(polygon: readonly Pt[], unit: number): Segment[] {
  const f = longestEdgeFrame(polygon)
  const [nMin, nMax] = extent(polygon, f.n)
  const [dMin, dMax] = extent(polygon, f.d)
  const thickness = nMax - nMin
  if (thickness < EPS) return []
  const step = Math.min(thickness, unit * 1.5) / 2
  const out: Segment[] = []
  for (let k = Math.floor(dMin / step); k * step <= dMax; k++) {
    const fromLow = k % 2 === 0
    const a = at(f, k * step, fromLow ? nMin : nMax)
    const b = at(f, (k + 1) * step, fromLow ? nMax : nMin)
    out.push(...clipSegmentToPolygon(a, b, polygon))
  }
  return out
}

/**
 * Hachure d'une matière coupée (coupes, plans de niveau) :
 * béton : traits à 45° serrés ; maçonnerie : traits à 45° espacés ; brique : traits à 45° doublés ;
 * bois : fil le long du plus long côté ; isolant : zigzag ; plaque de plâtre : pointillé fin.
 */
export function hatchSegments(polygon: readonly Pt[], pattern: HatchPattern, unit: number): Segment[] {
  if (polygon.length < 3 || !(unit > 0)) return []
  const diagonal = frameAt(-45)
  switch (pattern) {
    case 'concrete':
      return parallelLines(polygon, diagonal, unit * 0.45)
    case 'masonry':
      return parallelLines(polygon, diagonal, unit * 0.9)
    case 'brick':
      return [...parallelLines(polygon, diagonal, unit * 0.9), ...parallelLines(polygon, diagonal, unit * 0.9, unit * 0.2)]
    case 'wood':
      return parallelLines(polygon, longestEdgeFrame(polygon), unit * 0.35)
    case 'insulation':
      return zigzag(polygon, unit)
    case 'plasterboard':
      return dots(polygon, unit * 0.45, unit * 0.08)
  }
}

/**
 * Texture d'une face vue en façade, dans le repère du dessin (x horizontal, y vertical) :
 * enduit : points épars ; brique : rangs et joints en quinconce ; bardage : lames horizontales ;
 * tuiles : rangs et joints ; ardoises : rangs serrés et joints larges ; zinc : joints debout
 * verticaux ; bac acier : nervures verticales doublées.
 */
export function textureSegments(polygon: readonly Pt[], texture: FacadeTexture, unit: number): Segment[] {
  if (polygon.length < 3 || !(unit > 0)) return []
  const horizontal = frameAt(0)
  const vertical = frameAt(90)
  switch (texture) {
    case 'render':
      return dots(polygon, unit * 1.4, unit * 0.1)
    case 'brick':
      return staggered(polygon, horizontal, unit * 0.5, unit * 1.1)
    case 'cladding':
      return parallelLines(polygon, horizontal, unit * 0.6)
    case 'tiles':
      return staggered(polygon, horizontal, unit * 0.6, unit * 0.45)
    case 'slates':
      return staggered(polygon, horizontal, unit * 0.45, unit * 0.7)
    case 'zinc':
      return parallelLines(polygon, vertical, unit * 1.4)
    case 'steel':
      return [...parallelLines(polygon, vertical, unit), ...parallelLines(polygon, vertical, unit, unit * 0.15)]
  }
}

function bbox(polygon: readonly Pt[]): [number, number, number, number] {
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const [x, y] of polygon) {
    x0 = Math.min(x0, x)
    y0 = Math.min(y0, y)
    x1 = Math.max(x1, x)
    y1 = Math.max(y1, y)
  }
  return [x0, y0, x1, y1]
}

/**
 * Contour d'un groupe de polygones qui se touchent ou se chevauchent (morceaux de murs hachurés),
 * sans les coutures : pour chaque polygone de `which`, les parties de ses côtés qui ne sont pas
 * dans un autre polygone de `all`. Un côté est testé à `gap` mm vers l'extérieur : un côté commun
 * à deux morceaux disparaît, un vrai bord reste.
 */
export function exposedOutline(all: readonly (readonly Pt[])[], which: readonly number[], gap = 0.5): Segment[] {
  const boxes = all.map(bbox)
  const out: Segment[] = []
  for (const i of which) {
    const polygon = all[i]
    if (!polygon || polygon.length < 3) continue
    let area2 = 0
    for (let k = 0; k < polygon.length; k++) {
      const [px, py] = polygon[k]
      const [qx, qy] = polygon[(k + 1) % polygon.length]
      area2 += px * qy - qx * py
    }
    const sign = area2 >= 0 ? 1 : -1
    for (let k = 0; k < polygon.length; k++) {
      const a = polygon[k]
      const b = polygon[(k + 1) % polygon.length]
      const ex = b[0] - a[0]
      const ey = b[1] - a[1]
      const len2 = ex * ex + ey * ey
      if (len2 < gap * gap) continue
      const len = Math.sqrt(len2)
      const nx = (sign * ey * gap) / len
      const ny = (-sign * ex * gap) / len
      const a2: Pt = [a[0] + nx, a[1] + ny]
      const b2: Pt = [b[0] + nx, b[1] + ny]
      const covered: [number, number][] = []
      const [ex0, ey0, ex1, ey1] = bbox([a2, b2])
      all.forEach((other, j) => {
        if (j === i || other.length < 3) return
        const [ox0, oy0, ox1, oy1] = boxes[j]
        if (ox1 < ex0 || ox0 > ex1 || oy1 < ey0 || oy0 > ey1) return
        for (const [sx, sy, tx, ty] of clipSegmentToPolygon(a2, b2, other)) {
          const t0 = ((sx - a2[0]) * ex + (sy - a2[1]) * ey) / len2
          const t1 = ((tx - a2[0]) * ex + (ty - a2[1]) * ey) / len2
          covered.push([Math.min(t0, t1), Math.max(t0, t1)])
        }
      })
      covered.sort((m, n) => m[0] - n[0])
      let t = 0
      const minT = gap / len
      const emit = (from: number, to: number) => {
        if (to - from < minT) return
        out.push([a[0] + ex * from, a[1] + ey * from, a[0] + ex * to, a[1] + ey * to])
      }
      for (const [c0, c1] of covered) {
        if (c0 > t) emit(t, Math.min(c0, 1))
        t = Math.max(t, c1)
        if (t >= 1) break
      }
      if (t < 1) emit(t, 1)
    }
  }
  return out
}
