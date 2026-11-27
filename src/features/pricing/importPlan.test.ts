import { describe, expect, it } from 'vitest'
import { isEmptyPlan, planImport, summarizePlan } from './importPlan'
import { emptyPriceItem, type PriceItem, type PriceItemFields } from './model'

function fields(key: string, price: bigint | null, patch: Partial<PriceItemFields> = {}): PriceItemFields {
  return { ...emptyPriceItem('material', '2026-10-01'), designation: key, unit: 'U', priceHt: price, sourceKey: key, ...patch }
}

function stored(id: string, f: PriceItemFields): PriceItem {
  return { ...f, id, libraryId: 'lib', updatedByEmail: '', updatedAt: '' }
}

describe('planImport', () => {
  const existing = [
    stored('a', fields('MTX:1', 100n)),
    stored('b', fields('MTX:2', 200n)),
    stored('c', fields('MTX:3', 300n)),
    stored('m', fields('', 50n, { designation: 'Saisie à la main' })),
    stored('o', fields('MO:aide', 70n, { kind: 'labour' })),
  ]

  it('ajoute, met à jour, retire et garde les lignes saisies à la main', () => {
    const plan = planImport(
      { priceItems: existing, workItems: [] },
      { priceItems: [fields('MTX:1', 100n), fields('MTX:2', 250n), fields('MTX:4', 400n)], workItems: [] },
    )
    expect(plan.price.insert.map((f) => f.sourceKey)).toEqual(['MTX:4'])
    expect(plan.price.update.map((u) => [u.id, u.fields.priceHt])).toEqual([['b', 250n]])
    // MTX:3 retiré ; la ligne MO (autre source, absente du fichier) et la ligne à la main restent.
    expect(plan.price.remove).toEqual(['c'])
    expect(plan.price.unchanged).toBe(1)
    expect(plan.keptManual).toBe(1)
    expect(plan.priceChanges).toBe(1)
    expect(summarizePlan(plan, 3)).toEqual({
      added: 1,
      updated: 1,
      removed: 1,
      unchanged: 1,
      keptManual: 1,
      priceChanges: 1,
      warnings: 3,
    })
  })

  it('un réimport identique ne change rien', () => {
    const plan = planImport(
      { priceItems: existing, workItems: [] },
      { priceItems: existing.filter((e) => e.sourceKey).map(({ id: _id, libraryId: _l, updatedAt: _u, updatedByEmail: _e, ...f }) => f), workItems: [] },
    )
    expect(isEmptyPlan(plan)).toBe(true)
    expect(plan.price.unchanged).toBe(4)
  })

  it('une modification sans changement de prix est une mise à jour, pas un changement de prix', () => {
    const plan = planImport(
      { priceItems: existing, workItems: [] },
      { priceItems: [fields('MTX:1', 100n, { supplier: 'Nouveau' })], workItems: [] },
    )
    expect(plan.price.update).toHaveLength(1)
    expect(plan.priceChanges).toBe(0)
  })
})
