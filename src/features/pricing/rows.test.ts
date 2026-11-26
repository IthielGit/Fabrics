import { describe, expect, it } from 'vitest'
import { emptyPriceItem } from './model'
import {
  parseAcceptWorkspaceInvite,
  priceItemToRow,
  rowToPriceItem,
  rowToWorkItem,
  rowToWorkspace,
  workItemToRow,
} from './rows'

describe('lignes Supabase de la bibliothèque', () => {
  it('écrit les montants en texte et les relit en bigint', () => {
    const fields = {
      ...emptyPriceItem('material', '2026-10-01'),
      code: ' 1.1 ',
      designation: 'Ciment',
      unit: 'Sac',
      sourceBasis: 'ttc_delivered' as const,
      sourcePrice: 420000n,
      priceHt: 350000n,
    }
    const row = priceItemToRow('lib', fields)
    expect(row.price_ht).toBe('350000')
    expect(row.source_price).toBe('420000')
    expect(row.code).toBe('1.1')
    const back = rowToPriceItem({
      ...row,
      id: 'x',
      price_ht: 350000,
      source_price: '420000',
      updated_by_email: 'a@b',
      updated_at: 't',
    })
    expect(back.priceHt).toBe(350000n)
    expect(back.sourcePrice).toBe(420000n)
    expect(back.sourceBasis).toBe('ttc_delivered')
  })

  it('relit la composition d’un poste', () => {
    const row = workItemToRow('lib', {
      code: 'C',
      category: '',
      designation: 'D',
      unit: 'U',
      priceHt: null,
      referencePrice: null,
      sourceCoefficient: '',
      output: '',
      components: [{ group: 'material', designation: 'M', unit: 'kg', quantity: '2.5', unitPriceHt: 30n, amountHt: 75n }],
      sourceRow: '',
    })
    const back = rowToWorkItem({ ...row, id: 'w', updated_by_email: '', updated_at: '' })
    expect(back.priceHt).toBeNull()
    expect(back.components).toEqual([
      { group: 'material', designation: 'M', unit: 'kg', quantity: '2.5', unitPriceHt: 30n, amountHt: 75n },
    ])
  })

  it('traite un rôle inattendu comme « membre » (lecture seule)', () => {
    expect(rowToWorkspace({ id: '1', name: 'E', role: 'owner' }).role).toBe('member')
  })

  it('lit la réponse d’une invitation', () => {
    expect(parseAcceptWorkspaceInvite({ status: 'ok', workspace_id: 'w', role: 'admin' })).toEqual({
      status: 'ok',
      workspaceId: 'w',
      role: 'admin',
    })
    expect(parseAcceptWorkspaceInvite({ status: 'unavailable' })).toEqual({ status: 'unavailable' })
    expect(parseAcceptWorkspaceInvite(null)).toEqual({ status: 'unavailable' })
  })
})
