import { FILL_COLORS, type Drawing } from '../building/views/drawing'
import { cartoucheArea, type Rect, type SheetSize } from './pdfLayout'

/** Taille d'une feuille pour jsPDF : [largeur, hauteur] en mm. */
async function createPdf(sheet: SheetSize) {
  // Chargé à la demande : la bibliothèque ne pèse que lorsqu'on exporte un PDF.
  const { jsPDF } = await import('jspdf')
  return new jsPDF({
    unit: 'mm',
    format: [sheet.width, sheet.height],
    orientation: sheet.width > sheet.height ? 'landscape' : 'portrait',
    compress: true,
  })
}

/** PDF d'un Visuel : l'image de la page à l'emplacement donné (mm). */
export async function buildDesignPdf(
  imageDataUrl: string,
  sheet: SheetSize,
  placement: Rect,
  title: string,
): Promise<Blob> {
  const pdf = await createPdf(sheet)
  pdf.setProperties({ title })
  pdf.addImage(imageDataUrl, 'PNG', placement.x, placement.y, placement.width, placement.height)
  return pdf.output('blob')
}

export interface PlanPdfLabels {
  /** Titre du plan (cartouche). */
  projectName: string
  /** Ex. « Échelle 1:50 » ou « Ajusté à la page (échelle non garantie) ». */
  scaleText: string
  /** Ex. « Date : 10/11/2026 ». */
  dateText: string
  /** Ex. « Pièces : 12,00 m² » ; absent s'il n'y a aucune pièce. */
  areaText?: string
  /** Ex. « 1 m » (légende de la barre d'échelle). */
  scaleBarLabel: string
}

/** Longueur réelle de la barre d'échelle graphique, en mm. */
const SCALE_BAR_REAL_MM = 1000
const CARTOUCHE_WIDTH_MM = 90

type Pdf = Awaited<ReturnType<typeof createPdf>>

/** Bande du bas : barre d'échelle graphique de 1 m (à gauche) et cartouche (à droite). */
function drawCartouche(pdf: Pdf, sheet: SheetSize, scale: number, labels: PlanPdfLabels): void {
  const strip = cartoucheArea(sheet)

  // --- Cartouche, en bas à droite
  const boxWidth = Math.min(CARTOUCHE_WIDTH_MM, strip.width)
  const boxX = strip.x + strip.width - boxWidth
  pdf.setDrawColor(30, 41, 59)
  pdf.setLineWidth(0.3)
  pdf.rect(boxX, strip.y, boxWidth, strip.height)
  pdf.setTextColor(15, 23, 42)

  const innerWidth = boxWidth - 6
  const fit = (text: string) => {
    const lines = pdf.splitTextToSize(text, innerWidth) as string[]
    return lines[0] ?? ''
  }
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(11)
  pdf.text(fit(labels.projectName), boxX + 3, strip.y + 6)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.text(fit(labels.scaleText), boxX + 3, strip.y + 10.5)
  pdf.text(fit(labels.dateText), boxX + 3, strip.y + 14.5)
  if (labels.areaText) pdf.text(fit(labels.areaText), boxX + 3, strip.y + 18)

  // --- Barre d'échelle graphique de 1 m, en bas à gauche
  const barLength = SCALE_BAR_REAL_MM / scale
  const barX = strip.x
  const barY = strip.y + strip.height / 2
  if (barX + barLength <= boxX - 4) {
    pdf.setLineWidth(0.4)
    pdf.line(barX, barY, barX + barLength, barY)
    pdf.line(barX, barY - 1.5, barX, barY + 1.5)
    pdf.line(barX + barLength, barY - 1.5, barX + barLength, barY + 1.5)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.text('0', barX, barY - 2.5, { align: 'center' })
    pdf.text(labels.scaleBarLabel, barX + barLength, barY - 2.5, { align: 'center' })
  }
}

/**
 * PDF d'un plan à l'échelle : l'image de l'emprise à l'emplacement donné, puis dans la bande du
 * bas une barre d'échelle graphique de 1 m (à gauche) et le cartouche (à droite).
 * `scale` est le dénominateur de l'échelle (1:`scale`).
 */
export async function buildPlanPdf(
  imageDataUrl: string,
  sheet: SheetSize,
  placement: Rect,
  scale: number,
  labels: PlanPdfLabels,
): Promise<Blob> {
  const pdf = await createPdf(sheet)
  pdf.setProperties({ title: labels.projectName })
  pdf.addImage(imageDataUrl, 'PNG', placement.x, placement.y, placement.width, placement.height)
  drawCartouche(pdf, sheet, scale, labels)
  return pdf.output('blob')
}

const MM_TO_PT = 72 / 25.4
/** Plus petit corps de texte imprimé (pt) : en dessous, les cotes de niveaux seraient illisibles. */
const MIN_TEXT_PT = 6

function hexToRgb(hex: string): [number, number, number] {
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
 * La bande du bas reçoit la barre d'échelle et le cartouche.
 */
export async function buildDrawingPdf(
  drawing: Drawing,
  sheet: SheetSize,
  placement: Rect,
  scale: number,
  labels: PlanPdfLabels,
): Promise<Blob> {
  const pdf = await createPdf(sheet)
  pdf.setProperties({ title: labels.projectName })
  // Facteur de réduction effectivement appliqué (identique à `scale` sauf arrondi du placement).
  const k = placement.width / drawing.width
  const px = (x: number) => placement.x + x * k
  const py = (y: number) => placement.y + y * k

  pdf.setLineJoin('round')
  for (const polygon of drawing.polygons) {
    if (polygon.points.length < 3) continue
    const [first, ...rest] = polygon.points
    const segments = rest.map(([x, y], index) => {
      const [prevX, prevY] = index === 0 ? first : rest[index - 1]
      return [(x - prevX) * k, (y - prevY) * k]
    })
    pdf.setDrawColor(15, 23, 42)
    pdf.setLineWidth(0.25)
    if (polygon.fill === 'none') {
      pdf.lines(segments, px(first[0]), py(first[1]), [1, 1], 'S', true)
    } else {
      pdf.setFillColor(...hexToRgb(FILL_COLORS[polygon.fill]))
      pdf.lines(segments, px(first[0]), py(first[1]), [1, 1], 'FD', true)
    }
  }

  for (const line of drawing.lines) {
    if (line.accent) pdf.setDrawColor(99, 102, 241)
    else if (line.muted) pdf.setDrawColor(100, 116, 139)
    else pdf.setDrawColor(15, 23, 42)
    pdf.setLineWidth(line.muted ? 0.35 : 0.2)
    pdf.setLineDashPattern(line.dashed ? [2, 1.5] : [], 0)
    pdf.line(px(line.x1), py(line.y1), px(line.x2), py(line.y2))
  }
  pdf.setLineDashPattern([], 0)

  for (const text of drawing.texts) {
    if (text.accent) pdf.setTextColor(67, 56, 202)
    else pdf.setTextColor(15, 23, 42)
    pdf.setFont('helvetica', text.bold ? 'bold' : 'normal')
    pdf.setFontSize(Math.max(text.size * k * MM_TO_PT, MIN_TEXT_PT))
    pdf.text(text.text, px(text.x), py(text.y), { align: text.anchor === 'middle' ? 'center' : 'left' })
  }

  drawCartouche(pdf, sheet, scale, labels)
  return pdf.output('blob')
}
