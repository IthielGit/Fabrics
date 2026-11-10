import { describe, expect, it } from 'vitest'
import {
  cartoucheArea,
  defaultOrientation,
  designPdfPlacement,
  matchingSheetFormat,
  planPdfPlacement,
  printableArea,
  sheetSize,
} from './pdfLayout'

describe('feuilles', () => {
  it('donne la taille selon l’orientation', () => {
    expect(sheetSize('a4', 'portrait')).toEqual({ width: 210, height: 297 })
    expect(sheetSize('a3', 'landscape')).toEqual({ width: 420, height: 297 })
  })

  it('propose l’orientation qui épouse les proportions', () => {
    expect(defaultOrientation(1500, 500)).toBe('landscape')
    expect(defaultOrientation(1080, 1920)).toBe('portrait')
    expect(defaultOrientation(1080, 1080)).toBe('portrait')
  })

  it('zone imprimable : marges de 10 mm et bande de cartouche de 20 mm en bas', () => {
    const sheet = sheetSize('a4', 'portrait')
    expect(printableArea(sheet)).toEqual({ x: 10, y: 10, width: 190, height: 257 })
    expect(cartoucheArea(sheet)).toEqual({ x: 10, y: 267, width: 190, height: 20 })
  })
})

describe('designPdfPlacement', () => {
  it('centre le visuel avec des marges de 10 mm en gardant ses proportions', () => {
    const rect = designPdfPlacement(1080, 1080, 'a4', 'portrait')
    expect(rect.width).toBeCloseTo(190)
    expect(rect.height).toBeCloseTo(190)
    expect(rect.x).toBeCloseTo(10)
    expect(rect.y).toBeCloseTo((297 - 190) / 2)
  })

  it('occupe toute la page pour un visuel A4 sur une feuille A4', () => {
    expect(matchingSheetFormat(2480, 3508)).toBe('a4')
    expect(designPdfPlacement(2480, 3508, 'a4', 'portrait')).toEqual({
      x: 0,
      y: 0,
      width: 210,
      height: 297,
    })
  })

  it('un visuel A4 sur une feuille A3 reste centré avec marges', () => {
    const rect = designPdfPlacement(2480, 3508, 'a3', 'portrait')
    expect(rect.x).toBeGreaterThanOrEqual(10)
    expect(rect.width).toBeLessThan(297)
  })

  it('un visuel A4 sur une feuille A4 en sens inverse garde ses marges', () => {
    const rect = designPdfPlacement(2480, 3508, 'a4', 'landscape')
    expect(rect.x).toBeGreaterThan(0)
  })
})

describe('planPdfPlacement', () => {
  // Plan de 10 m × 6 m
  const extent = { width: 10000, height: 6000 }

  it('1:50 : 1,00 m réel = 20 mm sur le papier', () => {
    const placement = planPdfPlacement(extent, sheetSize('a3', 'landscape'), 50)
    expect(placement.rect.width).toBeCloseTo(200)
    expect(placement.rect.height).toBeCloseTo(120)
    expect(placement.exact).toBe(true)
    expect(placement.fits).toBe(true)
  })

  it('centre l’image dans la zone imprimable', () => {
    const sheet = sheetSize('a3', 'landscape')
    const placement = planPdfPlacement(extent, sheet, 50)
    const area = printableArea(sheet)
    expect(placement.rect.x - area.x).toBeCloseTo(area.x + area.width - (placement.rect.x + placement.rect.width))
  })

  it('signale un plan trop grand et propose l’échelle qui tient', () => {
    const placement = planPdfPlacement(extent, sheetSize('a4', 'portrait'), 20)
    expect(placement.fits).toBe(false)
    expect(placement.fittingScale).toBe(100)
  })

  it('aucune échelle standard ne tient pour un très grand plan', () => {
    const placement = planPdfPlacement({ width: 200000, height: 100000 }, sheetSize('a4', 'portrait'), 50)
    expect(placement.fittingScale).toBeNull()
  })

  it('« Ajuster » remplit la zone imprimable, sans garantir l’échelle', () => {
    const sheet = sheetSize('a4', 'portrait')
    const placement = planPdfPlacement(extent, sheet, 'fit')
    expect(placement.exact).toBe(false)
    expect(placement.fits).toBe(true)
    expect(placement.rect.width).toBeCloseTo(printableArea(sheet).width)
  })
})
