import type { Level } from '../../../types/document'
import type { BuildingModel } from '../types'
import type { LevelMark, ViewBounds, ViewFace } from './projection'
import { formatElevation } from './labels'
import { prismsOf, type Prism } from './section'

/**
 * Un dessin prêt à afficher ou à imprimer : polygones, lignes et textes en millimètres réels, dans
 * un repère dont l'origine est le coin haut-gauche (y vers le bas). L'écran (SVG) et le PDF
 * dessinent exactement ce même contenu.
 */
export type DrawFill = 'white' | 'black' | 'light' | 'wall' | 'none'

export interface DrawPolygon {
  points: [number, number][]
  fill: DrawFill
  /**
   * Côtés tracés (côté i = point i → point i+1). Absent : tout le contour. Les jonctions entre
   * faces d'un même mur restent sans trait.
   */
  edges?: boolean[]
  /**
   * Plan de la face (profondeur, mm). Des polygones consécutifs du même plan sont peints ensemble :
   * d'abord tous leurs fonds, puis tous leurs traits (une face voisine ne recouvre pas un trait).
   */
  layer?: number
  /** Ligne brisée fine, non fermée et non remplie (traits de façade des ouvertures). */
  open?: boolean
  /** Ligne brisée en pointillé (avec `open`). */
  dashed?: boolean
}

/**
 * Paquets de polygones à peindre ensemble : les polygones consécutifs qui ont des côtés choisis
 * (`edges`) et le même plan (`layer`) forment un paquet ; les autres sont seuls.
 */
export function paintBatches(polygons: readonly DrawPolygon[]): DrawPolygon[][] {
  const batches: DrawPolygon[][] = []
  for (const polygon of polygons) {
    const last = batches[batches.length - 1]
    const head = last?.[0]
    if (
      head?.edges &&
      polygon.edges &&
      head.layer !== undefined &&
      polygon.layer !== undefined &&
      Math.abs(head.layer - polygon.layer) < 0.5
    ) {
      last.push(polygon)
    } else {
      batches.push([polygon])
    }
  }
  return batches
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

/**
 * Remplissage d'une face : matière coupée en noir (une vitre coupée reste blanche, cernée d'un
 * trait), vitre vue de face en gris clair, tout le reste en blanc.
 */
function faceFill(face: ViewFace): DrawFill {
  if (face.kind === 'mark') return 'none'
  if (face.kind === 'glass') return face.cut ? 'white' : 'light'
  return face.cut ? 'black' : 'white'
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
    fill: faceFill(face),
    ...(face.kind === 'mark' ? { open: true, ...(face.dashed ? { dashed: true } : {}) } : {}),
    ...(face.edges ? { edges: face.edges, layer: face.depth } : {}),
  }))

  const lines: DrawLine[] = []
  const texts: DrawText[] = []
  if (bounds.minV - 1 <= 0 && bounds.maxV + 1 >= 0) {
    lines.push({ x1: 0, y1: y(0), x2: width - marginR + font, y2: y(0), weight: 'heavy' })
  }
  for (const mark of view.levels) {
    if (mark.elevation < bounds.minV - 1 || mark.elevation > bounds.maxV + 1) continue
    const ly = y(mark.elevation)
    // Le trait de niveau part du bord droit du bâtiment (il ne traverse pas le dessin).
    lines.push({
      x1: x(bounds.maxU) + font * 0.4,
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

/** Hauteur du plan de coupe d'un plan de niveau, au-dessus du plancher (mm) : usage courant. */
export const PLAN_CUT_HEIGHT = 1000

type PlanRole = 'floor' | 'below' | 'cut' | 'glass'

/**
 * Rôle d'un solide sur le plan d'un niveau, coupé à `PLAN_CUT_HEIGHT` : sols, plateformes et marches
 * vus de dessus ; murs et cheminées coupés (noir plein, d'un seul tenant) ou vus sous la coupe
 * (allèges, en blanc) ; cadres coupés en noir et vitres en filet. Le toit, les linteaux (au-dessus
 * de la coupe) et les vantaux de porte ne sont pas dessinés.
 */
function planRole(prism: Prism, cutV: number): PlanRole | null {
  switch (prism.kind) {
    case 'slab':
    case 'platform':
    case 'step':
      return 'floor'
    case 'wall':
    case 'chimney':
    case 'frame':
      if (prism.v0 <= cutV && prism.v1 > cutV) return 'cut'
      return prism.kind === 'wall' && prism.v1 <= cutV ? 'below' : null
    case 'glass':
      return prism.v0 <= cutV && prism.v1 > cutV ? 'glass' : null
    default:
      return null
  }
}

const PLAN_ORDER: Record<PlanRole, number> = { floor: 0, below: 1, glass: 2, cut: 3 }

/**
 * Plan d'un niveau vu de dessus, coupé à 1 m du plancher comme un plan d'architecte : sols en gris
 * clair, murs coupés en noir plein (sans couture entre leurs morceaux), allèges des fenêtres vues
 * sous la coupe, cadres et vitres dans les ouvertures. `null` si le niveau est vide.
 */
export function levelPlanDrawing(model: BuildingModel, level: Level, fontMm?: number): Drawing | null {
  const cutV = level.elevation + PLAN_CUT_HEIGHT
  const items = prismsOf(model)
    .filter((p) => p.levelId === level.id && (p.rings[0]?.length ?? 0) >= 3)
    .map((prism) => ({ prism, role: planRole(prism, cutV) }))
    .filter((item): item is { prism: Prism; role: PlanRole } => item.role !== null)
  if (items.length === 0) return null
  // Tri stable : sols, allèges, vitres, puis matière coupée par-dessus.
  items.sort((a, b) => PLAN_ORDER[a.role] - PLAN_ORDER[b.role])

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const { prism } of items) {
    for (const p of prism.rings[0]) {
      minX = Math.min(minX, p.x)
      maxX = Math.max(maxX, p.x)
      minY = Math.min(minY, p.y)
      maxY = Math.max(maxY, p.y)
    }
  }
  const font = fontMm ?? autoFontMm(maxX - minX, maxY - minY)
  const margin = font * 2
  const polygons: DrawPolygon[] = items.map(({ prism, role }) => {
    const points = prism.rings[0].map((pt) => [pt.x - minX + margin, pt.y - minY + margin] as [number, number])
    if (role === 'cut' && prism.kind !== 'frame') {
      // Murs et cheminées coupés : noir plein, sans trait, pour que les morceaux se fondent.
      return { points, fill: 'black', edges: points.map(() => false), layer: 0 }
    }
    if (role === 'cut') return { points, fill: 'black' }
    if (role === 'floor') return { points, fill: 'light' }
    return { points, fill: 'white' }
  })
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
      drawing.polygons.push({ ...p, points: p.points.map(([px, py]) => [px + at.x, py + oy] as [number, number]) })
    }
    for (const l of entry.drawing.lines) {
      drawing.lines.push({ ...l, x1: l.x1 + at.x, x2: l.x2 + at.x, y1: l.y1 + oy, y2: l.y2 + oy })
    }
    for (const t of entry.drawing.texts) drawing.texts.push({ ...t, x: t.x + at.x, y: t.y + oy })
  })
  return { drawing, placements }
}
