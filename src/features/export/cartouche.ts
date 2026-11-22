import type { CartoucheField } from './pdf'
import type { SheetFormat } from './pdfLayout'

/** Textes des cellules du cartouche (viennent de `src/i18n/fr.ts`). */
export interface CartoucheTexts {
  scaleLabel: string
  scaleLabelFit: string
  scale: (denominator: number) => string
  scaleFit: (denominator: number) => string
  dateLabel: string
  sheetLabel: string
}

/**
 * Cellules de droite du cartouche : échelle (« indicative » quand le plan est ajusté à la page, car
 * elle n'est alors pas garantie), date et format de la feuille.
 */
export function cartoucheFields(
  params: { exactScale: boolean; denominator: number; date: string; format: SheetFormat },
  texts: CartoucheTexts,
): CartoucheField[] {
  return [
    params.exactScale
      ? { label: texts.scaleLabel, value: texts.scale(params.denominator) }
      : { label: texts.scaleLabelFit, value: texts.scaleFit(params.denominator) },
    { label: texts.dateLabel, value: params.date },
    { label: texts.sheetLabel, value: params.format.toUpperCase() },
  ]
}

/** Statuts d'un document (M20 20.4, D20-3) : de l'esquisse au dossier d'exécution. */
export const SHEET_STATUSES = ['esquisse', 'aps', 'apd', 'pc', 'dce', 'exe'] as const
export type SheetStatus = (typeof SHEET_STATUSES)[number]

/** Renseignements d'une feuille saisis à l'export : émetteur, numéro de plan, indice, statut. */
export interface SheetInfo {
  issuer: string
  sheetNumber: string
  revision: string
  status: SheetStatus
}

export interface ColumnCartoucheTexts {
  sheetNumber: string
  revision: string
  date: string
  status: string
  scale: string
  format: string
  statuses: Record<SheetStatus, string>
  scaleValue: (denominator: number) => string
  scaleValueFit: (denominator: number) => string
}

/**
 * Cellules du bas du cartouche du gabarit `column` (référence Villa ROOMIT), deux par ligne :
 * N° de plan / Indice, Date / Statut, Échelle / Format. Une échelle « Ajuster » est dite indicative.
 */
export function columnCartoucheCells(
  info: SheetInfo,
  params: { exactScale: boolean; denominator: number; date: string; format: SheetFormat },
  texts: ColumnCartoucheTexts,
): CartoucheField[] {
  return [
    { label: texts.sheetNumber, value: info.sheetNumber },
    { label: texts.revision, value: info.revision },
    { label: texts.date, value: params.date },
    { label: texts.status, value: texts.statuses[info.status] },
    { label: texts.scale, value: params.exactScale ? texts.scaleValue(params.denominator) : texts.scaleValueFit(params.denominator) },
    { label: texts.format, value: params.format.toUpperCase() },
  ]
}
