import { describe, expect, it } from 'vitest'
import { THUMBNAIL_MAX_SIDE, thumbnailPixelRatio } from './thumbnail'

describe('thumbnailPixelRatio', () => {
  it('réduit une grande page pour que son plus grand côté fasse 320 px', () => {
    const ratio = thumbnailPixelRatio(1080, 1920)
    expect(1920 * ratio).toBeCloseTo(THUMBNAIL_MAX_SIDE)
    expect(1080 * ratio).toBeCloseTo(180)
  })

  it('agrandit une page affichée très petite', () => {
    const ratio = thumbnailPixelRatio(80, 40)
    expect(80 * ratio).toBeCloseTo(THUMBNAIL_MAX_SIDE)
  })

  it('accepte un autre côté maximal', () => {
    expect(thumbnailPixelRatio(1000, 500, 100)).toBeCloseTo(0.1)
  })

  it('ne divise pas par zéro', () => {
    expect(thumbnailPixelRatio(0, 0)).toBe(1)
  })
})
