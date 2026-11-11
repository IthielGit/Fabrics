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
