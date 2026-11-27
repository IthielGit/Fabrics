import { describe, expect, it } from 'vitest'
import type { QuantityResult } from '../measurements/quantities/types'
import type { WorkItem } from './model'
import { EMPTY_FILTER, matchQuantities, unitCompatible, validateRule, type ElementFacts, type PricingRule } from './rules'

const RULE = { version: 'fr-2026.1' } as unknown as QuantityResult['rule']

function q(code: QuantityResult['code'], elementId: string, value: number, partId: string | null = null): QuantityResult {
  const dimension = code.endsWith('count') ? 'count' : code.endsWith('Volume') || code.endsWith('volume') ? 'volume' : code.endsWith('ength') ? 'length' : 'area'
  return {
    key: `takeoff:${code}:${elementId}${partId ? `:${partId}` : ''}`,
    family: 'takeoff',
    category: code.split('.')[0] as QuantityResult['category'],
    code,
    dimension,
    value,
    elementIds: [elementId],
    partId,
    levelId: 'L0',
    rule: RULE,
  }
}

function work(id: string, unit: string): WorkItem {
  return {
    id,
    libraryId: 'lib',
    code: id,
    category: '',
    designation: id,
    unit,
    priceHt: 10n,
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

function rule(id: string, patch: Partial<PricingRule>): PricingRule {
  return {
    id,
    libraryId: 'lib',
    name: id,
    quantityCode: 'wall.netArea',
    filter: EMPTY_FILTER,
    workItemId: 'masonry',
    wasteBp: 0,
    enabled: true,
    position: 0,
    updatedByEmail: '',
    updatedAt: '',
    ...patch,
  }
}

const facts = new Map<string, ElementFacts>([
  ['w1', { type: 'wall', wallMaterial: 'brick', thickness: 220, openingKind: null, layers: new Map([['c1', { material: 'plaster', thickness: 20 }]]) }],
  ['w2', { type: 'wall', wallMaterial: 'concrete', thickness: 150, openingKind: null, layers: new Map() }],
  ['d1', { type: 'opening', wallMaterial: null, thickness: null, openingKind: 'door', layers: new Map() }],
  ['r1', { type: 'room', wallMaterial: null, thickness: null, openingKind: null, layers: new Map() }],
])
const workItems = new Map([
  ['masonry', work('masonry', 'm²')],
  ['plaster', work('plaster', 'm2')],
  ['paint', work('paint', 'm²')],
  ['door', work('door', 'U')],
  ['concrete', work('concrete', 'm³')],
])
const quantities = [
  q('wall.netArea', 'w1', 13_110_000),
  q('wall.netArea', 'w2', 5_000_000),
  q('wall.plasterArea', 'w1', 26_000_000),
  q('wallLayer.area', 'w1', 13_110_000, 'c1'),
  q('opening.count', 'd1', 1),
  q('room.floorCoveringArea', 'r1', 20_000_000),
]

describe('matchQuantities', () => {
  it('envoie chaque quantité vers les postes des règles qui la visent, filtres compris', () => {
    const result = matchQuantities({
      quantities,
      facts,
      workItems,
      rules: [
        rule('brick', { filter: { ...EMPTY_FILTER, wallMaterial: 'brick', minThickness: 200 }, workItemId: 'masonry', wasteBp: 500 }),
        rule('plaster', { quantityCode: 'wall.plasterArea', workItemId: 'plaster', position: 1 }),
        rule('layer', { quantityCode: 'wallLayer.area', filter: { ...EMPTY_FILTER, layerMaterial: 'Plaster', maxThickness: 25 }, workItemId: 'paint', position: 2 }),
        rule('door', { quantityCode: 'opening.count', filter: { ...EMPTY_FILTER, openingKind: 'door' }, workItemId: 'door', position: 3 }),
      ],
    })
    expect(result.lines.map((l) => [l.workItemId, l.quantityKey, l.value, l.wasteBp])).toEqual([
      ['masonry', 'takeoff:wall.netArea:w1', 13_110_000, 500],
      ['plaster', 'takeoff:wall.plasterArea:w1', 26_000_000, 0],
      ['paint', 'takeoff:wallLayer.area:w1:c1', 13_110_000, 0],
      ['door', 'takeoff:opening.count:d1', 1, 0],
    ])
    expect(result.warnings).toEqual([])
    // Le mur en béton et la pièce n'ont aucun poste : couverture incomplète.
    expect(result.uncoveredElementIds.sort()).toEqual(['r1', 'w2'])
  })

  it('ne compte jamais deux fois une quantité dans un même poste', () => {
    const result = matchQuantities({
      quantities,
      facts,
      workItems,
      rules: [rule('a', { position: 0 }), rule('b', { position: 1 })],
    })
    expect(result.lines.filter((l) => l.quantityKey === 'takeoff:wall.netArea:w1')).toHaveLength(1)
    expect(result.warnings.filter((w) => w.code === 'doubleMatch')).toHaveLength(2)
  })

  it('refuse une unité de poste incompatible et signale un poste retiré', () => {
    const result = matchQuantities({
      quantities,
      facts,
      workItems,
      rules: [rule('vol', { workItemId: 'concrete' }), rule('gone', { workItemId: 'nope', position: 1 })],
    })
    expect(result.lines).toEqual([])
    expect(result.warnings.map((w) => w.code).sort()).toEqual(['ruleWithoutWork', 'unitMismatch', 'unitMismatch'])
  })

  it('applique les corrections à la main : poste remplacé, quantité retirée, ligne ajoutée', () => {
    const result = matchQuantities({
      quantities,
      facts,
      workItems,
      rules: [rule('all', { workItemId: 'masonry' })],
      overrides: [
        { id: 'o1', quantityKey: 'takeoff:wall.netArea:w1', ruleId: 'all', workItemId: 'paint', note: '' },
        { id: 'o2', quantityKey: 'takeoff:wall.netArea:w2', ruleId: 'all', workItemId: null, note: 'hors lot' },
        { id: 'o3', quantityKey: 'takeoff:room.floorCoveringArea:r1', ruleId: null, workItemId: 'plaster', note: '' },
      ],
    })
    expect(result.lines.map((l) => [l.workItemId, l.quantityKey, l.ruleId, l.overrideId])).toEqual([
      ['paint', 'takeoff:wall.netArea:w1', 'all', 'o1'],
      ['plaster', 'takeoff:room.floorCoveringArea:r1', null, 'o3'],
    ])
    expect(result.uncoveredElementIds.sort()).toEqual(['d1'])
  })

  it('une règle désactivée ne s’applique pas', () => {
    expect(matchQuantities({ quantities, facts, workItems, rules: [rule('off', { enabled: false })] }).lines).toEqual([])
  })
})

describe('unitCompatible', () => {
  it('relie chaque grandeur à ses unités', () => {
    expect(unitCompatible('area', 'm2')).toBe(true)
    expect(unitCompatible('volume', 'm³')).toBe(true)
    expect(unitCompatible('length', 'ml')).toBe(true)
    expect(unitCompatible('count', 'U')).toBe(true)
    expect(unitCompatible('count', 'ferme')).toBe(true)
    expect(unitCompatible('area', 'ml')).toBe(false)
    expect(unitCompatible('length', 'kg')).toBe(false)
  })
})

describe('validateRule', () => {
  it('nomme chaque problème', () => {
    const fields = rule('r', {})
    expect(validateRule(fields, workItems, 'area')).toEqual([])
    expect(validateRule({ ...fields, name: ' ', workItemId: null }, workItems, 'area')).toEqual(['name', 'work'])
    expect(validateRule({ ...fields, workItemId: 'door' }, workItems, 'area')).toEqual(['unitMismatch'])
    expect(validateRule({ ...fields, filter: { ...EMPTY_FILTER, minThickness: 300, maxThickness: 200 } }, workItems, 'area')).toEqual(['thickness'])
    expect(validateRule({ ...fields, wasteBp: -1 }, workItems, 'area')).toEqual(['waste'])
  })
})
