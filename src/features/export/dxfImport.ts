import DxfParser from 'dxf-parser'
import type {
  IArcEntity,
  IBlock,
  ICircleEntity,
  IDimensionEntity,
  IDxf,
  IEllipseEntity,
  IEntity,
  IInsertEntity,
  ILineEntity,
  ILwpolylineEntity,
  IPoint,
  IPolylineEntity,
  IMtextEntity,
  ISplineEntity,
  ITextEntity,
} from 'dxf-parser'
import type { LineElement, TextElement } from '../../types/document'
import { createTextElement } from '../documents/elements'
import type { Point } from '../geometry/viewport'

/**
 * Import d'un DXF comme calque de fond (M11) : les traits du fichier (lignes, polylignes, arcs,
 * cercles, ellipses, splines, contenus des blocs et des cotes) deviennent des éléments `line`
 * verrouillés, à l'échelle réelle (mm). Les textes (TEXT, MTEXT) deviennent des éléments `text`
 * verrouillés du même groupe ; les hachures ne sont pas reprises.
 */

/** Unité choisie pour lire le fichier. */
export type DxfUnit = 'mm' | 'cm' | 'm' | 'in' | 'ft'

/** Millimètres par unité du fichier. */
export const DXF_UNIT_FACTORS: Record<DxfUnit, number> = { mm: 1, cm: 10, m: 1000, in: 25.4, ft: 304.8 }

/** Unité déclarée par `$INSUNITS` (1 pouce, 2 pied, 4 mm, 5 cm, 6 m), ou `null` si absente ou inconnue. */
export function unitFromInsunits(code: number | null): DxfUnit | null {
  switch (code) {
    case 1:
      return 'in'
    case 2:
      return 'ft'
    case 4:
      return 'mm'
    case 5:
      return 'cm'
    case 6:
      return 'm'
    default:
      return null
  }
}

/** Un trait lu dans le fichier, en unités du fichier, repère DXF (y vers le haut). */
export interface DxfPath {
  points: number[]
  closed: boolean
}

/**
 * Un texte lu dans le fichier : position, hauteur des majuscules et rotation (sens trigonométrique,
 * degrés) dans le repère du fichier (y vers le haut), avec son point d'accroche.
 */
export interface DxfText {
  x: number
  y: number
  /** Hauteur des majuscules, unités du fichier. */
  height: number
  rotation: number
  text: string
  /** Largeur du cadre d'un texte multiligne (unités du fichier), 0 si inconnue. */
  width: number
  /** Accroche horizontale et verticale du point (x, y) sur le texte. */
  halign: 'left' | 'center' | 'right'
  valign: 'baseline' | 'top' | 'middle' | 'bottom'
}

export interface ParsedDxf {
  paths: DxfPath[]
  texts: DxfText[]
  /** Valeur de `$INSUNITS`, ou `null` si le fichier ne la donne pas. */
  insUnits: number | null
}

/** Au-delà, le fichier est refusé : le plan deviendrait trop lent à afficher. */
export const MAX_DXF_PATHS = 20000
/** Nombre maximal de textes repris (les suivants sont ignorés). */
export const MAX_DXF_TEXTS = 5000
/** Profondeur maximale de blocs imbriqués (protège d'un bloc qui s'insère lui-même). */
const MAX_BLOCK_DEPTH = 8
/** Pas angulaire maximal pour découper un arc, en degrés. */
const ARC_STEP_DEGREES = 10

export class DxfReadError extends Error {
  readonly reason: 'unreadable' | 'empty' | 'tooLarge'

  constructor(reason: 'unreadable' | 'empty' | 'tooLarge') {
    super(reason)
    this.name = 'DxfReadError'
    this.reason = reason
  }
}

/** Transformation affine du plan : x' = a·x + c·y + e, y' = b·x + d·y + f. */
type Matrix = [number, number, number, number, number, number]
const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0]

function multiply(m: Matrix, n: Matrix): Matrix {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ]
}

const translate = (x: number, y: number): Matrix => [1, 0, 0, 1, x, y]
const scale = (sx: number, sy: number): Matrix => [sx, 0, 0, sy, 0, 0]
function rotate(degrees: number): Matrix {
  const r = (degrees * Math.PI) / 180
  const c = Math.cos(r)
  const s = Math.sin(r)
  return [c, s, -s, c, 0, 0]
}

/** Entité dans un repère objet dont la normale pointe vers le bas : x est retourné (symétrie). */
function ocs(z: number | undefined): Matrix {
  return z !== undefined && z < 0 ? scale(-1, 1) : IDENTITY
}

/** Points d'un arc de centre (cx, cy), de `start` à `end` (radians, sens trigonométrique). */
function arc(cx: number, cy: number, r: number, start: number, end: number): number[] {
  let sweep = end - start
  while (sweep <= 0) sweep += Math.PI * 2
  const steps = Math.max(2, Math.ceil((sweep * 180) / Math.PI / ARC_STEP_DEGREES))
  const out: number[] = []
  for (let i = 0; i <= steps; i++) {
    const a = start + (sweep * i) / steps
    out.push(cx + r * Math.cos(a), cy + r * Math.sin(a))
  }
  return out
}

/** Points d'un segment courbe de polyligne (`bulge` = tangente du quart de l'angle de l'arc). */
function bulgeArc(x0: number, y0: number, x1: number, y1: number, bulge: number): number[] {
  const dx = x1 - x0
  const dy = y1 - y0
  const chord = Math.hypot(dx, dy)
  if (chord === 0 || Math.abs(bulge) < 1e-9) return [x1, y1]
  const theta = 4 * Math.atan(bulge)
  const r = chord / (2 * Math.sin(Math.abs(theta) / 2))
  // Le centre est sur la médiatrice de la corde, à gauche pour un arc tourné dans le sens direct.
  const dist = ((chord / 2) * (1 - bulge * bulge)) / (2 * bulge)
  const cx = (x0 + x1) / 2 - (dy / chord) * dist
  const cy = (y0 + y1) / 2 + (dx / chord) * dist
  const start = Math.atan2(y0 - cy, x0 - cx)
  const steps = Math.max(2, Math.ceil((Math.abs(theta) * 180) / Math.PI / ARC_STEP_DEGREES))
  const out: number[] = []
  for (let i = 1; i <= steps; i++) {
    const a = start + (theta * i) / steps
    out.push(cx + r * Math.cos(a), cy + r * Math.sin(a))
  }
  // Dernier point exactement sur le sommet suivant.
  out[out.length - 2] = x1
  out[out.length - 1] = y1
  return out
}

function polylinePoints(vertices: readonly (IPoint & { bulge?: number })[], closed: boolean): number[] {
  const out: number[] = []
  if (vertices.length === 0) return out
  out.push(vertices[0].x, vertices[0].y)
  const count = closed ? vertices.length : vertices.length - 1
  for (let i = 0; i < count; i++) {
    const a = vertices[i]
    const b = vertices[(i + 1) % vertices.length]
    out.push(...bulgeArc(a.x, a.y, b.x, b.y, a.bulge ?? 0))
  }
  // Une polyligne fermée revient à son premier point : on retire ce doublon.
  if (closed && out.length >= 4) out.splice(out.length - 2, 2)
  return out
}

/** Courbe B-spline (algorithme de De Boor), échantillonnée ; à défaut, ses points de contrôle. */
function splinePoints(spline: ISplineEntity): number[] {
  const control = spline.controlPoints ?? []
  const knots = spline.knotValues ?? []
  const degree = spline.degreeOfSplineCurve ?? 3
  if (control.length > degree && knots.length === control.length + degree + 1) {
    const lo = knots[degree]
    const hi = knots[control.length]
    const samples = Math.max(16, control.length * 8)
    const out: number[] = []
    for (let s = 0; s <= samples; s++) {
      const t = lo + ((hi - lo) * s) / samples
      let k = degree
      while (k < control.length - 1 && t >= knots[k + 1]) k++
      const d = Array.from({ length: degree + 1 }, (_, j) => ({ ...control[j + k - degree] }))
      for (let r = 1; r <= degree; r++) {
        for (let j = degree; j >= r; j--) {
          const i = j + k - degree
          const denom = knots[i + degree - r + 1] - knots[i]
          const alpha = denom === 0 ? 0 : (t - knots[i]) / denom
          d[j] = { x: (1 - alpha) * d[j - 1].x + alpha * d[j].x, y: (1 - alpha) * d[j - 1].y + alpha * d[j].y, z: 0 }
        }
      }
      out.push(d[degree].x, d[degree].y)
    }
    return out
  }
  const fit = spline.fitPoints && spline.fitPoints.length >= 2 ? spline.fitPoints : control
  return fit.flatMap((p) => [p.x, p.y])
}

function ellipsePoints(e: IEllipseEntity): number[] {
  const mx = e.majorAxisEndPoint.x
  const my = e.majorAxisEndPoint.y
  const ratio = e.axisRatio || 1
  // Petit axe : grand axe tourné d'un quart de tour, multiplié par le rapport.
  const nx = -my * ratio
  const ny = mx * ratio
  let start = e.startAngle ?? 0
  let end = e.endAngle ?? Math.PI * 2
  if (end <= start) end += Math.PI * 2
  if (Math.abs(end - start - Math.PI * 2) < 1e-9) {
    start = 0
    end = Math.PI * 2
  }
  const steps = Math.max(8, Math.ceil(((end - start) * 180) / Math.PI / ARC_STEP_DEGREES))
  const out: number[] = []
  for (let i = 0; i <= steps; i++) {
    const t = start + ((end - start) * i) / steps
    out.push(e.center.x + mx * Math.cos(t) + nx * Math.sin(t), e.center.y + my * Math.cos(t) + ny * Math.sin(t))
  }
  return out
}

function apply(m: Matrix, points: readonly number[]): number[] {
  const out: number[] = []
  for (let i = 0; i + 1 < points.length; i += 2) {
    const x = points[i]
    const y = points[i + 1]
    out.push(m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5])
  }
  return out
}

interface Collector {
  paths: DxfPath[]
  texts: DxfText[]
  blocks: Record<string, IBlock>
}

function push(collector: Collector, m: Matrix, points: number[], closed: boolean): void {
  if (points.length < 4 || points.some((v) => !Number.isFinite(v))) return
  collector.paths.push({ points: apply(m, points), closed })
  if (collector.paths.length > MAX_DXF_PATHS) throw new DxfReadError('tooLarge')
}

/**
 * Texte lisible d'un TEXT ou MTEXT : codes de mise en forme retirés (`\\P` = retour à la ligne),
 * `\\U+00E9` et `%%c` `%%d` `%%p` remplacés par leur caractère.
 */
export function cleanDxfText(raw: string): string {
  return raw
    .replace(/\\U\+([0-9a-fA-F]{4})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\S([^;^]*)[\^/#]([^;]*);/g, '$1/$2')
    .replace(/\\[fFHWTQCcAa][^;]*;/g, '')
    .replace(/\\[LlOoKk]/g, '')
    .replace(/\\P/g, '\n')
    .replace(/\\~/g, ' ')
    .replace(/\\([\\{}])/g, '$1')
    .replace(/[{}]/g, '')
    .replace(/%%[cC]/g, 'Ø')
    .replace(/%%[dD]/g, '°')
    .replace(/%%[pP]/g, '±')
    .replace(/%%[uUoO]/g, '')
    .replace(/%%%/g, '%')
    .trim()
}

const MTEXT_H: Record<number, DxfText['halign']> = { 1: 'left', 2: 'center', 3: 'right', 4: 'left', 5: 'center', 6: 'right', 7: 'left', 8: 'center', 9: 'right' }
const MTEXT_V: Record<number, DxfText['valign']> = { 1: 'top', 2: 'top', 3: 'top', 4: 'middle', 5: 'middle', 6: 'middle', 7: 'bottom', 8: 'bottom', 9: 'bottom' }

/** Ajoute un texte, transformé par la matrice (position, échelle, rotation du bloc qui le contient). */
function pushText(collector: Collector, m: Matrix, text: Omit<DxfText, 'text'> & { text: string }): void {
  const clean = cleanDxfText(text.text)
  const factor = Math.hypot(m[0], m[1])
  if (!clean || !(text.height > 0) || !Number.isFinite(text.x) || !Number.isFinite(text.y)) return
  if (collector.texts.length >= MAX_DXF_TEXTS) return
  const [x, y] = apply(m, [text.x, text.y])
  collector.texts.push({
    ...text,
    text: clean,
    x,
    y,
    height: text.height * factor,
    width: text.width * factor,
    rotation: text.rotation + (Math.atan2(m[1], m[0]) * 180) / Math.PI,
  })
}

function insertBlock(collector: Collector, name: string, m: Matrix, depth: number): void {
  const block = collector.blocks[name]
  if (!block || depth > MAX_BLOCK_DEPTH) return
  const base = block.position ?? { x: 0, y: 0, z: 0 }
  const inner = multiply(m, translate(-base.x, -base.y))
  for (const entity of block.entities ?? []) collect(collector, entity, inner, depth + 1)
}

function collect(collector: Collector, entity: IEntity, m: Matrix, depth: number): void {
  if (entity.visible === false) return
  switch (entity.type) {
    case 'LINE': {
      const [a, b] = (entity as ILineEntity).vertices ?? []
      if (a && b) push(collector, m, [a.x, a.y, b.x, b.y], false)
      return
    }
    case 'LWPOLYLINE': {
      const p = entity as ILwpolylineEntity
      push(collector, multiply(m, ocs(p.extrusionDirectionZ)), polylinePoints(p.vertices ?? [], p.shape), p.shape)
      return
    }
    case 'POLYLINE': {
      const p = entity as IPolylineEntity
      // Maillages 3D et faces : pas de trait de plan.
      if (p.is3dPolygonMesh || p.isPolyfaceMesh) return
      const vertices = (p.vertices ?? []).filter((v) => !v.splineControlPoint)
      push(collector, multiply(m, ocs(p.extrusionDirection?.z)), polylinePoints(vertices, p.shape), p.shape)
      return
    }
    case 'CIRCLE': {
      const c = entity as ICircleEntity & { extrusionDirectionZ?: number }
      const points = arc(c.center.x, c.center.y, c.radius, 0, Math.PI * 2)
      points.splice(points.length - 2, 2)
      push(collector, multiply(m, ocs(c.extrusionDirectionZ)), points, true)
      return
    }
    case 'ARC': {
      const a = entity as IArcEntity
      push(collector, multiply(m, ocs(a.extrusionDirectionZ)), arc(a.center.x, a.center.y, a.radius, a.startAngle, a.endAngle), false)
      return
    }
    case 'ELLIPSE':
      push(collector, m, ellipsePoints(entity as IEllipseEntity), false)
      return
    case 'SPLINE': {
      const s = entity as ISplineEntity
      push(collector, m, splinePoints(s), s.closed)
      return
    }
    case 'TEXT': {
      const t = entity as ITextEntity
      // Texte aligné (centre, droite…) : le point d'accroche est le second point (groupe 11).
      const aligned = (t.halign ?? 0) > 0 && t.endPoint !== undefined
      const anchor = aligned ? t.endPoint : t.startPoint
      if (!anchor) return
      pushText(collector, m, {
        x: anchor.x,
        y: anchor.y,
        height: t.textHeight,
        rotation: t.rotation ?? 0,
        text: t.text ?? '',
        width: 0,
        halign: aligned ? (t.halign === 2 ? 'right' : 'center') : 'left',
        valign: 'baseline',
      })
      return
    }
    case 'MTEXT': {
      const t = entity as IMtextEntity
      if (!t.position) return
      const direction = t.directionVector
      const rotation = direction ? (Math.atan2(direction.y, direction.x) * 180) / Math.PI : (t.rotation ?? 0)
      pushText(collector, m, {
        x: t.position.x,
        y: t.position.y,
        height: t.height,
        rotation,
        text: t.text ?? '',
        width: t.width ?? 0,
        halign: MTEXT_H[t.attachmentPoint] ?? 'left',
        valign: MTEXT_V[t.attachmentPoint] ?? 'top',
      })
      return
    }
    case 'INSERT': {
      const insert = entity as IInsertEntity
      const position = insert.position ?? { x: 0, y: 0, z: 0 }
      const sx = insert.xScale ?? 1
      const sy = insert.yScale ?? 1
      const columns = Math.max(1, Math.min(insert.columnCount ?? 1, 100))
      const rows = Math.max(1, Math.min(insert.rowCount ?? 1, 100))
      const base = multiply(multiply(m, ocs(insert.extrusionDirection?.z)), translate(position.x, position.y))
      const turned = multiply(base, rotate(insert.rotation ?? 0))
      for (let col = 0; col < columns; col++) {
        for (let row = 0; row < rows; row++) {
          const offset = translate(col * (insert.columnSpacing ?? 0), row * (insert.rowSpacing ?? 0))
          insertBlock(collector, insert.name, multiply(multiply(turned, offset), scale(sx, sy)), depth)
        }
      }
      return
    }
    case 'DIMENSION': {
      // Le dessin d'une cote (traits, flèches) est rangé dans un bloc anonyme, déjà à sa place.
      const block = (entity as IDimensionEntity).block
      if (block) insertBlock(collector, block, m, depth)
      return
    }
    default:
      return
  }
}

/** Points de deux traits qui se touchent (unités du fichier). */
function samePoint(ax: number, ay: number, bx: number, by: number): boolean {
  return Math.abs(ax - bx) < 1e-6 && Math.abs(ay - by) < 1e-6
}

/**
 * Réunit les traits ouverts qui se suivent (fin de l'un = début du suivant) : un plan fait de
 * milliers de lignes séparées donne beaucoup moins d'éléments.
 */
export function chainPaths(paths: readonly DxfPath[]): DxfPath[] {
  const out: DxfPath[] = []
  for (const path of paths) {
    const last = out[out.length - 1]
    if (
      last &&
      !last.closed &&
      !path.closed &&
      samePoint(last.points[last.points.length - 2], last.points[last.points.length - 1], path.points[0], path.points[1])
    ) {
      last.points.push(...path.points.slice(2))
    } else {
      out.push({ points: [...path.points], closed: path.closed })
    }
  }
  return out
}

/** Lit le texte d'un fichier DXF. Lance `DxfReadError` s'il est illisible, vide ou trop lourd. */
export function parseDxfText(text: string): ParsedDxf {
  let dxf: IDxf | null
  try {
    dxf = new DxfParser().parseSync(text)
  } catch {
    throw new DxfReadError('unreadable')
  }
  if (!dxf) throw new DxfReadError('unreadable')
  const collector: Collector = { paths: [], texts: [], blocks: dxf.blocks ?? {} }
  for (const entity of dxf.entities ?? []) {
    if (entity.inPaperSpace) continue // présentation (cartouche, fenêtres) : pas le dessin
    collect(collector, entity, IDENTITY, 0)
  }
  const paths = chainPaths(collector.paths)
  if (paths.length === 0 && collector.texts.length === 0) throw new DxfReadError('empty')
  const units = dxf.header?.$INSUNITS
  return { paths, texts: collector.texts, insUnits: typeof units === 'number' ? units : null }
}

export interface DxfExtent {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

/** Boîte englobante des traits (unités et repère du fichier). */
export function pathsExtent(paths: readonly DxfPath[]): DxfExtent | null {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const { points } of paths) {
    for (let i = 0; i + 1 < points.length; i += 2) {
      minX = Math.min(minX, points[i])
      maxX = Math.max(maxX, points[i])
      minY = Math.min(minY, points[i + 1])
      maxY = Math.max(maxY, points[i + 1])
    }
  }
  return Number.isFinite(minX) ? { minX, minY, maxX, maxY } : null
}

/** Boîte englobante des traits, ou à défaut des points d'insertion des textes (unités du fichier). */
function fitExtent(paths: readonly DxfPath[], texts: readonly DxfText[]): DxfExtent | null {
  const extent = pathsExtent(paths)
  if (extent || texts.length === 0) return extent
  return pathsExtent([{ points: texts.flatMap((t) => [t.x, t.y]), closed: false }])
}

/** Couleur des traits d'un fond DXF : gris, pour se distinguer du dessin de Fabrics. */
export const DXF_BACKGROUND_STROKE = '#94a3b8'

const round = (value: number) => Math.round(value * 1000) / 1000

/**
 * Traits du fichier en éléments `line` du plan, à l'échelle : `factor` mm par unité, axe y retourné
 * (le haut du dessin reste en haut), dessin centré sur `center`. Tous verrouillés et liés par
 * `groupId` (une seule ligne dans les calques).
 */
export function dxfPathsToLines(
  paths: readonly DxfPath[],
  factor: number,
  center: Point,
  meta: { name: string; groupId: string; levelId?: string },
  texts: readonly DxfText[] = [],
): LineElement[] {
  const extent = fitExtent(paths, texts)
  if (!extent) return []
  const cx = ((extent.minX + extent.maxX) / 2) * factor
  const cy = (-(extent.minY + extent.maxY) / 2) * factor
  const dx = center.x - cx
  const dy = center.y - cy
  return paths.map((path) => {
    const points: number[] = []
    for (let i = 0; i + 1 < path.points.length; i += 2) {
      points.push(round(path.points[i] * factor + dx), round(-path.points[i + 1] * factor + dy))
    }
    if (path.closed) points.push(points[0], points[1])
    return {
      id: crypto.randomUUID(),
      type: 'line',
      name: meta.name,
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 1,
      locked: true,
      hidden: false,
      ...(meta.levelId ? { levelId: meta.levelId } : {}),
      points,
      stroke: DXF_BACKGROUND_STROKE,
      strokeWidth: 1,
      arrowEnd: false,
      groupId: meta.groupId,
    }
  })
}

/** Part de la taille de police (Konva) que représente la hauteur des majuscules. */
const CAP_RATIO = 0.7
/** Distance de la ligne de base au haut du texte, en part de la taille de police. */
const BASELINE_RATIO = 0.8
/** Largeur moyenne d'un caractère, en part de la taille de police (pour centrer ou aligner à droite). */
const CHAR_WIDTH_RATIO = 0.6

/**
 * Textes du fichier en éléments `text` du plan, à l'échelle (même centrage que les traits), verrouillés
 * et du même groupe. La hauteur des majuscules du fichier (mm) donne la taille de police ; le point
 * d'accroche du fichier (ligne de base, haut, milieu, centre, droite) est ramené au coin haut-gauche.
 * Le texte est tourné autour de ce coin ; l'axe y est retourné, donc le sens de rotation aussi.
 */
export function dxfTextsToElements(
  paths: readonly DxfPath[],
  texts: readonly DxfText[],
  factor: number,
  center: Point,
  meta: { name: string; groupId: string; levelId?: string },
): TextElement[] {
  const extent = fitExtent(paths, texts)
  if (!extent) return []
  const dx = center.x - ((extent.minX + extent.maxX) / 2) * factor
  const dy = center.y + ((extent.minY + extent.maxY) / 2) * factor
  return texts.map((t) => {
    const fontSize = round((t.height * factor) / CAP_RATIO)
    const lines = t.text.split('\n')
    const longest = Math.max(...lines.map((line) => line.length))
    const estimated = longest * fontSize * CHAR_WIDTH_RATIO
    const width = t.width > 0 ? t.width * factor : Math.max(estimated, fontSize)
    const blockHeight = lines.length * fontSize * 1.2
    // Décalage du point d'accroche au coin haut-gauche, dans le repère du texte (y vers le bas).
    const shiftX = t.halign === 'center' ? -width / 2 : t.halign === 'right' ? -width : 0
    const shiftY =
      t.valign === 'baseline'
        ? -fontSize * BASELINE_RATIO
        : t.valign === 'middle'
          ? -blockHeight / 2
          : t.valign === 'bottom'
            ? -blockHeight
            : 0
    const angle = (-t.rotation * Math.PI) / 180
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const element = createTextElement(meta.name, 0, 0, t.text, fontSize)
    return {
      ...element,
      x: round(t.x * factor + dx + shiftX * cos - shiftY * sin),
      y: round(-t.y * factor + dy + shiftX * sin + shiftY * cos),
      rotation: round((-t.rotation + 360) % 360),
      width: round(width),
      locked: true,
      groupId: meta.groupId,
      ...(meta.levelId ? { levelId: meta.levelId } : {}),
    }
  })
}
