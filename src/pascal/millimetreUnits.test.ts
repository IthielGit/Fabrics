import { formatAreaLabel, formatLinearMeasurement } from '@pascal-app/core'
import { useViewer } from '@pascal-app/viewer'
import { describe, expect, it } from 'vitest'
import { millimetrePatch, pinMillimetres } from './millimetreUnits'

describe('millimetrePatch', () => {
  it('ne change rien quand Pascal est déjà en mm', () => {
    expect(millimetrePatch({ unit: 'metric', metricNotation: 'millimeters', unitExplicit: true })).toBeNull()
  })

  it('ramène en mm un réglage en mètres ou en pieds', () => {
    const mm = { unit: 'metric', metricNotation: 'millimeters', unitExplicit: true }
    expect(millimetrePatch({ unit: 'metric', metricNotation: 'meters', unitExplicit: true })).toEqual(mm)
    expect(millimetrePatch({ unit: 'imperial', metricNotation: 'millimeters', unitExplicit: true })).toEqual(mm)
    expect(millimetrePatch({ unit: 'metric', metricNotation: 'millimeters', unitExplicit: false })).toEqual(mm)
  })
})

describe('pinMillimetres', () => {
  it('affiche les longueurs en mm et les surfaces en m² à 2 décimales, même sans notation explicite', () => {
    pinMillimetres()
    expect(formatLinearMeasurement(4, 'metric')).toMatch(/^4\s?000mm$/)
    expect(formatLinearMeasurement(2.7, 'metric')).toMatch(/^2\s?700mm$/)
    expect(formatAreaLabel(31.85, 'metric')).toMatch(/^31[.,]85m²$/)
  })

  it('remet la vue en mm si quelqu’un choisit les mètres', () => {
    pinMillimetres()
    useViewer.getState().setMetricNotation('meters')
    expect(useViewer.getState().metricNotation).toBe('millimeters')
    useViewer.getState().setUnit('imperial')
    expect(useViewer.getState().unit).toBe('metric')
  })
})
