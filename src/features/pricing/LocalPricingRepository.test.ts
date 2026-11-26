import { describe, expect, it } from 'vitest'
import { LocalPricingRepository, memoryPricingStorage } from './LocalPricingRepository'
import { emptyPriceItem, type WorkItemFields } from './model'

function makeRepo() {
  let n = 0
  let t = 0
  return new LocalPricingRepository(
    memoryPricingStorage(),
    () => `2026-11-26T10:00:${String(t++).padStart(2, '0')}Z`,
    () => `id-${++n}`,
  )
}

describe('LocalPricingRepository', () => {
  it('crée un seul espace dont la personne est admin, avec une bibliothèque en Ar et TVA 20 %', async () => {
    const repo = makeRepo()
    expect(await repo.listWorkspaces()).toEqual([])
    const ws = await repo.createWorkspace('  Mon entreprise ')
    expect(ws).toEqual({ id: 'id-1', name: 'Mon entreprise', role: 'admin' })
    // Un second appel ne crée pas de second espace.
    expect((await repo.createWorkspace('Autre')).id).toBe('id-1')
    const library = await repo.getLibrary(ws.id)
    expect(library).toMatchObject({ currency: 'MGA', vatRateBp: 2000, version: 1 })
    expect(repo.shared).toBe(false)
  })

  it('garde les prix en bigint et relit à l’identique un prix à une décimale', async () => {
    const repo = makeRepo()
    const ws = await repo.createWorkspace('E')
    const library = await repo.getLibrary(ws.id)
    const saved = await repo.savePriceItem(library.id, {
      ...emptyPriceItem('material', '2026-10-01'),
      designation: 'Ciment synthétique',
      unit: 'Sac',
      priceHt: 304167n,
    })
    const [read] = await repo.listPriceItems(library.id)
    expect(read.priceHt).toBe(304167n)
    expect(typeof read.priceHt).toBe('bigint')
    expect(read.id).toBe(saved.id)
  })

  it('trace chaque ajout, changement de prix et suppression (D23-7)', async () => {
    const repo = makeRepo()
    const ws = await repo.createWorkspace('E')
    const library = await repo.getLibrary(ws.id)
    const fields = { ...emptyPriceItem('labour', '2026-10-01'), designation: 'Maçon', unit: 'J', priceHt: 200000n }
    const item = await repo.savePriceItem(library.id, fields)
    await repo.savePriceItem(library.id, { ...fields, supplier: 'X' }, item.id) // pas de ligne : prix inchangé
    await repo.savePriceItem(library.id, { ...fields, priceHt: 250000n }, item.id)
    await repo.deletePriceItem(item.id)
    const history = await repo.listHistory(item.id)
    expect(history.map((h) => [h.action, h.oldPriceHt, h.newPriceHt])).toEqual([
      ['delete', 250000n, null],
      ['update', 200000n, 250000n],
      ['insert', null, 200000n],
    ])
  })

  it('enregistre un poste avec sa composition', async () => {
    const repo = makeRepo()
    const ws = await repo.createWorkspace('E')
    const library = await repo.getLibrary(ws.id)
    const work: WorkItemFields = {
      code: 'CAT-99-001',
      category: 'Essai',
      designation: 'Poste synthétique',
      unit: 'm²',
      priceHt: 450000n,
      referencePrice: 495000n,
      sourceCoefficient: '1.1',
      output: '1',
      components: [{ group: 'labour', designation: 'Manœuvre', unit: 'H', quantity: '0.5', unitPriceHt: 20000n, amountHt: 10000n }],
      sourceRow: 'SDP!8',
    }
    await repo.saveWorkItem(library.id, work)
    const [read] = await repo.listWorkItems(library.id)
    expect(read.components[0].amountHt).toBe(10000n)
    expect(read.priceHt).toBe(450000n)
  })

  it('change le taux de TVA et le nom de l’espace', async () => {
    const repo = makeRepo()
    const ws = await repo.createWorkspace('E')
    const library = await repo.getLibrary(ws.id)
    await repo.setVatRate(library.id, 1800)
    await repo.renameWorkspace(ws.id, 'F')
    expect((await repo.getLibrary(ws.id)).vatRateBp).toBe(1800)
    expect((await repo.listWorkspaces())[0].name).toBe('F')
  })

  it('recalcule le HT des lignes saisies en TTC quand la TVA change (D23-10)', async () => {
    const repo = makeRepo()
    const ws = await repo.createWorkspace('E')
    const library = await repo.getLibrary(ws.id)
    const base = { ...emptyPriceItem('material', '2026-10-01'), designation: 'Ciment', unit: 'Sac' }
    const ttc = await repo.savePriceItem(library.id, {
      ...base,
      sourceBasis: 'ttc_delivered',
      sourcePrice: 420000n,
      priceHt: 350000n,
    })
    await repo.savePriceItem(library.id, { ...base, priceHt: 100000n })
    await repo.setVatRate(library.id, 0)
    const items = await repo.listPriceItems(library.id)
    expect(items.map((item) => item.priceHt)).toEqual([420000n, 100000n])
    expect((await repo.getLibrary(ws.id)).vatRateBp).toBe(0)
    expect((await repo.listHistory(ttc.id))[0]).toMatchObject({ action: 'update', oldPriceHt: 350000n, newPriceHt: 420000n })
  })

  it('refuse le partage sans compte', async () => {
    const repo = makeRepo()
    await expect(repo.createInvite()).rejects.toThrow()
    expect(await repo.acceptInvite()).toEqual({ status: 'unavailable' })
  })
})
