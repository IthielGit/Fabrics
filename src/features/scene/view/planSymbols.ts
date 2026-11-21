/**
 * Escaliers et mobilier de Pascal sur les plans de niveau de Fabrics (ADR 0007, M20 20.1a).
 *
 * Fabrics dessine les feuilles ; pour les escaliers et les objets du catalogue de Pascal, il reprend
 * leur géométrie de plan (`def.floorplan`, partie « modèle », sans les annotations américaines) et la
 * convertit en traits de son dessin. Un escalier ou un meuble apparaît donc comme dans l'éditeur 2D.
 *
 * Règles de conversion (géométrie de Pascal en mètres, plan x / z → dessin x / y en mm) :
 * - contour tracé : traits ; gris clair (mobilier) → filet gris ; tireté → trait pointillé ;
 * - fond blanc : masque blanc sans contour (un WC cache le sol sous lui) ;
 * - bande sombre étroite sans contour (nez de marche de Pascal, 40 mm) : un filet sur son axe, comme
 *   une ligne de marche d'un plan à la française ;
 * - autres fonds sombres sans contour et textes (étiquettes anglaises `WC`, `LAV`…) : non repris.
 */
import type { FloorplanGeometry } from '@pascal-app/core'
import type { DrawLine, DrawPolygon, PlanOverlay } from '../../building/views/drawing'

type Pt = [number, number]

/** Symboles de Pascal convertis, en mm dans le repère du plan (y vers le bas). */
export interface PlanSymbols extends PlanOverlay {
  polygons: DrawPolygon[]
}

const M_TO_MM = 1000
const ARC_STEPS_PER_RAD = 8
const CURVE_STEPS = 12

/** Couleur sans trait : absente, `none` ou transparente. */
function isNone(color: string | undefined): boolean {
  if (!color || color === 'none' || color === 'transparent') return true
  const rgba = /rgba\([^)]*,\s*([\d.]+)\s*\)/.exec(color)
  return rgba ? Number(rgba[1]) < 0.1 : false
}

/** Composantes RVB (0-255) d'une couleur `#rgb`, `#rrggbb` ou `rgb(a)(…)` ; `null` si inconnue. */
function rgbOf(color: string): [number, number, number] | null {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim())
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join('') : hex[1]
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number]
  }
  const fn = /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/.exec(color)
  return fn ? [Number(fn[1]), Number(fn[2]), Number(fn[3])] : null
}

const lightness = (color: string) => {
  const rgb = rgbOf(color)
  return rgb ? (rgb[0] + rgb[1] + rgb[2]) / 3 : 0
}

/** Fond blanc (masque) : blanc ou presque. */
const isWhite = (color: string | undefined) => !isNone(color) && lightness(color!) >= 245

/** Trait gris clair (mobilier) plutôt que noir. */
const isMuted = (color: string) => lightness(color) >= 120

/** Arc SVG (paramétrage par les extrémités) aplati en points, sans le point de départ. */
function arcPoints(from: Pt, rx: number, ry: number, phiDeg: number, largeArc: boolean, sweep: boolean, to: Pt): Pt[] {
  if (rx === 0 || ry === 0) return [to]
  const phi = (phiDeg * Math.PI) / 180
  const cos = Math.cos(phi)
  const sin = Math.sin(phi)
  const dx = (from[0] - to[0]) / 2
  const dy = (from[1] - to[1]) / 2
  const x1 = cos * dx + sin * dy
  const y1 = -sin * dx + cos * dy
  let a = Math.abs(rx)
  let b = Math.abs(ry)
  const lambda = (x1 * x1) / (a * a) + (y1 * y1) / (b * b)
  if (lambda > 1) {
    a *= Math.sqrt(lambda)
    b *= Math.sqrt(lambda)
  }
  const num = a * a * b * b - a * a * y1 * y1 - b * b * x1 * x1
  const den = a * a * y1 * y1 + b * b * x1 * x1
  const k = (largeArc === sweep ? -1 : 1) * Math.sqrt(Math.max(0, num / den))
  const cx1 = (k * a * y1) / b
  const cy1 = (-k * b * x1) / a
  const cx = cos * cx1 - sin * cy1 + (from[0] + to[0]) / 2
  const cy = sin * cx1 + cos * cy1 + (from[1] + to[1]) / 2
  const angle = (ux: number, uy: number, vx: number, vy: number) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy)
  const t1 = angle(1, 0, (x1 - cx1) / a, (y1 - cy1) / b)
  let dt = angle((x1 - cx1) / a, (y1 - cy1) / b, (-x1 - cx1) / a, (-y1 - cy1) / b)
  if (!sweep && dt > 0) dt -= 2 * Math.PI
  if (sweep && dt < 0) dt += 2 * Math.PI
  const steps = Math.max(2, Math.ceil(Math.abs(dt) * ARC_STEPS_PER_RAD))
  const out: Pt[] = []
  for (let i = 1; i <= steps; i++) {
    const t = t1 + (dt * i) / steps
    const ex = a * Math.cos(t)
    const ey = b * Math.sin(t)
    out.push(i === steps ? to : [cos * ex - sin * ey + cx, sin * ex + cos * ey + cy])
  }
  return out
}

/** Chemin SVG (`M L H V C Q A Z`, absolus et relatifs) aplati en lignes brisées ; `closed` si `Z`. */
export function flattenSvgPath(d: string): { points: Pt[]; closed: boolean }[] {
  const tokens = d.match(/[MLHVCQAZmlhvcqaz]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g) ?? []
  const runs: { points: Pt[]; closed: boolean }[] = []
  let current: { points: Pt[]; closed: boolean } | null = null
  let pos: Pt = [0, 0]
  let start: Pt = [0, 0]
  let command = ''
  let i = 0
  const num = () => Number(tokens[i++])
  const push = (p: Pt) => {
    if (!current) {
      current = { points: [pos], closed: false }
      runs.push(current)
    }
    current.points.push(p)
    pos = p
  }
  while (i < tokens.length) {
    if (/[a-z]/i.test(tokens[i])) command = tokens[i++]
    const rel = command === command.toLowerCase()
    const base = (x: number, y: number): Pt => (rel ? [pos[0] + x, pos[1] + y] : [x, y])
    switch (command.toUpperCase()) {
      case 'M': {
        pos = base(num(), num())
        start = pos
        current = { points: [pos], closed: false }
        runs.push(current)
        command = rel ? 'l' : 'L' // les paires suivantes sont des lignes
        break
      }
      case 'L':
        push(base(num(), num()))
        break
      case 'H': {
        const x = num()
        push([rel ? pos[0] + x : x, pos[1]])
        break
      }
      case 'V': {
        const y = num()
        push([pos[0], rel ? pos[1] + y : y])
        break
      }
      case 'C':
      case 'Q': {
        const cubic = command.toUpperCase() === 'C'
        const c1 = base(num(), num())
        const c2 = cubic ? base(num(), num()) : c1
        const end = base(num(), num())
        const p0 = pos
        for (let s = 1; s <= CURVE_STEPS; s++) {
          const t = s / CURVE_STEPS
          const u = 1 - t
          const p: Pt = cubic
            ? [
                u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * end[0],
                u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * end[1],
              ]
            : [u * u * p0[0] + 2 * u * t * c1[0] + t * t * end[0], u * u * p0[1] + 2 * u * t * c1[1] + t * t * end[1]]
          push(s === CURVE_STEPS ? end : p)
        }
        break
      }
      case 'A': {
        const rx = num()
        const ry = num()
        const phi = num()
        const large = num() !== 0
        const sweep = num() !== 0
        const end = base(num(), num())
        for (const p of arcPoints(pos, rx, ry, phi, large, sweep, end)) push(p)
        break
      }
      case 'Z': {
        if (current) current.closed = true
        pos = start
        current = null
        break
      }
      default:
        i++ // jeton inattendu : ignoré
    }
  }
  return runs.filter((r) => r.points.length >= 2)
}

const mm = (p: readonly [number, number]): Pt => [p[0] * M_TO_MM, p[1] * M_TO_MM]

function circlePoints(cx: number, cy: number, r: number): Pt[] {
  const steps = 32
  return Array.from({ length: steps }, (_, k) => {
    const t = (2 * Math.PI * k) / steps
    return [cx + r * Math.cos(t), cy + r * Math.sin(t)] as Pt
  })
}

/** Largeur maximale d'une bande sombre lue comme une ligne de marche, mm. */
const STRIP_MAX_MM = 60

/** Axe d'un rectangle étroit (de milieu de petit côté à milieu de petit côté) ; `null` s'il est large. */
function stripAxis(p: Pt[]): { x1: number; y1: number; x2: number; y2: number } | null {
  const len = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1])
  const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  const [a, b, c, d] = p
  const short01 = len(a, b) <= len(b, c)
  const width = Math.min(len(a, b), len(b, c))
  if (width > STRIP_MAX_MM) return null
  const [m1, m2] = short01 ? [mid(a, b), mid(c, d)] : [mid(b, c), mid(d, a)]
  return { x1: m1[0], y1: m1[1], x2: m2[0], y2: m2[1] }
}

type Styled = { fill?: string; stroke?: string; strokeWidth?: number; strokeDasharray?: string }

/** Géométrie de plan de Pascal (m) → polygones et traits du dessin de Fabrics (mm, repère du plan). */
export function floorplanToDrawing(geometry: FloorplanGeometry | null | undefined): PlanSymbols {
  const out: PlanSymbols = { polygons: [], lines: [], texts: [] }
  const emit = (points: Pt[], closed: boolean, style: Styled) => {
    if (points.length < 2) return
    if (closed && points.length >= 3 && isWhite(style.fill)) {
      out.polygons.push({ points, fill: 'white', edges: points.map(() => false) })
    }
    if (isNone(style.stroke)) {
      const strip = closed && points.length === 4 && !isNone(style.fill) && lightness(style.fill!) < 100 ? stripAxis(points) : null
      if (strip) out.lines.push({ ...strip, weight: 'hair' })
      return
    }
    const muted = isMuted(style.stroke!)
    const dashed = !!style.strokeDasharray && style.strokeDasharray !== 'none'
    const weight: DrawLine['weight'] = muted || (style.strokeWidth ?? 0) < 0.02 ? 'hair' : 'normal'
    const count = closed ? points.length : points.length - 1
    for (let k = 0; k < count; k++) {
      const [x1, y1] = points[k]
      const [x2, y2] = points[(k + 1) % points.length]
      if (x1 === x2 && y1 === y2) continue
      out.lines.push({ x1, y1, x2, y2, weight, ...(muted ? { muted: true } : {}), ...(dashed ? { dashed: true } : {}) })
    }
  }
  const walk = (g: FloorplanGeometry | null | undefined) => {
    if (!g) return
    const node = g as FloorplanGeometry & Styled & { kind: string; children?: FloorplanGeometry[] }
    switch (node.kind) {
      case 'group':
        for (const child of node.children ?? []) walk(child)
        break
      case 'polygon':
      case 'polyline': {
        const points = (node as { points: readonly (readonly [number, number])[] }).points.map(mm)
        emit(points, node.kind === 'polygon', node)
        break
      }
      case 'rect': {
        const { x, y, width, height } = node as { x: number; y: number; width: number; height: number }
        emit([mm([x, y]), mm([x + width, y]), mm([x + width, y + height]), mm([x, y + height])], true, node)
        break
      }
      case 'circle': {
        const { cx, cy, r } = node as { cx: number; cy: number; r: number }
        emit(circlePoints(cx, cy, r).map(mm), true, node)
        break
      }
      case 'line': {
        const { x1, y1, x2, y2 } = node as { x1: number; y1: number; x2: number; y2: number }
        emit([mm([x1, y1]), mm([x2, y2])], false, node)
        break
      }
      case 'path':
        for (const run of flattenSvgPath((node as { d: string }).d)) emit(run.points.map(mm), run.closed, node)
        break
      default:
        break // textes et autres : non repris
    }
  }
  walk(geometry)
  return out
}

/** Réunit les symboles de plusieurs objets. */
export function mergeSymbols(parts: readonly PlanSymbols[]): PlanSymbols {
  return {
    polygons: parts.flatMap((p) => p.polygons),
    lines: parts.flatMap((p) => p.lines),
    texts: parts.flatMap((p) => p.texts),
  }
}
