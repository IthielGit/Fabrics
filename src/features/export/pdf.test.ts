import { describe, expect, it } from 'vitest'
import type { Drawing } from '../building/views/drawing'
import { buildDesignPdf, buildDrawingPdf, buildPlanPdf } from './pdf'
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
    const blob = await buildPlanPdf(PIXEL, sheet, placement.rect, {
      projectName: 'Maison',
      subtitle: 'Rez-de-chaussée · Pièces : 12,00 m²',
      fields: [
        { label: 'Échelle', value: '1:50' },
        { label: 'Date', value: '10/11/2026' },
        { label: 'Feuille', value: 'A3' },
      ],
      northAngle: 30,
    })
    const text = await textOf(blob)
    expect(text.startsWith('%PDF-')).toBe(true)
    const [width, height] = mediaBox(text)
    expect(width).toBeCloseTo(1190.55, 1)
    expect(height).toBeCloseTo(841.89, 1)
  })

  it('produit un PDF vectoriel d’une façade, à l’échelle : 2,50 m à 1:50 font 50 mm sur le papier', async () => {
    const drawing: Drawing = {
      width: 5000,
      height: 2500,
      polygons: [
        { points: [[0, 0], [5000, 0], [5000, 2500], [0, 2500]], fill: 'white' },
        { points: [[1000, 900], [2000, 900], [2000, 1900], [1000, 1900]], fill: 'black' },
      ],
      lines: [
        { x1: 0, y1: 2500, x2: 5000, y2: 2500, weight: 'heavy' },
        { x1: 0, y1: 0, x2: 5000, y2: 0, dashed: true, weight: 'hair', muted: true },
      ],
      texts: [{ x: 100, y: 200, text: 'Rez-de-chaussée', size: 150, muted: true }],
    }
    const sheet = sheetSize('a4', 'landscape')
    const placement = planPdfPlacement({ width: drawing.width, height: drawing.height }, sheet, 50)
    expect(placement.fits).toBe(true)
    expect(placement.rect.height).toBeCloseTo(50) // 2 500 mm ÷ 50
    expect(placement.rect.width).toBeCloseTo(100) // 5 000 mm ÷ 50

    const blob = await buildDrawingPdf(drawing, sheet, placement.rect, {
      projectName: 'Maison',
      subtitle: 'Façade Nord',
      fields: [
        { label: 'Échelle', value: '1:50' },
        { label: 'Date', value: '10/11/2026' },
        { label: 'Feuille', value: 'A4' },
      ],
    })
    const text = await textOf(blob)
    expect(text.startsWith('%PDF-')).toBe(true)
    const [width, height] = mediaBox(text)
    expect(width).toBeCloseTo(841.89, 1)
    expect(height).toBeCloseTo(595.28, 1)
  })
})
