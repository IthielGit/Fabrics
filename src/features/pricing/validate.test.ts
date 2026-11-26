import { describe, expect, it } from 'vitest'
import { emptyPriceItem, type PriceItemFields, type WorkItemFields } from './model'
import { normalizeUnit } from './units'
import { validatePriceItem, validateWorkItem } from './validate'

function item(patch: Partial<PriceItemFields>): PriceItemFields {
  return {
    ...emptyPriceItem('material', '2026-10-01'),
    code: 'T-1',
    designation: 'Ciment synthétique',
    unit: 'Sac',
    priceHt: 350000n,
    ...patch,
  }
}

describe('validatePriceItem', () => {
  it('accepte une ligne complète', () => {
    expect(validatePriceItem(item({}))).toEqual({ errors: [], warnings: [] })
  })

  it('refuse une ligne sans désignation ni unité', () => {
    expect(validatePriceItem(item({ designation: ' ', unit: '' })).errors).toEqual([
      'designationMissing',
      'unitMissing',
    ])
  })

  it('refuse un prix négatif et une date invalide', () => {
    const result = validatePriceItem(item({ priceHt: -1n, effectiveDate: '2026-02-30' }))
    expect(result.errors).toEqual(['negativePrice', 'invalidDate'])
  })

  it('refuse un prix source sans prix HT', () => {
    expect(validatePriceItem(item({ sourcePrice: 420000n, priceHt: null })).errors).toContain('sourceWithoutPrice')
  })

  it('signale sans bloquer : sans prix, sans code, unité inconnue', () => {
    const result = validatePriceItem(item({ priceHt: null, code: '', unit: 'Bidon' }))
    expect(result.errors).toEqual([])
    expect(result.warnings).toEqual(['unitUnknown', 'noPrice', 'codeMissing'])
  })
})

describe('validateWorkItem', () => {
  const work: WorkItemFields = {
    code: 'CAT-99-001',
    category: 'Essai',
    designation: 'Poste synthétique',
    unit: 'm²',
    priceHt: 450000n,
    referencePrice: null,
    sourceCoefficient: '',
    output: '1',
    components: [],
    sourceRow: '',
  }

  it('accepte un poste complet', () => {
    expect(validateWorkItem(work)).toEqual({ errors: [], warnings: [] })
  })

  it('signale un poste sans prix (bloquera le devis définitif)', () => {
    expect(validateWorkItem({ ...work, priceHt: null }).warnings).toEqual(['noPrice'])
  })
})

describe('normalizeUnit', () => {
  it('normalise les écritures courantes et le signale', () => {
    expect(normalizeUnit('m2')).toEqual({ unit: 'm²', changed: true, known: true })
    expect(normalizeUnit('J ')).toEqual({ unit: 'J', changed: true, known: true })
    expect(normalizeUnit('Fft')).toEqual({ unit: 'FFT', changed: true, known: true })
    expect(normalizeUnit('Sac')).toEqual({ unit: 'Sac', changed: false, known: true })
    expect(normalizeUnit('Bidon')).toEqual({ unit: 'Bidon', changed: false, known: false })
  })
})
