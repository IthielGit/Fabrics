import { formatArea } from '../../units/format'
import type { Measurements } from '../../measurements/measurements'
import type { DrawLine, DrawText, Drawing } from './drawing'

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
  const col0 = Math.max(...[table.header[0], table.total[0], ...table.rows.map((r) => r[0])].map((t) => textWidth(t, font))) + pad * 2
  const col1 = Math.max(...[table.header[1], table.total[1], ...table.rows.map((r) => r[1])].map((t) => textWidth(t, font))) + pad * 2
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
  const end2 = block(top2, table.totalTitle, table.header, [table.total], true)
  return { lines, texts, width, height: end2 - y }
}

/**
 * Plan d'un niveau avec son tableau des surfaces à droite, aligné en haut, séparé d'un intervalle de
 * quatre hauteurs de texte. Le plan n'est pas déplacé : ses coordonnées (et son échelle) restent les mêmes.
 */
export function withAreaTable(plan: Drawing, table: AreaTable | null, font: number): Drawing {
  if (!table) return plan
  const gap = font * 4
  const t = areaTableDrawing(table, plan.width + gap, font * 2, font)
  return {
    width: plan.width + gap + t.width + font * 2,
    height: Math.max(plan.height, t.height + font * 4),
    polygons: plan.polygons,
    lines: [...plan.lines, ...t.lines],
    texts: [...plan.texts, ...t.texts],
  }
}
