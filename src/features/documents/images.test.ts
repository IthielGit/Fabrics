import { describe, expect, it } from 'vitest'
import { MAX_IMAGE_BYTES, checkImageFile, fitImageSize } from './images'

describe('checkImageFile', () => {
  it('accepte PNG, JPEG, WebP et GIF', () => {
    for (const type of ['image/png', 'image/jpeg', 'image/webp', 'image/gif']) {
      expect(checkImageFile({ type, size: 1000 })).toBe('ok')
    }
  })

  it('refuse les autres types (PDF, SVG, texte…)', () => {
    expect(checkImageFile({ type: 'application/pdf', size: 1000 })).toBe('unsupported')
    expect(checkImageFile({ type: 'image/svg+xml', size: 1000 })).toBe('unsupported')
    expect(checkImageFile({ type: '', size: 1000 })).toBe('unsupported')
  })

  it('refuse un fichier de plus de 20 Mo', () => {
    expect(checkImageFile({ type: 'image/png', size: MAX_IMAGE_BYTES })).toBe('ok')
    expect(checkImageFile({ type: 'image/png', size: MAX_IMAGE_BYTES + 1 })).toBe('too-large')
  })
})

describe('fitImageSize', () => {
  const post = { width: 1080, height: 1080 }

  it('réduit une grande photo pour qu’elle tienne dans la moitié de la page', () => {
    const size = fitImageSize({ width: 4000, height: 3000 }, post, 'px')
    expect(size.width).toBeCloseTo(540)
    expect(size.height).toBeCloseTo(405)
  })

  it('ne dépasse jamais la moitié de la page en hauteur non plus', () => {
    const size = fitImageSize({ width: 1000, height: 4000 }, post, 'px')
    expect(size.height).toBeCloseTo(540)
    expect(size.width).toBeCloseTo(135)
  })

  it('garde la taille d’origine d’une petite image sur un visuel', () => {
    expect(fitImageSize({ width: 100, height: 50 }, post, 'px')).toEqual({ width: 100, height: 50 })
  })

  it('ajuste une image à la moitié de la page sur un plan (mm)', () => {
    const size = fitImageSize({ width: 2000, height: 1000 }, { width: 20000, height: 15000 }, 'mm')
    expect(size.width).toBeCloseTo(10000)
    expect(size.height).toBeCloseTo(5000)
  })

  it('conserve les proportions', () => {
    const size = fitImageSize({ width: 3000, height: 1000 }, post, 'px')
    expect(size.width / size.height).toBeCloseTo(3)
  })
})
