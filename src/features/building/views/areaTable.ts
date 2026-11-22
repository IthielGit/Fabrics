import { formatArea, formatLength } from '../../units/format'
import type { NativeRoofQuantity } from '../../../types/document'
import type { Measurements } from '../../measurements/measurements'
import type { DrawLine, DrawText, Drawing } from './drawing'
import type { LegendBlock } from './legend'

/**
 * Tableau des surfaces d'un niveau, posé à droite de son plan (M20 20.1b, format de la référence
 * Villa ROOMIT, D20-3) : « Pièces Niveau R+1 », une ligne par pièce (nom, surface), puis un second
 * tableau avec le total du niveau. Les surfaces viennent des métrés (jamais recalculées ici) ; le
 * total est la somme des pièces, balcon compris (D20-10 : A).
 */
export interface AreaTableLabels {
  title: (levelName: string) => string
  room: string
  area: string
  totalTitle: (levelName: string) => string
  totalRow: (levelName: string) => string
}

export interface AreaTable {
  title: string
  header: [string, string]
  rows: [string, string][]
  totalTitle: string
  total: [string, string]
  /** Lignes ajoutées sous le total (tableau de toiture : surface en plan, égouts, périmètre). */
  extraTotals?: [string, string][]
}

/** Contenu du tableau à partir des métrés d'un niveau ; `null` si le niveau n'a pas de pièce. */
export function levelAreaTable(measurements: Measurements, levelName: string, labels: AreaTableLabels): AreaTable | null {
  if (measurements.rooms.length === 0) return null
  const total = measurements.rooms.reduce((sum, r) => sum + r.area, 0)
  return {
    title: labels.title(levelName),
    header: [labels.room, labels.area],
    rows: measurements.rooms.map((r) => [r.name, formatArea(r.area)]),
    totalTitle: labels.totalTitle(levelName),
    total: [labels.totalRow(levelName), formatArea(total)],
  }
}

export interface RoofAreaTableLabels {
  title: (levelName: string) => string
  pan: string
  area: string
  panRow: (index: number) => string
  totalTitle: string
  real: string
  plan: string
  eaves: string
  perimeter: string
}

/**
 * Tableau des surfaces de toiture d'un niveau, affiché sur la feuille de toiture seulement sur demande
 * (D20-10 : A). Valeurs des métrés (pans comptés sur leur réunion, D20-15) ; le périmètre est la
 * longueur du contour de la toiture (mm). `null` sans pan.
 */
export function roofAreaTable(roofs: readonly NativeRoofQuantity[], perimeter: number, levelName: string, labels: RoofAreaTableLabels): AreaTable | null {
  if (roofs.length === 0) return null
  const sum = (f: (r: NativeRoofQuantity) => number) => roofs.reduce((s, r) => s + f(r), 0)
  return {
    title: labels.title(levelName),
    header: [labels.pan, labels.area],
    rows: roofs.map((r, i) => [labels.panRow(i + 1), formatArea(r.realArea)]),
    totalTitle: labels.totalTitle,
    total: [labels.real, formatArea(sum((r) => r.realArea))],
    extraTotals: [
      [labels.plan, formatArea(sum((r) => r.projectedArea))],
      [labels.eaves, formatLength(sum((r) => r.eaveLength))],
      [labels.perimeter, formatLength(perimeter)],
    ],
  }
}

/** Largeur approximative d'un texte (police sans empattement, gras compris), en mm, pour une hauteur `size`. */
function textWidth(text: string, size: number): number {
  return text.length * size * 0.68
}

/**
 * Dessin du tableau (cadres, filets, textes), coin haut-gauche en (`x`, `y`), textes de hauteur
 * `font` (mm réels, comme les cotes du plan). Renvoie aussi la taille occupée.
 */
export function areaTableDrawing(table: AreaTable, x: number, y: number, font: number): { lines: DrawLine[]; texts: DrawText[]; width: number; height: number } {
  const rowH = font * 1.8
  const pad = font * 0.8
  const col0 = Math.max(...[table.header[0], table.total[0], ...(table.extraTotals ?? []).map((r) => r[0]), ...table.rows.map((r) => r[0])].map((t) => textWidth(t, font))) + pad * 2
  const col1 = Math.max(...[table.header[1], table.total[1], ...(table.extraTotals ?? []).map((r) => r[1]), ...table.rows.map((r) => r[1])].map((t) => textWidth(t, font))) + pad * 2
  const width = Math.max(col0 + col1, textWidth(table.title, font * 1.3) + pad * 2)
  const c0 = width * (col0 / (col0 + col1))
  const lines: DrawLine[] = []
  const texts: DrawText[] = []
  const frame = (top: number, bottom: number) => {
    lines.push(
      { x1: x, y1: top, x2: x + width, y2: top },
      { x1: x, y1: bottom, x2: x + width, y2: bottom },
      { x1: x, y1: top, x2: x, y2: bottom },
      { x1: x + width, y1: top, x2: x + width, y2: bottom },
    )
  }
  const block = (top: number, title: string, header: [string, string] | null, rows: [string, string][], boldRows: boolean) => {
    let cy = top
    texts.push({ x: x + width / 2, y: cy + rowH * 0.7, text: title, size: font * 1.3, anchor: 'middle' })
    cy += rowH
    lines.push({ x1: x, y1: cy, x2: x + width, y2: cy })
    const startRows = cy
    const all: { cells: [string, string]; bold: boolean }[] = [
      ...(header ? [{ cells: header, bold: true }] : []),
      ...rows.map((cells) => ({ cells, bold: boldRows })),
    ]
    all.forEach((row, i) => {
      texts.push({ x: x + pad, y: cy + rowH * 0.68, text: row.cells[0], size: font, ...(row.bold ? { bold: true } : {}) })
      texts.push({ x: x + c0 + pad, y: cy + rowH * 0.68, text: row.cells[1], size: font, ...(row.bold ? { bold: true } : {}) })
      cy += rowH
      if (i < all.length - 1) lines.push({ x1: x, y1: cy, x2: x + width, y2: cy, weight: 'hair' })
    })
    lines.push({ x1: x + c0, y1: startRows, x2: x + c0, y2: cy, weight: 'hair' })
    frame(top, cy)
    return cy
  }
  const end1 = block(y, table.title, table.header, table.rows, false)
  const top2 = end1 + rowH
  const end2 = block(top2, table.totalTitle, table.header, [table.total, ...(table.extraTotals ?? [])], true)
  return { lines, texts, width, height: end2 - y }
}

/**
 * Plan d'un niveau avec son tableau des surfaces à droite, aligné en haut, séparé d'un intervalle de
 * quatre hauteurs de texte, et éventuellement la légende des hachures dessous (`legend` reçoit sa
 * position). Le plan n'est pas déplacé : ses coordonnées (et son échelle) restent les mêmes.
 */
export function withAreaTable(
  plan: Drawing,
  table: AreaTable | null,
  font: number,
  legend?: (x: number, y: number) => LegendBlock | null,
): Drawing {
  const gap = font * 4
  const x = plan.width + gap
  const t = table ? areaTableDrawing(table, x, font * 2, font) : null
  const l = legend?.(x, font * 2 + (t ? t.height + font * 3 : 0)) ?? null
  if (!t && !l) return plan
  const right = Math.max(t?.width ?? 0, l?.width ?? 0)
  const bottom = Math.max(t ? font * 2 + t.height : 0, l ? font * 2 + (t ? t.height + font * 3 : 0) + l.height : 0)
  return {
    width: plan.width + gap + right + font * 2,
    height: Math.max(plan.height, bottom + font * 2),
    polygons: [...plan.polygons, ...(l?.polygons ?? [])],
    lines: [...plan.lines, ...(t?.lines ?? []), ...(l?.lines ?? [])],
    texts: [...plan.texts, ...(t?.texts ?? []), ...(l?.texts ?? [])],
  }
}
