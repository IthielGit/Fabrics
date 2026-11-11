import type { Box } from '../geometry/box'

export type SheetFormat = 'a4' | 'a3'
export type Orientation = 'portrait' | 'landscape'

/** Feuilles en portrait, en mm. */
const SHEETS: Record<SheetFormat, { width: number; height: number }> = {
  a4: { width: 210, height: 297 },
  a3: { width: 297, height: 420 },
}

/** Marge de la feuille, en mm. */
export const PDF_MARGIN_MM = 10
/** Hauteur de la bande du bas réservée au cartouche et à la barre d'échelle, en mm. */
export const CARTOUCHE_HEIGHT_MM = 20

/** Échelles standard proposées pour un plan (dénominateurs). */
export const PLAN_SCALES = [20, 50, 100, 200] as const

/** Choix d'échelle d'un PDF de plan : un dénominateur, ou « Ajuster à la page ». */
export type ScaleChoice = number | 'fit'

export interface SheetSize {
  width: number
  height: number
}

export function sheetSize(format: SheetFormat, orientation: Orientation): SheetSize {
  const { width, height } = SHEETS[format]
  return orientation === 'portrait' ? { width, height } : { width: height, height: width }
}

/** Orientation qui épouse le mieux les proportions de la zone (paysage si elle est plus large). */
export function defaultOrientation(width: number, height: number): Orientation {
  return width > height ? 'landscape' : 'portrait'
}

/** Rectangle en mm sur la feuille. */
export type Rect = Box

/** Zone imprimable : la feuille moins les marges et moins la bande du cartouche en bas. */
export function printableArea(sheet: SheetSize): Rect {
  return {
    x: PDF_MARGIN_MM,
    y: PDF_MARGIN_MM,
    width: sheet.width - PDF_MARGIN_MM * 2,
    height: sheet.height - PDF_MARGIN_MM * 2 - CARTOUCHE_HEIGHT_MM,
  }
}

/** Bande du bas, réservée au cartouche et à la barre d'échelle. */
export function cartoucheArea(sheet: SheetSize): Rect {
  return {
    x: PDF_MARGIN_MM,
    y: sheet.height - PDF_MARGIN_MM - CARTOUCHE_HEIGHT_MM,
    width: sheet.width - PDF_MARGIN_MM * 2,
    height: CARTOUCHE_HEIGHT_MM,
  }
}

/** Format de feuille dont la page (en px à 300 dpi, dans un sens ou l'autre) est exactement la taille. */
export function matchingSheetFormat(pageWidth: number, pageHeight: number): SheetFormat | null {
  const dims: Record<SheetFormat, [number, number]> = { a4: [2480, 3508], a3: [3508, 4961] }
  for (const format of ['a4', 'a3'] as const) {
    const [w, h] = dims[format]
    if ((pageWidth === w && pageHeight === h) || (pageWidth === h && pageHeight === w)) return format
  }
  return null
}

/**
 * Emplacement d'un Visuel sur la feuille : centré dans la feuille moins les marges, proportions
 * conservées. Exception : un Visuel au format A4 (ou A3) exporté sur la même feuille, dans le
 * même sens, occupe toute la page.
 */
export function designPdfPlacement(
  pageWidth: number,
  pageHeight: number,
  format: SheetFormat,
  orientation: Orientation,
): Rect {
  const sheet = sheetSize(format, orientation)
  const sameFormat = matchingSheetFormat(pageWidth, pageHeight) === format
  const sameDirection = pageWidth > pageHeight === (orientation === 'landscape')
  if (sameFormat && sameDirection) {
    return { x: 0, y: 0, width: sheet.width, height: sheet.height }
  }
  const available = {
    width: sheet.width - PDF_MARGIN_MM * 2,
    height: sheet.height - PDF_MARGIN_MM * 2,
  }
  const factor = Math.min(available.width / pageWidth, available.height / pageHeight)
  const width = pageWidth * factor
  const height = pageHeight * factor
  return {
    x: (sheet.width - width) / 2,
    y: (sheet.height - height) / 2,
    width,
    height,
  }
}

export interface PlanPdfPlacement {
  /** Emplacement de l'image du plan sur la feuille, en mm. */
  rect: Rect
  /** Dénominateur réel de l'échelle (1:x). Pour « Ajuster », valeur calculée, non garantie. */
  scale: number
  /** Vrai si l'échelle demandée est respectée (« Ajuster » ne la garantit pas). */
  exact: boolean
  /** Vrai si le plan, à l'échelle demandée, tient dans la zone imprimable. */
  fits: boolean
  /** Plus grande échelle standard (la plus proche) qui tient ; `null` si aucune ne tient. */
  fittingScale: number | null
}

/** Taille sur le papier (mm) d'une zone de `extent` mm réels à l'échelle 1:`scale`. */
function paperSize(extent: { width: number; height: number }, scale: number) {
  return { width: extent.width / scale, height: extent.height / scale }
}

function fitsIn(size: { width: number; height: number }, area: Rect): boolean {
  // Petite tolérance : 1 micromètre de papier.
  return size.width <= area.width + 1e-3 && size.height <= area.height + 1e-3
}

/**
 * Place l'emprise d'un plan sur la feuille. Taille sur le papier = taille réelle ÷ échelle.
 * Avec « Ajuster », le plan est agrandi ou réduit pour remplir la zone imprimable. L'image est
 * centrée dans la zone imprimable.
 */
export function planPdfPlacement(
  extent: { width: number; height: number },
  sheet: SheetSize,
  choice: ScaleChoice,
): PlanPdfPlacement {
  const area = printableArea(sheet)
  const fittingScale = PLAN_SCALES.find((s) => fitsIn(paperSize(extent, s), area)) ?? null

  let scale: number
  if (choice === 'fit') {
    scale = Math.max(extent.width / area.width, extent.height / area.height)
  } else {
    scale = choice
  }
  const size = paperSize(extent, scale)
  const rect: Rect = {
    x: area.x + (area.width - size.width) / 2,
    y: area.y + (area.height - size.height) / 2,
    width: size.width,
    height: size.height,
  }
  return {
    rect,
    scale,
    exact: choice !== 'fit',
    fits: fitsIn(size, area),
    fittingScale,
  }
}

export interface ScaleBarSpec {
  /** Longueur réelle d'un des deux segments de la barre, en mm. */
  segmentMm: number
  /** Longueur de toute la barre sur le papier, en mm. */
  paperLength: number
}

/** Longueurs réelles de segment proposées pour la barre d'échelle (mm), de la plus petite à la plus grande. */
const SCALE_BAR_SEGMENTS_MM = [100, 200, 500, 1000, 2000, 5000, 10000, 20000]

/**
 * Barre d'échelle graphique à deux segments : la plus longue qui tient dans `maxPaperMm` de papier
 * (1:50 donne 2 × 1000 mm sur 40 mm, 1:100 donne 2 × 2000 mm). Si même la plus courte est trop
 * longue, on garde la plus courte.
 */
export function scaleBarSpec(scale: number, maxPaperMm: number): ScaleBarSpec {
  const safeScale = scale > 0 ? scale : 1
  let segmentMm = SCALE_BAR_SEGMENTS_MM[0]
  for (const candidate of SCALE_BAR_SEGMENTS_MM) {
    if ((candidate * 2) / safeScale <= maxPaperMm) segmentMm = candidate
  }
  return { segmentMm, paperLength: (segmentMm * 2) / safeScale }
}
