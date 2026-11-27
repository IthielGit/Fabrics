import { describe, expect, it } from 'vitest'
import {
  computeEstimate,
  formatK1,
  formatQuantity,
  k1Millionths,
  lineAmount,
  quantityDecimals,
  salePrice,
  vatOf,
  type EstimateSettings,
} from './estimate'
import type { WorkItem } from './model'
import type { MatchedLine } from './rules'

const NO_K1: EstimateSettings = { a1Bp: 0, a2Bp: 0, a3Bp: 0, vatRateBp: 2000 }
const EXAMPLE: EstimateSettings = { a1Bp: 500, a2Bp: 500, a3Bp: 0, vatRateBp: 2000 }

function work(id: string, unit: string, priceHt: bigint | null, category = 'Maçonnerie'): WorkItem {
  return {
    id,
    libraryId: 'lib',
    code: id,
    category,
    designation: `Poste ${id}`,
    unit,
    priceHt,
    referencePrice: null,
    sourceCoefficient: '',
    output: '',
    components: [],
    sourceRow: '',
    sourceKey: '',
    updatedByEmail: '',
    updatedAt: '',
  }
}

function line(workItemId: string, value: number, patch: Partial<MatchedLine> = {}): MatchedLine {
  return {
    workItemId,
    quantityKey: `takeoff:wall.netArea:${value}`,
    code: 'wall.netArea',
    dimension: 'area',
    value,
    elementIds: ['w'],
    partId: null,
    levelId: null,
    status: 'validated',
    ruleId: 'r',
    overrideId: null,
    wasteBp: 0,
    ...patch,
  }
}

describe('arrondis du DQE', () => {
  it('gate G6 : 13,11 m² × 45 000,0 Ar/m² = 589 950 Ar → 590 000 Ar HT', () => {
    expect(lineAmount(1311n, 2, 450000n)).toBe(5900000n)
  })

  it('un montant déjà rond ne change pas', () => {
    expect(lineAmount(100n, 2, 450000n)).toBe(450000n) // 1,00 m² × 45 000 = 45 000 Ar
  })

  it('K1 = (1 + A1)(1 + A2)(1 + A3) = 1,1025 avec les valeurs du classeur', () => {
    expect(k1Millionths(EXAMPLE)).toBe(1102500n)
    expect(formatK1(1102500n)).toBe('1,1025')
    expect(formatK1(1000000n)).toBe('1')
    // 45 000,0 × 1,1025 = 49 612,5
    expect(salePrice(450000n, EXAMPLE)).toBe(496125n)
  })

  it('TVA à la centaine supérieure', () => {
    expect(vatOf(5900000n, 2000)).toBe(1180000n)
    expect(vatOf(1000n, 2000)).toBe(1000n) // 100 Ar × 20 % = 20 Ar → 100 Ar
  })

  it('décimales de la quantité selon l’unité du poste (D23-19)', () => {
    expect([quantityDecimals('m2'), quantityDecimals('m³'), quantityDecimals('ml'), quantityDecimals('U'), quantityDecimals('FFT')]).toEqual([
      2, 3, 2, 0, 0,
    ])
    expect(formatQuantity(1311n, 2)).toBe('13,11')
    expect(formatQuantity(5n, 3)).toBe('0,005')
    expect(formatQuantity(12345n, 0)).toBe('12 345')
  })
})

describe('computeEstimate', () => {
  const workItems = new Map([
    ['A', work('A', 'm²', 450000n)],
    ['B', work('B', 'U', 1000000n, 'Menuiserie')],
    ['C', work('C', 'ml', null, 'Menuiserie')],
  ])

  it('exemple du gate G6 sans K1 : 590 000 Ar HT, TVA 118 000 Ar, TTC 708 000 Ar', () => {
    const estimate = computeEstimate({ lines: [line('A', 13_110_000)], workItems, settings: NO_K1 })
    expect(estimate.lots[0].lines[0]).toMatchObject({ quantity: 1311n, quantityDecimals: 2, salePriceHt: 450000n, amountHt: 5900000n })
    expect([estimate.totalHt, estimate.vat, estimate.totalTtc]).toEqual([5900000n, 1180000n, 7080000n])
    expect(estimate.overheadAndMargin).toBe(0n)
  })

  it('somme les quantités d’un poste avant l’arrondi, perte comprise', () => {
    const estimate = computeEstimate({
      lines: [line('A', 5_004_000, { wasteBp: 500 }), line('A', 5_004_000, { quantityKey: 'k2', wasteBp: 500 })],
      workItems,
      settings: NO_K1,
    })
    // 2 × 5,004 m² × 1,05 = 10,5084 → 10,51 m²
    expect(estimate.lots[0].lines[0].quantity).toBe(1051n)
    expect(estimate.lots[0].lines[0].sources).toHaveLength(2)
  })

  it('K1 dans chaque prix, décomposition débours / frais et marge (D23-19)', () => {
    const estimate = computeEstimate({ lines: [line('A', 13_110_000)], workItems, settings: EXAMPLE })
    const l = estimate.lots[0].lines[0]
    expect(l.salePriceHt).toBe(496125n)
    // 13,11 × 49 612,5 = 650 419,875 → 650 500 Ar
    expect(l.amountHt).toBe(6505000n)
    expect(l.debours).toBe(5900000n)
    expect(estimate.overheadAndMargin).toBe(605000n)
  })

  it('lots par catégorie, sous-totaux, poste sans prix compté et sans montant', () => {
    const estimate = computeEstimate({
      lines: [
        line('A', 1_000_000),
        line('B', 2, { code: 'opening.count', dimension: 'count', quantityKey: 'o' }),
        line('C', 2500, { code: 'room.skirtingLength', dimension: 'length', quantityKey: 's', status: 'provisional' }),
      ],
      workItems,
      settings: NO_K1,
    })
    expect(estimate.lots.map((lot) => [lot.category, lot.subtotalHt])).toEqual([
      ['Maçonnerie', 450000n],
      ['Menuiserie', 2000000n],
    ])
    const c = estimate.lots[1].lines.find((l) => l.workItemId === 'C')!
    expect(c).toMatchObject({ quantity: 250n, amountHt: null, provisional: true })
    expect(estimate.linesWithoutPrice).toBe(1)
    expect(estimate.provisionalLines).toBe(1)
    expect(estimate.totalHt).toBe(2450000n)
  })

  it('même entrée → même DQE (déterministe)', () => {
    const input = { lines: [line('A', 13_110_000), line('B', 3, { dimension: 'count', quantityKey: 'o' })], workItems, settings: EXAMPLE }
    expect(computeEstimate(input)).toEqual(computeEstimate(input))
  })
})
