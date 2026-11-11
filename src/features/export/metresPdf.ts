import { cellText, type MetresCell, type MetresTable } from '../measurements/tables'
import { createPdf, drawCartouche, type Pdf, type PlanPdfLabels } from './pdf'
import { cartoucheArea, PDF_MARGIN_MM, type SheetSize } from './pdfLayout'

type Rgb = [number, number, number]
const INK: Rgb = [26, 26, 26]
const MUTED: Rgb = [102, 102, 102]
const HAIRLINE: Rgb = [200, 200, 200]

/** Dimensions de la mise en page, en mm et en points. */
const PAD = 5 // entre le cadre et le contenu
const PAD_TOP = 8
const PAD_BOTTOM = 4
const ROW_HEIGHT = 5
const TOTAL_ROW_HEIGHT = 5.8
const HEADER_LINE = 3
const TITLE_BLOCK = 7
const TABLE_GAP = 7
const CELL_PAD = 1.6
const TEXT_PT = 7.5
const HEADER_PT = 6.5
const TITLE_PT = 9.5
const NOTE_PT = 7
const MAX_HEADER_LINES = 3
const MAX_HEADER_COLUMN = 30

/** Le jeu de caractères des polices standard de PDF n'a pas le vrai signe moins : trait d'union. */
const pdfText = (text: string) => text.replace(/−/g, '-')

export interface MetresPdfLabels {
  /** Titre du document (« Métrés »), en haut de la première page. */
  title: string
  /** Ligne des unités, sous le titre. */
  units: string
  /** Remarque sur les totaux, sous les unités. */
  note: string
  /** Ajouté au titre d'un tableau qui continue sur la page suivante (« suite »). */
  continued: string
  /** Cartouche : projet, ce que montre la feuille, et cellules Date / Feuille / Page. */
  cartouche: {
    projectName: string
    subtitle: string
    dateLabel: string
    date: string
    sheetLabel: string
    sheet: string
    pageLabel: string
  }
}

interface Layout {
  /** Largeur de chaque colonne, mm. */
  widths: number[]
  /** Nombre de lignes de l'en-tête (les intitulés longs passent à la ligne). */
  headerLines: string[][]
}

/** Largeurs des colonnes : celles du contenu, ramenées à la largeur disponible si besoin. */
function layoutTable(pdf: Pdf, table: MetresTable, available: number): Layout {
  const contentWidths: number[] = []
  const widths = table.columns.map((column, index) => {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(TEXT_PT)
    const cells = [
      ...table.rows.map((row) => cellText(row[index] ?? '')),
      cellText(table.total?.[index] ?? ''),
    ]
    const content = Math.max(0, ...cells.map((cell) => pdf.getTextWidth(pdfText(cell))))
    contentWidths.push(content)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(HEADER_PT)
    // Le plus long mot de l'intitulé : l'en-tête peut passer à la ligne, pas un mot.
    const longestWord = Math.max(...column.header.split(/\s+/).map((word) => pdf.getTextWidth(pdfText(word))))
    let width = Math.max(longestWord, content) + CELL_PAD * 2
    // On élargit jusqu'à ce que l'intitulé tienne sur 3 lignes au plus (dans la limite de 30 mm).
    while (
      width < MAX_HEADER_COLUMN &&
      (pdf.splitTextToSize(pdfText(column.header), width - CELL_PAD * 2) as string[]).length > MAX_HEADER_LINES
    ) {
      width += 1
    }
    return width
  })
  const sum = widths.reduce((a, b) => a + b, 0)
  // Trop large : on réduit toutes les colonnes dans la même proportion.
  const factor = sum > available ? available / sum : 1
  const scaled = widths.map((w) => w * factor)
  const extra = available - scaled.reduce((a, b) => a + b, 0)
  // L'espace restant va à la colonne de texte au contenu le plus long (souvent « Nom »), pas aux nombres.
  let flex = 0
  let widest = -1
  table.columns.forEach((column, i) => {
    if (column.align === 'left' && i > 0 && contentWidths[i] > widest) {
      widest = contentWidths[i]
      flex = i
    }
  })
  scaled[flex] += Math.max(0, extra)

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(HEADER_PT)
  const headerLines = table.columns.map(
    (column, i) => pdf.splitTextToSize(pdfText(column.header), scaled[i] - CELL_PAD * 2) as string[],
  )
  return { widths: scaled, headerLines }
}

function truncate(pdf: Pdf, text: string, maxWidth: number): string {
  const full = pdfText(text)
  if (pdf.getTextWidth(full) <= maxWidth) return full
  let cut = full
  while (cut.length > 1 && pdf.getTextWidth(`${cut}…`) > maxWidth) cut = cut.slice(0, -1)
  return `${cut.trimEnd()}…`
}

/**
 * PDF des métrés : un bordereau imprimable, tableau par tableau, avec le cadre et le cartouche des
 * autres PDF. Les nombres sont alignés à droite, chaque tableau a sa ligne de total en gras, l'en-tête
 * d'un tableau qui continue est répété sur la page suivante. Les pages sont numérotées dans le cartouche.
 */
export async function buildMetresPdf(
  tables: readonly MetresTable[],
  sheet: SheetSize,
  labels: MetresPdfLabels,
): Promise<Blob> {
  const pdf = await createPdf(sheet)
  pdf.setProperties({
    title: `${labels.title} — ${labels.cartouche.projectName}`,
    subject: labels.cartouche.subtitle,
    creator: 'Fabrics',
  })

  const strip = cartoucheArea(sheet)
  const left = PDF_MARGIN_MM + PAD
  const right = sheet.width - PDF_MARGIN_MM - PAD
  const width = right - left
  const top = PDF_MARGIN_MM + PAD_TOP
  const bottom = strip.y - PAD_BOTTOM

  let y = top
  const newPage = () => {
    pdf.addPage([sheet.width, sheet.height], sheet.width > sheet.height ? 'landscape' : 'portrait')
    y = top
  }

  // En-tête du document, sur la première page seulement.
  pdf.setTextColor(...INK)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(14)
  pdf.text(pdfText(labels.title), left, y + 4)
  y += 8
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(NOTE_PT)
  pdf.setTextColor(...MUTED)
  for (const line of [labels.units, labels.note]) {
    const wrapped = pdf.splitTextToSize(pdfText(line), width) as string[]
    for (const part of wrapped) {
      pdf.text(part, left, y + 2.5)
      y += 3.4
    }
  }
  y += TABLE_GAP - 2

  for (const table of tables) {
    const layout = layoutTable(pdf, table, width)
    const headerHeight = Math.max(...layout.headerLines.map((lines) => lines.length)) * HEADER_LINE + 2.4
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(NOTE_PT)
    const noteLines = table.note ? (pdf.splitTextToSize(pdfText(table.note), width) as string[]) : []
    const titleHeight = TITLE_BLOCK + noteLines.length * 3.2

    let first = true
    let rowIndex = 0
    const drawTableStart = () => {
      // Titre, remarque (première page du tableau seulement), puis en-tête des colonnes.
      pdf.setTextColor(...INK)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(TITLE_PT)
      pdf.text(pdfText(first ? table.title : `${table.title} (${labels.continued})`), left, y + 4)
      let blockHeight = TITLE_BLOCK
      if (first && noteLines.length > 0) {
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(NOTE_PT)
        pdf.setTextColor(...MUTED)
        noteLines.forEach((line, i) => pdf.text(line, left, y + TITLE_BLOCK + 0.6 + i * 3.2))
        blockHeight = titleHeight
      }
      y += blockHeight

      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(HEADER_PT)
      pdf.setTextColor(...INK)
      let x = left
      table.columns.forEach((column, i) => {
        layout.headerLines[i].forEach((line, lineIndex) => {
          const baseline = y + 2.4 + lineIndex * HEADER_LINE
          if (column.align === 'right') pdf.text(line, x + layout.widths[i] - CELL_PAD, baseline, { align: 'right' })
          else pdf.text(line, x + CELL_PAD, baseline)
        })
        x += layout.widths[i]
      })
      y += headerHeight
      pdf.setDrawColor(...INK)
      pdf.setLineWidth(0.3)
      pdf.line(left, y, right, y)
      first = false
    }

    const drawRow = (cells: MetresCell[], bold: boolean, height: number) => {
      pdf.setFont('helvetica', bold ? 'bold' : 'normal')
      pdf.setFontSize(TEXT_PT)
      pdf.setTextColor(...INK)
      let x = left
      table.columns.forEach((column, i) => {
        const cell = cellText(cells[i] ?? '')
        const room = layout.widths[i] - CELL_PAD * 2
        if (column.align === 'right') {
          pdf.text(truncate(pdf, cell, room), x + layout.widths[i] - CELL_PAD, y + height - 1.7, { align: 'right' })
        } else {
          pdf.text(truncate(pdf, cell, room), x + CELL_PAD, y + height - 1.7)
        }
        x += layout.widths[i]
      })
      y += height
    }

    // Place pour le titre, l'en-tête et au moins deux lignes ; sinon, on commence la page suivante.
    const minimum = titleHeight + headerHeight + ROW_HEIGHT * 2
    if (y + minimum > bottom && y > top) newPage()
    drawTableStart()

    while (rowIndex < table.rows.length) {
      if (y + ROW_HEIGHT > bottom) {
        newPage()
        drawTableStart()
      }
      drawRow(table.rows[rowIndex], false, ROW_HEIGHT)
      pdf.setDrawColor(...HAIRLINE)
      pdf.setLineWidth(0.12)
      pdf.line(left, y, right, y)
      rowIndex++
    }

    if (table.total) {
      if (y + TOTAL_ROW_HEIGHT > bottom) {
        newPage()
        drawTableStart()
      }
      pdf.setDrawColor(...INK)
      pdf.setLineWidth(0.35)
      pdf.line(left, y, right, y)
      drawRow(table.total, true, TOTAL_ROW_HEIGHT)
    }
    y += TABLE_GAP
  }

  // Cadre et cartouche de chaque page (le numéro de page demande de connaître le total).
  const pageCount = pdf.getNumberOfPages()
  for (let page = 1; page <= pageCount; page++) {
    pdf.setPage(page)
    const c = labels.cartouche
    const fields: PlanPdfLabels['fields'] = [
      { label: c.dateLabel, value: c.date },
      { label: c.sheetLabel, value: c.sheet },
      { label: c.pageLabel, value: `${page}/${pageCount}` },
    ]
    drawCartouche(pdf, sheet, null, {
      projectName: c.projectName,
      subtitle: c.subtitle,
      fields,
      scaleBarUnit: '',
    })
  }
  return pdf.output('blob')
}
