import { describe, expect, it, vi } from 'vitest'

vi.mock('idb-keyval', () => ({ get: vi.fn(), set: vi.fn(), del: vi.fn() }))
const { isRescueNewer, saveErrorReason } = await import('./rescue')

describe('copie de secours (D24-8)', () => {
  it('le bandeau ne s’affiche que si la copie de l’appareil est plus récente', () => {
    const opened = { updatedAt: '2026-11-28T10:00:00.000Z' }
    expect(isRescueNewer(null, opened)).toBe(false)
    expect(isRescueNewer({ updatedAt: '2026-11-28T09:59:59.000Z' }, opened)).toBe(false)
    expect(isRescueNewer({ updatedAt: '2026-11-28T10:00:00.000Z' }, opened)).toBe(false)
    expect(isRescueNewer({ updatedAt: '2026-11-28T10:00:01.000Z' }, opened)).toBe(true)
  })

  it('raison lisible du refus : droits, données refusées, autre', () => {
    expect(saveErrorReason({ code: '42501', message: 'new row violates row-level security policy' })).toBe('forbidden')
    expect(saveErrorReason({ status: 403 })).toBe('forbidden')
    expect(saveErrorReason({ code: '23514', message: 'check constraint' })).toBe('rejected')
    expect(saveErrorReason({ status: 413 })).toBe('rejected')
    expect(saveErrorReason(new Error('disque plein'))).toBe('other')
    expect(saveErrorReason(null)).toBe('other')
  })
})
