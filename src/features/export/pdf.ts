import { FILL_COLORS, paintBatches, type Drawing, type DrawPolygon } from '../building/views/drawing'
import { lineWeights, textMask } from '../building/views/graphicStyles'
import { printedTextSize } from './printedText'
import {
  cartoucheArea,
  columnArea,
  PDF_MARGIN_MM,
  scaleBarSpec,
  type Rect,
  type SheetSize,
} from './pdfLayout'

/** Taille d'une feuille pour jsPDF : [largeur, hauteur] en mm. */
export async function createPdf(sheet: SheetSize) {
  // Chargé à la demande : la bibliothèque ne pèse que lorsqu'on exporte un PDF.
  const { jsPDF } = await import('jspdf')
  return new jsPDF({
    unit: 'mm',
    format: [sheet.width, sheet.height],
    orientation: sheet.width > sheet.height ? 'landscape' : 'portrait',
    compress: true,
  })
}

export type Pdf = Awaited<ReturnType<typeof createPdf>>

/** PDF d'un Visuel : l'image de la page à l'emplacement donné (mm). */
export async function buildDesignPdf(
  imageDataUrl: string,
  sheet: SheetSize,
  placement: Rect,
  title: string,
): Promise<Blob> {
  const pdf = await createPdf(sheet)
  pdf.setProperties({ title, creator: 'Fabrics' })
  pdf.addImage(imageDataUrl, 'PNG', placement.x, placement.y, placement.width, placement.height)
  return pdf.output('blob')
}

// --- Palette neutre des PDF de plan : encre presque noire, gris sans teinte, papier blanc. ---
type Rgb = [number, number, number]
const INK: Rgb = [26, 26, 26]
const MUTED: Rgb = [102, 102, 102]
const HAIRLINE: Rgb = [166, 166, 166]

/**
 * Épaisseurs de trait du cadre et du cartouche, en mm sur le papier. Celles du dessin dépendent de
 * l'échelle (`lineWeights`, M20 20.5) : le dessin se lit par ses épaisseurs, pas par la couleur.
 */
const LINE = { frame: 0.5, rule: 0.35, divider: 0.2 }

export interface CartoucheField {
  /** Intitulé de la cellule (« Échelle »), affiché en petites capitales grises. */
  label: string
  /** Valeur (« 1:50 »). */
  value: string
}

export interface PlanPdfLabels {
  /** Nom du projet (cartouche). */
  projectName: string
  /** Ce que montre la feuille : « Façade Nord », « Rez-de-chaussée »… */
  subtitle?: string
  /** Cellules de droite du cartouche, de gauche à droite (échelle, date, feuille). */
  fields: CartoucheField[]
  /** Unité de la barre d'échelle graphique (« mm »). */
  scaleBarUnit: string
  /** Nord, en degrés dans le sens horaire depuis le haut de la feuille ; absent : pas de flèche. */
  northAngle?: number
  /** Lettre de la flèche du nord (« N »). */
  northLabel?: string
  /** Note imprimée en petit juste au-dessus du cartouche (note sur les baies d'un document d'exécution). */
  note?: string
  /**
   * Gabarit `column` (M20 20.4, D20-3 : A) : colonne de droite et cartouche de la référence. Absent :
   * cartouche en bande en bas (gabarit `band`).
   */
  column?: ColumnSheet
}

/** Contenu de la colonne de droite et du cartouche du gabarit `column` (textes déjà en français). */
export interface ColumnSheet {
  /** Type de plan en tête de colonne (« PLAN DE NIVEAU »). */
  kind: string
  /** Émetteur (bureau d'études, architecte) ; vide : ligne laissée vide. */
  issuer: string
  /** Lignes intitulé / valeur du bas du cartouche, deux par ligne : N° de plan, Indice, Date, Statut, Échelle, Format. */
  cells: CartoucheField[]
  /** Tableaux et légende de la feuille, en mm réels à l'échelle du plan (posés dans la colonne). */
  side?: Drawing | null
}

/** Le jeu de caractères des polices standard de PDF n'a pas le vrai signe moins : on met un trait d'union. */
const pdfText = (text: string) => text.replace(/−/g, '-')

function truncate(pdf: Pdf, text: string, maxWidth: number): string {
  const full = pdfText(text)
  if (pdf.getTextWidth(full) <= maxWidth) return full
  let cut = full
  while (cut.length > 1 && pdf.getTextWidth(`${cut}…`) > maxWidth) cut = cut.slice(0, -1)
  return `${cut.trimEnd()}…`
}

const MAX_FIELD_WIDTH = 44
const MIN_FIELD_WIDTH = 16
const SCALE_ZONE_WIDTH = 60

/** Flèche du nord : un cercle fin et une pointe pleine orientée selon l'angle, avec la lettre au bout. */
function drawNorthArrow(pdf: Pdf, cx: number, cy: number, angle: number, letter: string): void {
  const radius = 5
  const a = (angle * Math.PI) / 180
  const dir = { x: Math.sin(a), y: -Math.cos(a) }
  const perp = { x: Math.cos(a), y: Math.sin(a) }
  pdf.setDrawColor(...INK)
  pdf.setLineWidth(LINE.divider)
  pdf.circle(cx, cy, radius, 'S')
  pdf.setFillColor(...INK)
  pdf.triangle(
    cx + dir.x * 4.2,
    cy + dir.y * 4.2,
    cx - dir.x * 1.8 + perp.x * 2.2,
    cy - dir.y * 1.8 + perp.y * 2.2,
    cx - dir.x * 1.8 - perp.x * 2.2,
    cy - dir.y * 1.8 - perp.y * 2.2,
    'F',
  )
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(7)
  pdf.setTextColor(...INK)
  pdf.text(letter, cx + dir.x * (radius + 2.6), cy + dir.y * (radius + 2.6) + 1, { align: 'center' })
}

/** Barre d'échelle graphique à deux segments, l'un plein, l'autre blanc, graduée en mm. */
function drawScaleBar(pdf: Pdf, x: number, y: number, available: number, scale: number, unit: string): void {
  const spec = scaleBarSpec(scale, available)
  const segment = spec.paperLength / 2
  const height = 1.6
  pdf.setDrawColor(...INK)
  pdf.setLineWidth(LINE.divider)
  pdf.setFillColor(...INK)
  pdf.rect(x, y, segment, height, 'FD')
  pdf.setFillColor(255, 255, 255)
  pdf.rect(x + segment, y, segment, height, 'FD')
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(6.5)
  pdf.setTextColor(...INK)
  const labelY = y + height + 3.2
  pdf.text('0', x, labelY, { align: 'center' })
  pdf.text(String(spec.segmentMm), x + segment, labelY, { align: 'center' })
  pdf.text(`${spec.segmentMm * 2} ${unit}`, x + segment * 2, labelY, { align: 'center' })
}

/**
 * Cartouche de la feuille, collé au bas du cadre : à gauche la flèche du nord et la barre d'échelle,
 * au milieu le projet et ce que montre la feuille, à droite des cellules intitulé / valeur (échelle,
 * date, feuille). Un cadre fin entoure toute la feuille ; le cartouche est séparé du dessin par un
 * filet un peu plus épais.
 */
export function drawCartouche(
  pdf: Pdf,
  sheet: SheetSize,
  /** Dénominateur de l'échelle ; `null` : pas de barre d'échelle (un tableau n'a pas d'échelle). */
  scale: number | null,
  labels: PlanPdfLabels,
): void {
  const strip = cartoucheArea(sheet)

  // Largeur des cellules de droite : celle de leur contenu, bornée.
  const widths = labels.fields.map((field) => {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(6)
    const labelWidth = pdf.getTextWidth(pdfText(field.label.toUpperCase()))
    pdf.setFontSize(9)
    const valueWidth = pdf.getTextWidth(pdfText(field.value))
    return Math.min(MAX_FIELD_WIDTH, Math.max(MIN_FIELD_WIDTH, Math.max(labelWidth, valueWidth) + 6))
  })
  const fieldsWidth = widths.reduce((sum, w) => sum + w, 0)
  const hasLeftZone = scale !== null || labels.northAngle !== undefined
  const leftWidth = hasLeftZone
    ? Math.min(SCALE_ZONE_WIDTH, Math.max(0, strip.width - fieldsWidth - 40))
    : 0
  const midX = strip.x + leftWidth
  const fieldsX = strip.x + strip.width - fieldsWidth
  const midWidth = fieldsX - midX

  // Filet du haut du cartouche et séparations verticales.
  pdf.setDrawColor(...INK)
  pdf.setLineWidth(LINE.rule)
  pdf.line(strip.x, strip.y, strip.x + strip.width, strip.y)
  pdf.setDrawColor(...HAIRLINE)
  pdf.setLineWidth(LINE.divider)
  const dividers = leftWidth > 0 ? [midX, fieldsX] : [fieldsX]
  let edge = fieldsX
  for (const w of widths.slice(0, -1)) {
    edge += w
    dividers.push(edge)
  }
  for (const x of dividers) {
    if (x > strip.x + 1 && x < strip.x + strip.width - 1) pdf.line(x, strip.y, x, strip.y + strip.height)
  }

  // Zone de gauche : nord et barre d'échelle.
  if (leftWidth >= 36) {
    const centerY = strip.y + strip.height / 2
    let barX = strip.x + 6
    if (labels.northAngle !== undefined) {
      drawNorthArrow(pdf, strip.x + 11, centerY, labels.northAngle, labels.northLabel ?? 'N')
      barX = strip.x + 24
    }
    const available = strip.x + leftWidth - barX - 8
    if (scale !== null && available >= 12) {
      drawScaleBar(pdf, barX, centerY - 1.2, available, scale, labels.scaleBarUnit)
    }
  }

  // Milieu : projet (gras) et sujet de la feuille.
  const textX = midX + 4
  const textWidth = Math.max(10, midWidth - 8)
  pdf.setTextColor(...INK)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(11)
  pdf.text(truncate(pdf, labels.projectName, textWidth), textX, labels.subtitle ? strip.y + 8.5 : strip.y + 12)
  if (labels.subtitle) {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8.5)
    pdf.setTextColor(...MUTED)
    pdf.text(truncate(pdf, labels.subtitle, textWidth), textX, strip.y + 14.5)
  }

  // Droite : cellules intitulé (petit, gris) / valeur.
  let x = fieldsX
  labels.fields.forEach((field, index) => {
    const width = widths[index]
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(6)
    pdf.setTextColor(...MUTED)
    pdf.text(truncate(pdf, field.label.toUpperCase(), width - 5), x + 3, strip.y + 6.5)
    pdf.setFontSize(9)
    pdf.setTextColor(...INK)
    pdf.text(truncate(pdf, field.value, width - 5), x + 3, strip.y + 14)
    x += width
  })

  // Note (documents d'exécution) : en petit, sur toute la largeur, juste au-dessus du cartouche.
  if (labels.note) {
    pdf.setFont('helvetica', 'italic')
    pdf.setFontSize(6.5)
    pdf.setTextColor(...MUTED)
    const lines: string[] = pdf.splitTextToSize(pdfText(labels.note), strip.width - 4)
    lines.forEach((line, index) => {
      pdf.text(line, strip.x + 2, strip.y - 1.5 - (lines.length - 1 - index) * 2.8)
    })
  }

  // Cadre de la feuille, par-dessus tout.
  pdf.setDrawColor(...INK)
  pdf.setLineWidth(LINE.frame)
  pdf.rect(
    PDF_MARGIN_MM,
    PDF_MARGIN_MM,
    sheet.width - PDF_MARGIN_MM * 2,
    sheet.height - PDF_MARGIN_MM * 2,
    'S',
  )
}

/** Rose des vents : huit branches, la branche du nord pleine et plus longue, orientée selon l'angle. */
function drawCompassRose(pdf: Pdf, cx: number, cy: number, radius: number, angle: number, letter: string): void {
  pdf.setDrawColor(...INK)
  pdf.setLineWidth(LINE.divider)
  for (let k = 0; k < 8; k++) {
    const a = ((angle + k * 45) * Math.PI) / 180
    const long = k % 2 === 0 ? radius : radius * 0.55
    const dir = { x: Math.sin(a), y: -Math.cos(a) }
    const perp = { x: Math.cos(a), y: Math.sin(a) }
    const w = radius * 0.12
    const tip = { x: cx + dir.x * long, y: cy + dir.y * long }
    const left = { x: cx + perp.x * w, y: cy + perp.y * w }
    const right = { x: cx - perp.x * w, y: cy - perp.y * w }
    // Moitié gauche pleine, moitié droite blanche (la rose se lit en relief) ; le nord tout plein.
    pdf.setFillColor(...INK)
    pdf.triangle(cx, cy, tip.x, tip.y, left.x, left.y, 'FD')
    if (k === 0) pdf.setFillColor(...INK)
    else pdf.setFillColor(255, 255, 255)
    pdf.triangle(cx, cy, tip.x, tip.y, right.x, right.y, 'FD')
  }
  const a = (angle * Math.PI) / 180
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.setTextColor(...INK)
  pdf.text(letter, cx + Math.sin(a) * (radius + 3.5), cy - Math.cos(a) * (radius + 3.5) + 1.2, { align: 'center' })
}

/**
 * Gabarit `column` (M20 20.4, gabarit de Villa ROOMIT) : cadre, colonne de droite avec le type de plan,
 * la rose des vents orientée selon le nord, les tableaux de la feuille ; barre d'échelle et cartouche en
 * bas de la colonne (projet, émetteur, titre, puis N° de plan / Indice, Date / Statut, Échelle / Format).
 */
export function drawColumnSheet(pdf: Pdf, sheet: SheetSize, scale: number | null, labels: PlanPdfLabels, column: ColumnSheet): void {
  const col = columnArea(sheet)
  const pad = 3
  const textW = col.width - pad * 2
  pdf.setDrawColor(...INK)
  pdf.setLineWidth(LINE.rule)
  pdf.line(col.x, col.y, col.x, col.y + col.height)

  // Type de plan, souligné.
  pdf.setTextColor(...INK)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(12)
  const kind = truncate(pdf, column.kind.toUpperCase(), textW)
  const kx = col.x + col.width / 2
  pdf.text(kind, kx, col.y + 12, { align: 'center' })
  const kw = pdf.getTextWidth(kind)
  pdf.setLineWidth(LINE.divider)
  pdf.line(kx - kw / 2, col.y + 13.2, kx + kw / 2, col.y + 13.2)

  // Rose des vents.
  let top = col.y + 20
  if (labels.northAngle !== undefined) {
    const r = Math.min(14, col.width / 4)
    drawCompassRose(pdf, kx, top + r + 4, r, labels.northAngle, labels.northLabel ?? 'N')
    top += r * 2 + 12
  }

  // Cartouche : hauteur fixe en bas de la colonne.
  const rowH = 7
  const cellRows = Math.ceil(column.cells.length / 2)
  const boxH = 12 + 7 + 10 + cellRows * rowH
  const boxY = col.y + col.height - boxH

  // Tableaux de la feuille : à l'échelle du plan, réduits s'ils sont trop larges pour la colonne.
  if (column.side) {
    const side = column.side
    const k = Math.min(1 / (scale ?? 1), textW / side.width)
    const maxH = boxY - 30 - top
    const kk = side.height * k > maxH ? maxH / side.height : k
    drawDrawing(pdf, side, { x: col.x + pad, y: top, width: side.width * kk, height: side.height * kk })
  }

  // Barre d'échelle et note, juste au-dessus du cartouche.
  if (scale !== null) drawScaleBar(pdf, col.x + pad + 2, boxY - 10, textW - 12, scale, labels.scaleBarUnit)
  if (labels.note) {
    pdf.setFont('helvetica', 'italic')
    pdf.setFontSize(5.5)
    pdf.setTextColor(...MUTED)
    const lines: string[] = pdf.splitTextToSize(pdfText(labels.note), textW)
    lines.forEach((line, i) => pdf.text(line, col.x + pad, boxY - 14 - (lines.length - 1 - i) * 2.4))
  }

  // Cartouche.
  pdf.setDrawColor(...INK)
  pdf.setLineWidth(LINE.rule)
  pdf.rect(col.x, boxY, col.width, boxH, 'S')
  pdf.setTextColor(...INK)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(11)
  pdf.text(truncate(pdf, labels.projectName, textW), kx, boxY + 8, { align: 'center' })
  pdf.setLineWidth(LINE.divider)
  pdf.line(col.x, boxY + 12, col.x + col.width, boxY + 12)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7)
  pdf.text(truncate(pdf, column.issuer, textW), kx, boxY + 16.8, { align: 'center' })
  pdf.line(col.x, boxY + 19, col.x + col.width, boxY + 19)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.text(truncate(pdf, labels.subtitle ?? '', textW), kx, boxY + 25.5, { align: 'center' })
  let y = boxY + 29
  for (let r = 0; r < cellRows; r++) {
    pdf.line(col.x, y, col.x + col.width, y)
    pdf.line(col.x + col.width / 2, y, col.x + col.width / 2, y + rowH)
    for (let c = 0; c < 2; c++) {
      const cell = column.cells[r * 2 + c]
      if (!cell) continue
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(6.5)
      pdf.text(truncate(pdf, `${cell.label} : ${cell.value}`, col.width / 2 - 4), col.x + c * (col.width / 2) + 2, y + 4.6)
    }
    y += rowH
  }

  // Cadre de la feuille, par-dessus tout.
  pdf.setDrawColor(...INK)
  pdf.setLineWidth(LINE.frame)
  pdf.rect(PDF_MARGIN_MM, PDF_MARGIN_MM, sheet.width - PDF_MARGIN_MM * 2, sheet.height - PDF_MARGIN_MM * 2, 'S')
}

/**
 * PDF d'un plan à l'échelle : l'image de l'emprise à l'emplacement donné, puis le cadre de la feuille
 * et le cartouche (nord, barre d'échelle, projet, échelle, date). `scale` est le dénominateur de
 * l'échelle (1:`scale`).
 */
export async function buildPlanPdf(
  imageDataUrl: string,
  sheet: SheetSize,
  placement: Rect,
  scale: number,
  labels: PlanPdfLabels,
): Promise<Blob> {
  const pdf = await createPdf(sheet)
  pdf.setProperties({ title: labels.projectName, subject: labels.subtitle ?? '', creator: 'Fabrics' })
  pdf.addImage(imageDataUrl, 'PNG', placement.x, placement.y, placement.width, placement.height)
  drawCartouche(pdf, sheet, scale, labels)
  return pdf.output('blob')
}

const MM_TO_PT = 72 / 25.4
/** Plus petits corps de texte imprimés (pt) : cotes et légendes, puis titres des dessins. */

function hexToRgb(hex: string): Rgb {
  const value = hex.replace('#', '')
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ]
}

/**
 * PDF vectoriel d'un dessin de vue (façade, coupe ou planche) : les mm réels du dessin sont divisés
 * par `scale` pour donner des mm de papier (2,50 m à 1:50 = 50 mm), à l'emplacement `placement`.
 * Trois épaisseurs de trait (sol, contours, filets), matière coupée en noir, cadre et cartouche.
 */
export async function buildDrawingPdf(
  drawing: Drawing,
  sheet: SheetSize,
  placement: Rect,
  scale: number,
  labels: PlanPdfLabels,
): Promise<Blob> {
  const pdf = await createPdf(sheet)
  pdf.setProperties({ title: labels.projectName, subject: labels.subtitle ?? '', creator: 'Fabrics' })
  drawDrawing(pdf, drawing, placement)
  if (labels.column) drawColumnSheet(pdf, sheet, scale, labels, labels.column)
  else drawCartouche(pdf, sheet, scale, labels)
  return pdf.output('blob')
}

/**
 * Dessine un dessin de vue (vectoriel) sur la page courante, dans `placement` (largeur du dessin
 * ramenée à celle du cadre). Sert au PDF des vues et à la vignette du PDF des métrés.
 */
export function drawDrawing(pdf: Pdf, drawing: Drawing, placement: Rect): void {
  // Facteur de réduction effectivement appliqué (identique à 1/`scale` sauf « Ajuster à la page »).
  const k = placement.width / drawing.width
  const px = (x: number) => placement.x + x * k
  const py = (y: number) => placement.y + y * k
  // Épaisseurs imprimées selon l'échelle (M20 20.5, `graphicStyles.ts`).
  const W = lineWeights(1 / k)

  pdf.setLineJoin('round')
  const outline = (polygon: DrawPolygon) => {
    const [first, ...rest] = polygon.points
    const segments = rest.map(([x, y], index) => {
      const [prevX, prevY] = index === 0 ? first : rest[index - 1]
      return [(x - prevX) * k, (y - prevY) * k]
    })
    return { first, segments }
  }
  for (const batch of paintBatches(drawing.polygons)) {
    const [head] = batch
    pdf.setDrawColor(...INK)
    pdf.setLineWidth(head.fill === 'black' ? W.cut : W.normal)
    if (head.open) {
      // Trait de façade d'une ouverture (triangle d'ouverture, flèche) : ligne brisée fine.
      pdf.setLineWidth(W.hair)
      pdf.setLineDashPattern(head.dashed ? [1.5, 1] : [], 0)
      for (let i = 0; i + 1 < head.points.length; i++) {
        const [x, y] = head.points[i]
        const [nx, ny] = head.points[i + 1]
        pdf.line(px(x), py(y), px(nx), py(ny))
      }
      pdf.setLineDashPattern([], 0)
      continue
    }
    if (head.edges) {
      // Faces d'un même plan : tous les fonds, puis seulement les vrais bords (pas les jonctions).
      for (const polygon of batch) {
        if (polygon.points.length < 3 || polygon.fill === 'none') continue
        const { first, segments } = outline(polygon)
        pdf.setFillColor(...hexToRgb(FILL_COLORS[polygon.fill]))
        pdf.lines(segments, px(first[0]), py(first[1]), [1, 1], 'F', true)
      }
      // Hachures des matières coupées, sur les fonds et sous les contours.
      if (batch.some((p) => p.hatch?.length)) {
        pdf.setLineWidth(W.hatch)
        for (const polygon of batch) {
          for (const [x1, y1, x2, y2] of polygon.hatch ?? []) pdf.line(px(x1), py(y1), px(x2), py(y2))
        }
        pdf.setLineWidth(head.fill === 'black' ? W.cut : W.normal)
      }
      for (const polygon of batch) {
        polygon.points.forEach(([x, y], i) => {
          if (!polygon.edges?.[i]) return
          const [nx, ny] = polygon.points[(i + 1) % polygon.points.length]
          pdf.line(px(x), py(y), px(nx), py(ny))
        })
      }
      continue
    }
    if (head.points.length < 3) continue
    const { first, segments } = outline(head)
    if (head.fill === 'none') {
      pdf.lines(segments, px(first[0]), py(first[1]), [1, 1], 'S', true)
    } else {
      pdf.setFillColor(...hexToRgb(FILL_COLORS[head.fill]))
      pdf.lines(segments, px(first[0]), py(first[1]), [1, 1], 'FD', true)
    }
  }

  for (const line of drawing.lines) {
    pdf.setDrawColor(...(line.muted ? MUTED : INK))
    pdf.setLineWidth(W[line.weight ?? 'normal'])
    pdf.setLineDashPattern(line.dashed ? [2, 1.5] : [], 0)
    pdf.line(px(line.x1), py(line.y1), px(line.x2), py(line.y2))
  }
  pdf.setLineDashPattern([], 0)

  // Masques blancs sous les textes qui en demandent (M20 20.5), tous avant les textes : le masque d'une
  // ligne ne mord pas sur la ligne voisine de la même étiquette.
  pdf.setFillColor(255, 255, 255)
  for (const text of drawing.texts) {
    if (!text.mask) continue
    pdf.setFont('helvetica', text.bold ? 'bold' : 'normal')
    const size = printedTextSize(text, 1 / k) * k
    pdf.setFontSize(size * MM_TO_PT)
    const rect = textMask({ ...text, x: px(text.x), y: py(text.y) }, size, pdf.getTextWidth(pdfText(text.text)))
    if (rect) pdf.rect(rect.x, rect.y, rect.width, rect.height, 'F')
  }

  for (const text of drawing.texts) {
    pdf.setTextColor(...(text.muted ? MUTED : INK))
    pdf.setFont('helvetica', text.bold ? 'bold' : 'normal')
    pdf.setFontSize(printedTextSize(text, 1 / k) * k * MM_TO_PT)
    const content = pdfText(text.text)
    if (text.angle) {
      // Texte tourné : jsPDF centre à l'horizontale avant de tourner (texte décalé d'une demi-longueur,
      // corrigé en M20 20.2) ; on recule nous-mêmes le point de départ de la moitié du texte, le long
      // de sa direction. Angle du dessin : sens horaire à l'écran ; jsPDF tourne dans l'autre sens.
      const a = (text.angle * Math.PI) / 180
      const half = text.anchor === 'middle' ? pdf.getTextWidth(content) / 2 : 0
      pdf.text(content, px(text.x) - Math.cos(a) * half, py(text.y) - Math.sin(a) * half, { angle: -text.angle })
    } else {
      pdf.text(content, px(text.x), py(text.y), { align: text.anchor === 'middle' ? 'center' : 'left' })
    }
  }
}
