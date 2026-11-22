import type { BuildingMeasurements } from '../../measurements/measurements'
import type { OpeningStyle } from '../../../types/document'
import { formatArea, formatDecimal } from '../../units/format'
import type { DrawLine, DrawText, Drawing } from './drawing'

/**
 * Nomenclatures (M20 20.3) : tableaux tirés des métrés (jamais recalculés), pour une feuille
 * « Nomenclatures ». Menuiseries : une ligne par type identique (genre, style, largeur, hauteur,
 * allège), avec ses repères (`P01`…), sa quantité et ses niveaux. Pièces : nom, niveau, surface,
 * hauteur sous plafond, faux plafond. Longueurs en mm, surfaces en m².
 */
export interface ScheduleTable {
  title: string
  header: readonly string[]
  rows: string[][]
}

export interface ScheduleLabels {
  openingsTitle: string
  roomsTitle: string
  openingHeader: readonly string[]
  roomHeader: readonly string[]
  kinds: Record<'door' | 'window' | 'bay', string>
  styles: Record<OpeningStyle, string>
  yes: string
  no: string
}

export function openingSchedule(building: BuildingMeasurements, labels: ScheduleLabels): ScheduleTable | null {
  const groups = new Map<string, { kind: 'door' | 'window' | 'bay'; style: OpeningStyle; width: number; height: number; sill: number; refs: string[]; levels: string[] }>()
  for (const entry of building.levels) {
    for (const o of entry.measurements.openings) {
      const key = [o.kind, o.style, Math.round(o.width), Math.round(o.height), Math.round(o.sillHeight)].join('|')
      const group = groups.get(key) ?? { kind: o.kind, style: o.style, width: o.width, height: o.height, sill: o.sillHeight, refs: [], levels: [] }
      group.refs.push(building.refs.openings.get(o.id) ?? o.name)
      if (!group.levels.includes(entry.level.name)) group.levels.push(entry.level.name)
      groups.set(key, group)
    }
  }
  if (groups.size === 0) return null
  const order = { door: 0, window: 1, bay: 2 }
  const rows = [...groups.values()]
    .sort((a, b) => order[a.kind] - order[b.kind] || b.width - a.width || b.height - a.height || a.sill - b.sill)
    .map((g) => [
      `${labels.kinds[g.kind]} · ${labels.styles[g.style]}`,
      `${formatDecimal(g.width, 0)} x ${formatDecimal(g.height, 0)}`,
      formatDecimal(g.sill, 0),
      String(g.refs.length),
      g.refs.sort().join(', '),
      g.levels.join(', '),
    ])
  return { title: labels.openingsTitle, header: labels.openingHeader, rows }
}

export function roomSchedule(building: BuildingMeasurements, labels: ScheduleLabels): ScheduleTable | null {
  const rows = building.levels.flatMap((entry) =>
    entry.measurements.rooms.map((r) => [
      r.name,
      entry.level.name,
      formatArea(r.area),
      r.ceilingHeight === null ? '' : formatDecimal(r.ceilingHeight, 0),
      r.falseCeiling ? labels.yes : labels.no,
    ]),
  )
  return rows.length > 0 ? { title: labels.roomsTitle, header: labels.roomHeader, rows } : null
}

/** Largeur approximative d'un texte (police sans empattement, gras compris), en mm. */
const textWidth = (text: string, size: number) => text.length * size * 0.66

/** Les tableaux les uns sous les autres, en mm réels, textes de hauteur `font`. `null` sans tableau. */
export function scheduleDrawing(tables: readonly (ScheduleTable | null)[], font: number): Drawing | null {
  const list = tables.filter((t): t is ScheduleTable => t !== null)
  if (list.length === 0) return null
  const lines: DrawLine[] = []
  const texts: DrawText[] = []
  const rowH = font * 1.8
  const pad = font * 0.6
  const margin = font * 2
  let y = margin
  let maxW = 0
  for (const table of list) {
    // En-têtes en gras : imprimés à 10 pt (1,45 × la hauteur du texte, `printedText.ts`).
    const widths = table.header.map((h, c) => Math.max(textWidth(h, font) * 1.45, ...table.rows.map((r) => textWidth(r[c] ?? '', font))) + pad * 2)
    const width = widths.reduce((s, w) => s + w, 0)
    maxW = Math.max(maxW, width, textWidth(table.title, font * 1.3))
    texts.push({ x: margin, y: y + font * 1.3, text: table.title, size: font * 1.3, bold: true })
    y += rowH * 1.2
    const top = y
    const all = [table.header, ...table.rows]
    all.forEach((row, i) => {
      let x = margin
      row.forEach((cell, c) => {
        texts.push({ x: x + pad, y: y + rowH * 0.68, text: cell, size: font, ...(i === 0 ? { bold: true } : {}) })
        x += widths[c]
      })
      y += rowH
      lines.push({ x1: margin, y1: y, x2: margin + width, y2: y, weight: i === 0 ? 'normal' : 'hair' })
    })
    lines.push({ x1: margin, y1: top, x2: margin + width, y2: top })
    let x = margin
    for (const w of [0, ...widths]) {
      x += w
      lines.push({ x1: x, y1: top, x2: x, y2: y, weight: w === 0 || x >= margin + width - 1e-6 ? 'normal' : 'hair' })
    }
    y += rowH * 1.5
  }
  return { width: maxW + margin * 2, height: y + margin, polygons: [], lines, texts }
}
