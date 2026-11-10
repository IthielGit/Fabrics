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

  return pdf.output('blob')
}
