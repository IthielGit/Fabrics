import type {
  CanvasElement,
  FabricsDocument,
  FurnitureElement,
  OpeningElement,
  WallElement,
} from '../../types/document'
import { computeRoof } from '../building/roof'
import { buildWallPieces } from '../building/wallPieces'
import { exposedOutline } from '../building/views/patterns'
import type { WallPiece } from '../building/types'
import { manualDimensionVisible } from '../dimensioning/visibility'
import { planOverlay } from '../dimensioning/planOverlay'
import type { ExecutionLabels } from '../dimensioning/executionDimensions'
import type { DimensioningMode } from '../dimensioning/types'
import { elementsOnLevel } from '../documents/levels'
import { axisGeometry } from '../geometry/axes'
import { dimensionGeometry } from '../geometry/dimension'
import { openingGeometry } from '../geometry/openings'
import { openingSymbol } from '../geometry/openingSymbol'
import { polygonArea, polygonCentroid } from '../geometry/polygon'
import { computeWallJoinsOf } from '../geometry/wallJoins'
import { stairLayout, stairStatus, stairToWorld } from '../stairs/stairs'
import { getSymbol } from '../library/catalog'
import { drawSymbol } from '../library/drawing'
import { arcPoints } from '../library/primitives'
import type { Primitive } from '../library/types'
import { formatArea, formatDecimal } from '../units/format'
import { writeDxf, type DxfEntity, type DxfLayer } from './dxf'

/** Calques du DXF exporté (docs/02-ARCHITECTURE.md, « Import et export »). */
export const DXF_LAYERS = {
  walls: 'MURS',
  rooms: 'PIECES',
  openings: 'OUVERTURES',
  dimensions: 'COTES',
  axes: 'AXES',
  furniture: 'MOBILIER',
  stairs: 'ESCALIERS',
  platforms: 'PLATEFORMES',
  roofs: 'TOITURES',
  chimneys: 'CHEMINEES',
} as const

const LAYERS: DxfLayer[] = [
  { name: DXF_LAYERS.walls, color: 7 },
  { name: DXF_LAYERS.rooms, color: 3 },
  { name: DXF_LAYERS.openings, color: 4 },
  { name: DXF_LAYERS.dimensions, color: 1 },
  { name: DXF_LAYERS.axes, color: 6 },
  { name: DXF_LAYERS.furniture, color: 8 },
  { name: DXF_LAYERS.stairs, color: 2 },
  { name: DXF_LAYERS.platforms, color: 5 },
  { name: DXF_LAYERS.roofs, color: 30 },
  { name: DXF_LAYERS.chimneys, color: 9 },
]

/** Hauteur des majuscules par rapport à la taille de police d'un texte SVG ou Konva. */
const CAP_RATIO = 0.7
/** Trait oblique aux extrémités d'une cote (mm), comme à l'écran. */
const DIMENSION_TICK_MM = 120
/** Écart entre l'objet mesuré et le début de la ligne d'attache (mm), comme à l'écran. */
const EXTENSION_GAP_MM = 100
/** Nombre de segments d'une ellipse du mobilier. */
const ELLIPSE_STEPS = 48

export interface DxfPlanOptions {
  /** Réglage « Cotation » : cotes automatiques Client / Technique ajoutées au calque COTES. */
  mode: DimensioningMode
  labels: ExecutionLabels
  /** Hauteur des textes (mm sur le plan). */
  fontMm: number
}

type Pt = [number, number]

/** Contour d'une boîte de mur dans le plan (même calcul que les coupes). */
function boxRing(piece: WallPiece): Pt[] {
  const c = Math.cos(piece.rotationY)
  const s = Math.sin(piece.rotationY)
  const hx = piece.size.x / 2
  const hz = piece.size.z / 2
  return [
    [-hx, -hz],
    [hx, -hz],
    [hx, hz],
    [-hx, hz],
  ].map(([u, w]) => [piece.center.x + c * u + s * w, piece.center.z - s * u + c * w])
}

/** Rotation (degrés, sens horaire à l'écran) puis translation d'un point local. */
function placer(x: number, y: number, rotation: number): (lx: number, ly: number) => Pt {
  const rad = (rotation * Math.PI) / 180
  const c = Math.cos(rad)
  const s = Math.sin(rad)
  return (lx, ly) => [x + lx * c - ly * s, y + lx * s + ly * c]
}

function placeFlat(points: readonly number[], place: (lx: number, ly: number) => Pt): number[] {
  const out: number[] = []
  for (let i = 0; i + 1 < points.length; i += 2) out.push(...place(points[i], points[i + 1]))
  return out
}

/**
 * Murs : leur contour vu en plan, ouvertures découpées comme à l'écran (trumeaux pleine hauteur et
 * raccords d'angle réunis, sans les coutures entre morceaux).
 */
function wallEntities(elements: readonly CanvasElement[]): DxfEntity[] {
  const walls = elements.filter((el): el is WallElement => el.type === 'wall' && !el.hidden)
  const openings = elements.filter((el): el is OpeningElement => el.type === 'opening' && !el.hidden)
  const rings: Pt[][] = []
  for (const wall of walls) {
    const own = openings.filter((o) => o.wallId === wall.id)
    for (const piece of buildWallPieces(wall, own, { id: '', elevation: 0 })) {
      // Seuls les trumeaux (du sol au haut du mur) : sous et au-dessus d'une ouverture, le mur est découpé.
      const bottom = piece.center.y - piece.size.y / 2
      const top = piece.center.y + piece.size.y / 2
      if (Math.abs(bottom) < 0.5 && Math.abs(top - wall.height) < 0.5) rings.push(boxRing(piece))
    }
  }
  for (const polygons of computeWallJoinsOf(elements).values()) {
    for (const polygon of polygons) rings.push(polygon.map((p) => [p.x, p.y]))
  }
  return exposedOutline(
    rings,
    rings.map((_, i) => i),
  ).map(([x1, y1, x2, y2]) => ({ kind: 'line', layer: DXF_LAYERS.walls, x1, y1, x2, y2 }))
}

function roomEntities(elements: readonly CanvasElement[], fontMm: number, withLabels: boolean): DxfEntity[] {
  const out: DxfEntity[] = []
  for (const room of elements) {
    if (room.type !== 'room' || room.hidden || room.points.length < 6) continue
    out.push({ kind: 'polyline', layer: DXF_LAYERS.rooms, points: room.points, closed: true })
    const centroid = polygonCentroid(room.points)
    if (!withLabels || !room.showLabel || !centroid) continue
    // Deux lignes centrées comme à l'écran : le nom, puis la surface au tracé.
    out.push({
      kind: 'text',
      layer: DXF_LAYERS.rooms,
      x: centroid.x,
      y: centroid.y - fontMm * 0.25,
      height: fontMm,
      text: room.name,
      anchor: 'middle',
    })
    out.push({
      kind: 'text',
      layer: DXF_LAYERS.rooms,
      x: centroid.x,
      y: centroid.y + fontMm * 1.25,
      height: fontMm,
      text: formatArea(polygonArea(room.points)),
      anchor: 'middle',
    })
  }
  return out
}

function openingEntities(elements: readonly CanvasElement[]): DxfEntity[] {
  const walls = new Map(
    elements.filter((el): el is WallElement => el.type === 'wall').map((wall) => [wall.id, wall]),
  )
  const out: DxfEntity[] = []
  for (const opening of elements) {
    if (opening.type !== 'opening' || opening.hidden) continue
    const wall = walls.get(opening.wallId)
    if (!wall || wall.hidden) continue
    const geometry = openingGeometry(opening, wall)
    if (!geometry) continue
    const symbol = openingSymbol(opening, wall.thickness)
    const place = placer(geometry.center.x, geometry.center.y, geometry.angle)
    for (const points of symbol.lines) {
      out.push({ kind: 'polyline', layer: DXF_LAYERS.openings, points: placeFlat(points, place), closed: false })
    }
    for (const points of symbol.dashed) {
      out.push({
        kind: 'polyline',
        layer: DXF_LAYERS.openings,
        points: placeFlat(points, place),
        closed: false,
        dashed: true,
      })
    }
  }
  return out
}

/** Cotes tracées à la main : ligne de cote, lignes d'attache, traits obliques et longueur en mm. */
function dimensionEntities(elements: readonly CanvasElement[], mode: DimensioningMode, fontMm: number): DxfEntity[] {
  const layer = DXF_LAYERS.dimensions
  const out: DxfEntity[] = []
  for (const el of elements) {
    if (el.type !== 'dimension' || el.hidden || !manualDimensionVisible(el, mode)) continue
    const geometry = dimensionGeometry(el.points, el.offset)
    if (!geometry) continue
    const { line, extensions, center, textAngle, direction, normal, length } = geometry
    out.push({ kind: 'line', layer, x1: line[0].x, y1: line[0].y, x2: line[1].x, y2: line[1].y })
    const gap = Math.min(EXTENSION_GAP_MM, Math.abs(el.offset) / 2) * (el.offset < 0 ? -1 : 1)
    for (const [from, to] of extensions) {
      out.push({ kind: 'line', layer, x1: from.x + normal.x * gap, y1: from.y + normal.y * gap, x2: to.x, y2: to.y })
    }
    const tx = ((direction.x + normal.x) / Math.SQRT2) * DIMENSION_TICK_MM
    const ty = ((direction.y + normal.y) / Math.SQRT2) * DIMENSION_TICK_MM
    for (const p of line) out.push({ kind: 'line', layer, x1: p.x - tx, y1: p.y - ty, x2: p.x + tx, y2: p.y + ty })
    // Le chiffre au-dessus de la ligne de cote, lisible (jamais à l'envers).
    const rad = (textAngle * Math.PI) / 180
    const up = { x: Math.sin(rad), y: -Math.cos(rad) }
    out.push({
      kind: 'text',
      layer,
      x: center.x + up.x * fontMm * 0.4,
      y: center.y + up.y * fontMm * 0.4,
      height: fontMm,
      text: formatDecimal(length, 0),
      angle: textAngle,
      anchor: 'middle',
    })
  }
  return out
}

function axisEntities(elements: readonly CanvasElement[]): DxfEntity[] {
  const layer = DXF_LAYERS.axes
  const out: DxfEntity[] = []
  for (const el of elements) {
    if (el.type !== 'axis' || el.hidden) continue
    const geometry = axisGeometry(el.points)
    if (!geometry) continue
    const { line, bubbles, radius } = geometry
    out.push({ kind: 'line', layer, x1: line[0].x, y1: line[0].y, x2: line[1].x, y2: line[1].y, dashed: true })
    // Le texte rapetisse avec la longueur de l'étiquette pour tenir dans la bulle (comme à l'écran).
    const size = Math.min(radius * 1.05, (radius * 1.7) / Math.max(el.label.length, 1)) * CAP_RATIO
    for (const c of bubbles) {
      out.push({ kind: 'circle', layer, cx: c.x, cy: c.y, r: radius })
      out.push({ kind: 'text', layer, x: c.x, y: c.y + size / 2, height: size, text: el.label, anchor: 'middle' })
    }
  }
  return out
}

/** Contour d'un rectangle aux coins arrondis (`r` = 0 : rectangle), points locaux. */
function roundedRect(x: number, y: number, w: number, h: number, r = 0): number[] {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2))
  if (radius === 0) return [x, y, x + w, y, x + w, y + h, x, y + h]
  return [
    ...arcPoints(x + w - radius, y + radius, radius, -90, 0, 15),
    ...arcPoints(x + w - radius, y + h - radius, radius, 0, 90, 15),
    ...arcPoints(x + radius, y + h - radius, radius, 90, 180, 15),
    ...arcPoints(x + radius, y + radius, radius, 180, 270, 15),
  ]
}

function furnitureEntities(elements: readonly CanvasElement[]): DxfEntity[] {
  const layer = DXF_LAYERS.furniture
  const out: DxfEntity[] = []
  for (const el of elements) {
    if (el.type !== 'furniture' || el.hidden) continue
    const furniture = el as FurnitureElement
    const def = getSymbol(furniture.symbol)
    const place = placer(furniture.x, furniture.y, furniture.rotation)
    const primitives: Primitive[] = def
      ? drawSymbol(def, furniture.width, furniture.depth, furniture.mirrored)
      : [{ kind: 'rect', x: 0, y: 0, w: furniture.width, h: furniture.depth, style: 'outline' }]
    for (const p of primitives) {
      // Les aplats sans trait (`soft`) n'ont pas de contour à dessiner.
      if (p.style === 'soft') continue
      const dashed = p.style === 'above' || p.style === 'zone' ? true : undefined
      const poly = (points: number[], closed: boolean) =>
        out.push({ kind: 'polyline', layer, points: placeFlat(points, place), closed, ...(dashed ? { dashed } : {}) })
      switch (p.kind) {
        case 'rect':
          poly(roundedRect(p.x, p.y, p.w, p.h, p.r), true)
          break
        case 'circle': {
          const [cx, cy] = place(p.cx, p.cy)
          out.push({ kind: 'circle', layer, cx, cy, r: p.r })
          break
        }
        case 'ellipse': {
          const points: number[] = []
          for (let i = 0; i < ELLIPSE_STEPS; i++) {
            const a = (i / ELLIPSE_STEPS) * Math.PI * 2
            points.push(p.cx + p.rx * Math.cos(a), p.cy + p.ry * Math.sin(a))
          }
          poly(points, true)
          break
        }
        case 'line':
          poly(p.points, false)
          break
        case 'polygon':
          poly(p.points, true)
          break
        case 'arc':
          poly(arcPoints(p.cx, p.cy, p.r, p.from, p.to), false)
          break
      }
    }
  }
  return out
}

/** Escalier : contour, lignes de marche (girons) et ligne de foulée de chaque volée, palier compris. */
function stairEntities(elements: readonly CanvasElement[], levels: FabricsDocument['levels']): DxfEntity[] {
  const layer = DXF_LAYERS.stairs
  const out: DxfEntity[] = []
  for (const stair of elements) {
    if (stair.type !== 'stair' || stair.hidden) continue
    const status = stairStatus(stair, levels)
    const treads = status.kind === 'no-level-above' ? 0 : status.steps.treads
    const layout = stairLayout(stair, treads)
    const world = (x: number, y: number): Pt => {
      const p = stairToWorld(stair, { x, y })
      return [p.x, p.y]
    }
    const line = (a: Pt, b: Pt) => out.push({ kind: 'line', layer, x1: a[0], y1: a[1], x2: b[0], y2: b[1] })
    out.push({
      kind: 'polyline',
      layer,
      points: layout.outline.flatMap((p) => world(p.x, p.y)),
      closed: true,
    })
    if (layout.landing) {
      const l = layout.landing
      // Le palier se sépare des volées par un trait (sauf là où le contour le fait déjà).
      line(world(l.x, l.y + l.height), world(l.x + l.width, l.y + l.height))
    }
    for (const f of layout.flights) {
      const vertical = f.direction === 'right'
      for (let i = 1; i < f.treads; i++) {
        if (vertical) {
          const x = f.x + (f.width * i) / f.treads
          line(world(x, f.y), world(x, f.y + f.height))
        } else {
          const y = f.y + (f.height * i) / f.treads
          line(world(f.x, y), world(f.x + f.width, y))
        }
      }
      // Ligne de foulée au milieu de la volée, dans le sens de la montée.
      const cx = f.x + f.width / 2
      const cy = f.y + f.height / 2
      if (vertical) line(world(f.x, cy), world(f.x + f.width, cy))
      else if (f.direction === 'up') line(world(cx, f.y + f.height), world(cx, f.y))
      else line(world(cx, f.y), world(cx, f.y + f.height))
    }
  }
  return out
}

/** Plateforme : contour fermé et altitude du dessus (« +450 », mm) au centre. */
function platformEntities(elements: readonly CanvasElement[], fontMm: number): DxfEntity[] {
  const layer = DXF_LAYERS.platforms
  const out: DxfEntity[] = []
  for (const el of elements) {
    if (el.type !== 'platform' || el.hidden || el.points.length < 6) continue
    out.push({ kind: 'polyline', layer, points: el.points, closed: true })
    const centroid = polygonCentroid(el.points)
    if (centroid) {
      out.push({
        kind: 'text',
        layer,
        x: centroid.x,
        y: centroid.y + fontMm / 2,
        height: fontMm,
        text: `+${formatDecimal(el.elevation, 0)}`,
        anchor: 'middle',
      })
    }
  }
  return out
}

/**
 * Toiture : contour au nu des murs, bord du débord, faîtage et arêtiers. Sans géométrie calculable
 * (contour trop court), seul le contour est exporté.
 */
function roofEntities(elements: readonly CanvasElement[]): DxfEntity[] {
  const layer = DXF_LAYERS.roofs
  const out: DxfEntity[] = []
  for (const roof of elements) {
    if (roof.type !== 'roof' || roof.hidden || roof.points.length < 6) continue
    out.push({ kind: 'polyline', layer, points: roof.points, closed: true, dashed: true })
    const result = computeRoof(roof, 0)
    if ('problem' in result) continue
    const g = result.geometry
    if (roof.overhang > 0) {
      out.push({ kind: 'polyline', layer, points: g.overhangOutline.flatMap((p) => [p.x, p.y]), closed: true })
    }
    for (const [a, b] of [...(g.ridge ? [g.ridge] : []), ...g.hips]) {
      out.push({ kind: 'line', layer, x1: a.x, y1: a.y, x2: b.x, y2: b.y })
    }
  }
  return out
}

/** Cheminée (conduit) : carré et ses deux diagonales, comme le symbole du plan. */
function chimneyEntities(elements: readonly CanvasElement[]): DxfEntity[] {
  const layer = DXF_LAYERS.chimneys
  const out: DxfEntity[] = []
  for (const el of elements) {
    if (el.type !== 'chimney' || el.hidden) continue
    const place = placer(el.x, el.y, el.rotation)
    const [a, b, c, d] = [place(0, 0), place(el.width, 0), place(el.width, el.depth), place(0, el.depth)]
    out.push({ kind: 'polyline', layer, points: [...a, ...b, ...c, ...d], closed: true })
    out.push({ kind: 'line', layer, x1: a[0], y1: a[1], x2: c[0], y2: c[1] })
    out.push({ kind: 'line', layer, x1: b[0], y1: b[1], x2: d[0], y2: d[1] })
  }
  return out
}

/**
 * Entités DXF d'un niveau : murs, pièces, ouvertures, cotes (tracées à la main, plus les cotes
 * automatiques du réglage « Cotation »), axes et mobilier, chacun sur son calque. Les éléments
 * masqués ne sont pas exportés.
 */
export function levelDxfEntities(
  document: Pick<FabricsDocument, 'elements' | 'levels'>,
  levelId: string,
  options: DxfPlanOptions,
): DxfEntity[] {
  const elements = elementsOnLevel(document.elements, levelId)
  const { mode, labels, fontMm } = options
  const overlay = planOverlay(document, levelId, mode, labels, fontMm)
  const overlayEntities: DxfEntity[] = overlay
    ? [
        ...overlay.lines.map(
          (l): DxfEntity => ({
            kind: 'line',
            layer: DXF_LAYERS.dimensions,
            x1: l.x1,
            y1: l.y1,
            x2: l.x2,
            y2: l.y2,
            ...(l.dashed ? { dashed: true } : {}),
          }),
        ),
        ...overlay.texts.map(
          (t): DxfEntity => ({
            kind: 'text',
            layer: DXF_LAYERS.dimensions,
            x: t.x,
            y: t.y,
            height: t.size * CAP_RATIO,
            text: t.text,
            ...(t.angle ? { angle: t.angle } : {}),
            anchor: t.anchor ?? 'start',
          }),
        ),
      ]
    : []
  return [
    ...wallEntities(elements),
    // Avec des cotes automatiques, leur étiquette de pièce remplace celle du plan (comme à l'écran).
    ...roomEntities(elements, fontMm, mode === 'none'),
    ...openingEntities(elements),
    ...dimensionEntities(elements, mode, fontMm),
    ...overlayEntities,
    ...axisEntities(elements),
    ...furnitureEntities(elements),
    ...stairEntities(elements, document.levels),
    ...platformEntities(elements, fontMm),
    ...roofEntities(elements),
    ...chimneyEntities(elements),
  ]
}

/** Fichier DXF d'un niveau (texte), en mm, un calque par famille d'éléments. */
export function levelDxf(
  document: Pick<FabricsDocument, 'elements' | 'levels'>,
  levelId: string,
  options: DxfPlanOptions,
): string {
  return writeDxf(LAYERS, levelDxfEntities(document, levelId, options))
}
