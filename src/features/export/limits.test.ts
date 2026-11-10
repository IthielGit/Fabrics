import { describe, expect, it } from 'vitest'
import {
  fitsPixelLimits,
  imageExportSize,
  MAX_SIDE_PX,
  pdfRasterSize,
  resolutionOptions,
} from './limits'

describe('fitsPixelLimits', () => {
  it('accepte une image dans les plafonds', () => {
    expect(fitsPixelLimits(4096, 4096)).toBe(true)
    expect(fitsPixelLimits(MAX_SIDE_PX, 2048)).toBe(true)
  })

  it('refuse un côté trop grand ou trop de pixels au total', () => {
    expect(fitsPixelLimits(MAX_SIDE_PX + 1, 10)).toBe(false)
    expect(fitsPixelLimits(4097, 4097)).toBe(false)
  })
})

describe('imageExportSize', () => {
  it('Visuel : le post carré ×2 fait 2160 × 2160 px', () => {
    expect(imageExportSize(1080, 1080, 'px', 2)).toEqual({ width: 2160, height: 2160 })
  })

  it('Plan : ×1 vaut 0,2 px par mm', () => {
    expect(imageExportSize(10000, 5000, 'mm', 1)).toEqual({ width: 2000, height: 1000 })
    expect(imageExportSize(10000, 5000, 'mm', 3)).toEqual({ width: 6000, height: 3000 })
  })
})

describe('resolutionOptions', () => {
  it('grise les résolutions qui dépassent les plafonds', () => {
    // A3 à 300 dpi : 3508 × 4961 = 17,4 Mpx, déjà au-dessus de 16,7 Mpx à ×1.
    const options = resolutionOptions(3508, 4961, 'px')
    expect(options.map((o) => o.multiplier)).toEqual([0.5, 1, 2, 3])
    expect(options.map((o) => o.allowed)).toEqual([true, false, false, false])
  })

  it('autorise toutes les résolutions pour un petit visuel', () => {
    expect(resolutionOptions(1080, 1080, 'px').every((o) => o.allowed)).toBe(true)
  })
})

describe('pdfRasterSize', () => {
  it('calcule la taille à 200 dpi', () => {
    const { dpi, size } = pdfRasterSize(210, 297)
    expect(dpi).toBe(200)
    expect(size).toEqual({ width: 1654, height: 2339 })
  })

  it('réduit le dpi pour respecter le plafond', () => {
    const { dpi, size } = pdfRasterSize(2000, 2000)
    expect(dpi).toBeLessThan(200)
    expect(fitsPixelLimits(size.width, size.height)).toBe(true)
  })
})
