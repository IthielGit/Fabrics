import { describe, expect, it } from 'vitest'
import { manualDimensionVisible } from './visibility'

describe('cotes tracées à la main selon la version', () => {
  it('sans champ : visible partout (projet d’avant M10 ter)', () => {
    for (const mode of ['none', 'client', 'execution'] as const) {
      expect(manualDimensionVisible({}, mode)).toBe(true)
    }
  })

  it('une cote « Exécution » n’apparaît pas en Client', () => {
    expect(manualDimensionVisible({ visibleIn: 'execution' }, 'client')).toBe(false)
    expect(manualDimensionVisible({ visibleIn: 'execution' }, 'execution')).toBe(true)
    expect(manualDimensionVisible({ visibleIn: 'client' }, 'execution')).toBe(false)
  })

  it('cotation « Aucune » : toutes les cotes tracées à la main restent visibles', () => {
    expect(manualDimensionVisible({ visibleIn: 'execution' }, 'none')).toBe(true)
    expect(manualDimensionVisible({ visibleIn: 'client' }, 'none')).toBe(true)
  })
})
