import { describe, expect, it } from 'vitest'
import { PLAN_PAGE } from './createProject'
import { PAGE_LIMITS, PLAN_PAGE_FORMATS, clampPageDimension, isSamePageSize } from './pageSize'

describe('pageSize', () => {
  it('arrondit et borne les dimensions', () => {
    expect(clampPageDimension(12345.6, 'mm')).toBe(12346)
    expect(clampPageDimension(5, 'mm')).toBe(PAGE_LIMITS.mm.min)
    expect(clampPageDimension(9e9, 'mm')).toBe(PAGE_LIMITS.mm.max)
    expect(clampPageDimension(50, 'px')).toBe(PAGE_LIMITS.px.min)
    expect(clampPageDimension(Number.NaN, 'px')).toBe(PAGE_LIMITS.px.min)
  })

  it('propose la page par défaut des plans et reste dans les limites', () => {
    expect(PLAN_PAGE_FORMATS.some((f) => isSamePageSize(f, PLAN_PAGE))).toBe(true)
    for (const f of PLAN_PAGE_FORMATS) {
      expect(clampPageDimension(f.width, 'mm')).toBe(f.width)
      expect(clampPageDimension(f.height, 'mm')).toBe(f.height)
    }
  })
})
