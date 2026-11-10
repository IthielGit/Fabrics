import { describe, expect, it } from 'vitest'
import { buildDesignPdf, buildPlanPdf } from './pdf'
import { planPdfPlacement, sheetSize } from './pdfLayout'

// PNG de 1 × 1 pixel.
const PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

/** Largeur et hauteur de la première page, en points (1 pt = 1/72 pouce). */
function mediaBox(pdfText: string): [number, number] {
  const match = /MediaBox \[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/.exec(pdfText)
  if (!match) throw new Error('MediaBox introuvable')
  return [Number(match[1]), Number(match[2])]
}

async function textOf(blob: Blob): Promise<string> {
  return new TextDecoder('latin1').decode(await blob.arrayBuffer())
}

describe('PDF', () => {
  it('produit un PDF de Visuel valide à la taille de la feuille (A4 portrait)', async () => {
    const sheet = sheetSize('a4', 'portrait')
    const blob = await buildDesignPdf(PIXEL, sheet, { x: 10, y: 50, width: 190, height: 190 }, 'Test')
    const text = await textOf(blob)
    expect(text.startsWith('%PDF-')).toBe(true)
    // 210 × 297 mm = 595,28 × 841,89 points
    const [width, height] = mediaBox(text)
    expect(width).toBeCloseTo(595.28, 1)
    expect(height).toBeCloseTo(841.89, 1)
  })

  it('produit un PDF de plan en A3 paysage avec cartouche', async () => {
    const sheet = sheetSize('a3', 'landscape')
    const placement = planPdfPlacement({ width: 10000, height: 6000 }, sheet, 50)
    const blob = await buildPlanPdf(PIXEL, sheet, placement.rect, 50, {
      projectName: 'Maison',
      scaleText: 'Échelle 1:50',
      dateText: 'Date : 10/11/2026',
      areaText: 'Pièces : 12,00 m²',
      scaleBarLabel: '1 m',
    })
    const text = await textOf(blob)
    expect(text.startsWith('%PDF-')).toBe(true)
    const [width, height] = mediaBox(text)
    expect(width).toBeCloseTo(1190.55, 1)
    expect(height).toBeCloseTo(841.89, 1)
  })
})
