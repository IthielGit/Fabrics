import { describe, expect, it } from 'vitest'
import { computeEstimate, type EstimateSettings } from './estimate'
import { canFinalize, canonicalJson, diffEstimates, fingerprintSource, freezeEstimate } from './estimateVersions'
import type { WorkItem } from './model'
import type { MatchedLine } from './rules'

const SETTINGS: EstimateSettings = { a1Bp: 0, a2Bp: 0, a3Bp: 0, vatRateBp: 2000 }

function work(id: string, priceHt: bigint | null): WorkItem {
  return { id, libraryId: 'l', code: id, category: 'Lot', designation: id, unit: 'm²', priceHt, referencePrice: null, sourceCoefficient: '', output: '', components: [], sourceRow: '', sourceKey: '', updatedByEmail: '', updatedAt: '' }
}

function line(workItemId: string, value: number): MatchedLine {
  return { workItemId, quantityKey: `k:${workItemId}`, code: 'wall.netArea', dimension: 'area', value, elementIds: ['w'], partId: null, levelId: null, status: 'validated', ruleId: 'r', overrideId: null, wasteBp: 0 }
}

function estimate(lines: MatchedLine[], items: WorkItem[]) {
  return freezeEstimate(computeEstimate({ lines, workItems: new Map(items.map((w) => [w.id, w])), settings: SETTINGS }))
}

describe('versions du devis', () => {
  it('fige les montants en texte, sans perte', () => {
    const frozen = estimate([line('A', 13_110_000)], [work('A', 450000n)])
    expect(frozen.lines[0]).toMatchObject({ quantity: '1311', amountHt: '5900000', unitPriceHt: '450000' })
    expect(frozen.totalTtc).toBe('7080000')
    expect(JSON.parse(JSON.stringify(frozen))).toEqual(frozen)
  })

  it('un poste sans prix empêche de marquer le devis définitif (gate G6)', () => {
    expect(canFinalize(estimate([line('A', 1_000_000)], [work('A', 450000n)]))).toBe(true)
    expect(canFinalize(estimate([line('A', 1_000_000), line('B', 1_000_000)], [work('A', 450000n), work('B', null)]))).toBe(false)
    expect(canFinalize(estimate([], []))).toBe(false)
  })

  it('compare deux versions : quantité changée, poste ajouté, poste retiré', () => {
    const before = estimate([line('A', 10_000_000), line('B', 1_000_000)], [work('A', 100000n), work('B', 100000n), work('C', 100000n)])
    const after = estimate([line('A', 12_000_000), line('C', 1_000_000)], [work('A', 100000n), work('B', 100000n), work('C', 100000n)])
    const diff = diffEstimates(before, after)
    expect(diff.lines.map((l) => [l.code, l.change, l.amountDelta])).toEqual([
      ['A', 'quantity', 200000n],
      ['B', 'removed', -100000n],
      ['C', 'added', 100000n],
    ])
    expect(diff.totalHtDelta).toBe(200000n)
    expect(diffEstimates(before, before)).toMatchObject({ lines: [], totalHtDelta: 0n, unchanged: 2 })
  })

  it('l’empreinte ne dépend pas de l’ordre, mais change avec un prix', () => {
    const base = { quantities: [{ key: 'b', value: 2 }, { key: 'a', value: 1 }], workItems: [{ id: 'A', unit: 'm²', priceHt: 1n }], rules: [], overrides: [], settings: SETTINGS }
    const same = { ...base, quantities: [...base.quantities].reverse() }
    expect(fingerprintSource(base)).toBe(fingerprintSource(same))
    expect(fingerprintSource({ ...base, workItems: [{ id: 'A', unit: 'm²', priceHt: 2n }] })).not.toBe(fingerprintSource(base))
    expect(canonicalJson({ b: 1, a: [1n, null] })).toBe('{"a":["1n",null],"b":1}')
  })
})
