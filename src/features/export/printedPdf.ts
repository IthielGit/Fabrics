/**
 * Lecture d'un PDF vectoriel produit par Fabrics, pour les tests d'exactitude imprimée (M20) :
 * segments de trait `x y m x y l` en mm de papier, et correspondance avec les traits d'un dessin.
 */
import { inflateSync } from 'node:zlib'
import type { Drawing } from '../building/views/drawing'
import { buildDrawingPdf } from './pdf'
import { planPdfPlacement, sheetSize, type Orientation, type SheetFormat, type SheetTemplate } from './pdfLayout'
import type { PlanPdfLabels } from './pdf'

const PT_PER_MM = 72 / 25.4
export const TOLERANCE_MM = 0.1

export type Segment = [number, number, number, number]

/** Segments `x y m x y l` de toutes les pages du PDF, en mm de papier, origine en haut à gauche. */
export async function pdfSegments(blob: Blob, sheetHeightMm: number): Promise<Segment[]> {
  const bytes = Buffer.from(await blob.arrayBuffer())
  const raw = bytes.toString('latin1')
  let content = ''
  for (const match of raw.matchAll(/stream\r?\n/g)) {
    const start = match.index + match[0].length
    const end = raw.indexOf('endstream', start)
    try {
      content += `${inflateSync(bytes.subarray(start, end)).toString('latin1')}\n`
    } catch {
      // Flux non compressé (police, image) : sans traits de dessin.
    }
  }
  const segments: Segment[] = []
  const number = String.raw`(-?[\d.]+)`
  const pattern = new RegExp(String.raw`${number} ${number} m\s+${number} ${number} l\b`, 'g')
  for (const [, x1, y1, x2, y2] of content.matchAll(pattern)) {
    const mm = (v: string) => Number(v) / PT_PER_MM
    segments.push([mm(x1), sheetHeightMm - mm(y1), mm(x2), sheetHeightMm - mm(y2)])
  }
  return segments
}

export const length = ([x1, y1, x2, y2]: Segment) => Math.hypot(x2 - x1, y2 - y1)


/** Dessin mis en page sur une feuille à l'échelle donnée, PDF relu : traits du dessin retrouvés sur le papier. */
export async function printedDrawing(
  drawing: Drawing,
  format: SheetFormat,
  orientation: Orientation,
  scale: number,
  options: { template?: SheetTemplate; labels?: Partial<PlanPdfLabels> } = {},
) {
  const sheet = sheetSize(format, orientation)
  const placement = planPdfPlacement({ width: drawing.width, height: drawing.height }, sheet, scale, options.template ?? 'band')
  const blob = await buildDrawingPdf(drawing, sheet, placement.rect, scale, { projectName: 'ROOMIT', fields: [], scaleBarUnit: 'mm', ...options.labels })
  const segments = await pdfSegments(blob, sheet.height)
  const onPaper = (l: Drawing['lines'][number]): Segment | undefined => {
    const x1 = placement.rect.x + l.x1 / scale
    const y1 = placement.rect.y + l.y1 / scale
    const x2 = placement.rect.x + l.x2 / scale
    const y2 = placement.rect.y + l.y2 / scale
    return segments.find(
      (s) =>
        Math.abs(s[0] - x1) <= TOLERANCE_MM &&
        Math.abs(s[1] - y1) <= TOLERANCE_MM &&
        Math.abs(s[2] - x2) <= TOLERANCE_MM &&
        Math.abs(s[3] - y2) <= TOLERANCE_MM,
    )
  }
  const linesOf = (mm: number) => drawing.lines.filter((l) => Math.abs(Math.hypot(l.x2 - l.x1, l.y2 - l.y1) - mm) < 1)
  /** Traits du dessin absents du PDF ou pas à l'échelle (≤ 0,1 mm). */
  const misplaced = () =>
    drawing.lines.filter((l) => {
      const segment = onPaper(l)
      return !segment || Math.abs(length(segment) - Math.hypot(l.x2 - l.x1, l.y2 - l.y1) / scale) > TOLERANCE_MM
    })
  return { placement, segments, onPaper, linesOf, misplaced, blob }
}

/** Textes écrits dans le PDF (opérateurs « (…) Tj »), dans l'ordre. */
export async function pdfStrings(blob: Blob): Promise<string[]> {
  const bytes = Buffer.from(await blob.arrayBuffer())
  const raw = bytes.toString('latin1')
  const out: string[] = []
  for (const match of raw.matchAll(/stream\r?\n/g)) {
    const start = match.index + match[0].length
    const end = raw.indexOf('endstream', start)
    let content: string
    try {
      content = inflateSync(bytes.subarray(start, end)).toString('latin1')
    } catch {
      continue
    }
    for (const m of content.matchAll(/\(((?:\\.|[^\\)])*)\)\s*Tj/g)) out.push(m[1].replace(/\\(.)/g, '$1'))
  }
  return out
}
