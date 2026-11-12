import { describe, expect, it } from 'vitest'
import { regionWithOverlay } from './planOverlay'

describe('zone exportée avec les cotes automatiques', () => {
  const region = { x: 0, y: 0, width: 6000, height: 4000 }

  it('sans cotes : zone inchangée', () => {
    expect(regionWithOverlay(region, null, 100)).toBe(region)
    expect(regionWithOverlay(region, { lines: [], texts: [] }, 100)).toBe(region)
  })

  it('englobe une chaîne au-dessus du bâtiment, avec la marge', () => {
    const overlay = { lines: [{ x1: 0, y1: -2000, x2: 6000, y2: -2000 }], texts: [] }
    expect(regionWithOverlay(region, overlay, 100)).toEqual({ x: -100, y: -2100, width: 6200, height: 6100 })
  })
})
