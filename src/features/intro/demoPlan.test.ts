import { describe, expect, it } from 'vitest'
import { formatArea, formatLength } from '../units/format'
import { DEMO_DIMENSIONS, DEMO_PLAN_SIZE, measureDemoRooms, totalDemoArea } from './demoPlan'

describe('plan de démonstration', () => {
  const measures = measureDemoRooms()
  const byId = Object.fromEntries(measures.map((m) => [m.id, m]))

  it('calcule la surface de chaque pièce', () => {
    expect(formatArea(byId.sejour.areaMm2)).toBe('21,84 m²')
    expect(formatArea(byId.cuisine.areaMm2)).toBe('11,20 m²')
    expect(formatArea(byId.entree.areaMm2)).toBe('3,50 m²')
  })

  it('calcule le périmètre en mm', () => {
    expect(formatLength(byId.sejour.perimeterMm)).toBe('18800 mm')
    expect(formatLength(byId.cuisine.perimeterMm)).toBe('13400 mm')
  })

  it('additionne la surface totale', () => {
    expect(formatArea(totalDemoArea(measures))).toBe('36,54 m²')
  })

  it('place l’étiquette au centre de la pièce', () => {
    expect(byId.cuisine.center).toEqual({ x: 6950, y: 1600 })
  })

  it('a des cotes cohérentes avec la taille du plan', () => {
    const sum = (values: readonly number[]) => values.reduce((a, b) => a + b, 0)
    expect(sum(DEMO_DIMENSIONS.bottom)).toBe(DEMO_PLAN_SIZE.width)
    expect(sum(DEMO_DIMENSIONS.right)).toBe(DEMO_PLAN_SIZE.depth)
    expect(sum(DEMO_DIMENSIONS.left)).toBe(DEMO_PLAN_SIZE.depth)
  })
})
