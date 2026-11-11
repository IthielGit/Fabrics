import type { Level } from '../../../types/document'
import type { BuildingModel } from '../types'
import type { LevelMark, ViewBounds, ViewFace } from './projection'
import { formatElevation } from './labels'
import { prismsOf } from './section'

/**
 * Un dessin prêt à afficher ou à imprimer : polygones, lignes et textes en millimètres réels, dans
 * un repère dont l'origine est le coin haut-gauche (y vers le bas). L'écran (SVG) et le PDF
 * dessinent exactement ce même contenu.
 */
export type DrawFill = 'white' | 'black' | 'light' | 'wall' | 'none'

export interface DrawPolygon {
  points: [number, number][]
  fill: DrawFill
}

export interface DrawLine {
  x1: number
  y1: number
  x2: number
  y2: number
  dashed?: boolean
  /** Épaisseur : `heavy` (ligne de sol), `normal` (par défaut), `hair` (filet, ligne de niveau). */
  weight?: 'heavy' | 'normal' | 'hair'
  /** Trait gris (cotes de niveaux, filets) plutôt que noir. */
  muted?: boolean
}

export interface DrawText {
  x: number
  y: number
  text: string
  /** Hauteur du texte, mm. */
  size: number
  anchor?: 'start' | 'middle'
  bold?: boolean
  /** Texte secondaire en gris (cotes de niveaux) plutôt qu'en noir. */
  muted?: boolean
}

export interface Drawing {
  /** Largeur et hauteur du cadre, mm. */
  width: number
  height: number
  polygons: DrawPolygon[]
  lines: DrawLine[]
  texts: DrawText[]
}

/**
 * Palette neutre de l'écran et du PDF : encre presque noire, gris sans teinte, papier blanc. Aucune
 * couleur d'accent : un dessin d'architecture se lit par ses épaisseurs de trait.
 */
export const INK = '#1a1a1a'
export const MUTED_INK = '#666666'
export const FILL_COLORS: Record<Exclude<DrawFill, 'none'>, string> = {
  white: '#ffffff',
  black: INK,
  light: '#e6e6e6',
  wall: '#4d4d4d',
}

const MIN_FONT_MM = 60

/** Hauteur des textes sur le papier (mm), pour un PDF : environ 7 pt, lisible sans encombrer le dessin. */
export const PAPER_TEXT_MM = 2.5

/** Hauteur de texte lisible pour un dessin de cette taille (environ 1/55 de sa plus grande dimension). */
export function autoFontMm(width: number, height: number): number {
  return Math.max(MIN_FONT_MM, Math.max(width, height) / 55)
}

interface ViewLike {
  faces: readonly ViewFace[]
  bounds: ViewBounds | null
  levels: readonly LevelMark[]
}

/**
 * Dessin d'une façade ou d'une coupe : faces blanches (noires si coupées), ligne de sol, et une cote
 * de niveau (nom, altitude) par plancher, sur la droite. `null` si la vue est vide.
 */
export function drawingFromView(view: ViewLike, fontMm?: number): Drawing | null {
  const { bounds } = view
  if (!bounds) return null
  const w = bounds.maxU - bounds.minU
  const h = bounds.maxV - bounds.minV
  const font = fontMm ?? autoFontMm(w, h)
  const marginL = font * 2
  const marginR = font * 11
  const marginT = font * 2
  const marginB = font * 2
  const width = w + marginL + marginR
  const height = h + marginT + marginB
  const x = (u: number) => u - bounds.minU + marginL
  const y = (v: number) => bounds.maxV - v + marginT

  const polygons: DrawPolygon[] = view.faces.map((face) => ({
    points: face.polygon.map(([u, v]) => [x(u), y(v)] as [number, number]),
    fill: face.cut ? 'black' : 'white',
  }))

  const lines: DrawLine[] = []
  const texts: DrawText[] = []
  if (bounds.minV - 1 <= 0 && bounds.maxV + 1 >= 0) {
    lines.push({ x1: 0, y1: y(0), x2: width - marginR + font, y2: y(0), weight: 'heavy' })
  }
  for (const mark of view.levels) {
    if (mark.elevation < bounds.minV - 1 || mark.elevation > bounds.maxV + 1) continue
    const ly = y(mark.elevation)
    lines.push({
      x1: marginL * 0.5,
      y1: ly,
      x2: width - marginR + font,
      y2: ly,
      dashed: true,
      weight: 'hair',
      muted: true,
    })
    texts.push({ x: width - marginR + font * 1.5, y: ly - font * 0.3, text: mark.name, size: font, muted: true })
    texts.push({
      x: width - marginR + font * 1.5,
      y: ly + font * 1.05,
      text: formatElevation(mark.elevation),
      size: font,
      muted: true,
    })
  }
  return { width, height, polygons, lines, texts }
}

/**
 * Plan d'un niveau vu de dessus : sols en gris clair, murs en gris foncé (les morceaux d'un même
 * mur se touchent, donc le mur paraît plein ; les ouvertures n'y sont pas dessinées). `null` si le
 * niveau est vide.
 */
export function levelPlanDrawing(model: BuildingModel, level: Level, fontMm?: number): Drawing | null {
  const prisms = prismsOf(model).filter((p) => p.levelId === level.id && p.kind !== 'roof')
  if (prisms.length === 0) return null
  const order: Record<string, number> = { slab: 0, platform: 1, step: 2, wall: 3, chimney: 4 }
  prisms.sort((a, b) => (order[a.kind] ?? 5) - (order[b.kind] ?? 5))

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const prism of prisms) {
    for (const p of prism.rings[0] ?? []) {
      minX = Math.min(minX, p.x)
      maxX = Math.max(maxX, p.x)
      minY = Math.min(minY, p.y)
      maxY = Math.max(maxY, p.y)
    }
  }
  if (!Number.isFinite(minX)) return null
  const font = fontMm ?? autoFontMm(maxX - minX, maxY - minY)
  const margin = font * 2
  const polygons: DrawPolygon[] = prisms
    .filter((p) => (p.rings[0]?.length ?? 0) >= 3)
    .map((p) => ({
      points: p.rings[0].map((pt) => [pt.x - minX + margin, pt.y - minY + margin] as [number, number]),
      fill: p.kind === 'wall' || p.kind === 'chimney' ? 'wall' : 'light',
    }))
  return {
    width: maxX - minX + margin * 2,
    height: maxY - minY + margin * 2,
    polygons,
    lines: [],
    texts: [],
  }
}

export interface SheetEntry {
  id: string
  title: string
  drawing: Drawing
}

export interface SheetPlacement {
  id: string
  x: number
  y: number
}

export interface SheetResult {
  drawing: Drawing
  placements: SheetPlacement[]
}

/**
 * Planche : tous les dessins côte à côte **à la même échelle** (les dimensions restent en mm
 * réels), rangés en lignes dans l'ordre donné, chacun sous son titre. Retourne un dessin unique.
 */
export function composeSheet(entries: readonly SheetEntry[], fontMm: number): SheetResult {
  const gap = fontMm * 6
  const titleBand = fontMm * 3.2
  if (entries.length === 0) {
    return { drawing: { width: 0, height: 0, polygons: [], lines: [], texts: [] }, placements: [] }
  }
  const totalArea = entries.reduce((sum, e) => sum + (e.drawing.width + gap) * (e.drawing.height + titleBand + gap), 0)
  const widest = Math.max(...entries.map((e) => e.drawing.width))
  // Largeur visée d'une ligne : un peu plus large que haute, sans jamais couper un dessin.
  const rowWidth = Math.max(widest, Math.sqrt(totalArea) * 1.5)

  const placements: SheetPlacement[] = []
  let x = 0
  let y = 0
  let rowHeight = 0
  let sheetWidth = 0
  for (const entry of entries) {
    if (x > 0 && x + entry.drawing.width > rowWidth) {
      x = 0
      y += rowHeight + gap
      rowHeight = 0
    }
    placements.push({ id: entry.id, x, y })
    x += entry.drawing.width + gap
    sheetWidth = Math.max(sheetWidth, x - gap)
    rowHeight = Math.max(rowHeight, entry.drawing.height + titleBand)
  }
  const sheetHeight = y + rowHeight

  const drawing: Drawing = { width: sheetWidth, height: sheetHeight, polygons: [], lines: [], texts: [] }
  entries.forEach((entry, index) => {
    const at = placements[index]
    const oy = at.y + titleBand
    drawing.texts.push({ x: at.x, y: at.y + fontMm * 1.6, text: entry.title, size: fontMm * 1.6, bold: true })
    // Filet sous le titre, sur toute la largeur du dessin.
    drawing.lines.push({
      x1: at.x,
      x2: at.x + entry.drawing.width,
      y1: at.y + fontMm * 2.3,
      y2: at.y + fontMm * 2.3,
      weight: 'hair',
    })
    for (const p of entry.drawing.polygons) {
      drawing.polygons.push({ fill: p.fill, points: p.points.map(([px, py]) => [px + at.x, py + oy] as [number, number]) })
    }
    for (const l of entry.drawing.lines) {
      drawing.lines.push({ ...l, x1: l.x1 + at.x, x2: l.x2 + at.x, y1: l.y1 + oy, y2: l.y2 + oy })
    }
    for (const t of entry.drawing.texts) drawing.texts.push({ ...t, x: t.x + at.x, y: t.y + oy })
  })
  return { drawing, placements }
}
