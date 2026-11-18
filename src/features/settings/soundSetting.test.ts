import { describe, expect, it } from 'vitest'
import { readSoundsEnabled, writeSoundsEnabled } from './soundSetting'

function memoryStore() {
  const data = new Map<string, string>()
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) }
}

describe('soundSetting', () => {
  it('est activé par défaut', () => {
    expect(readSoundsEnabled(memoryStore())).toBe(true)
    expect(readSoundsEnabled(null)).toBe(true)
  })
  it('mémorise la coupure puis la réactivation', () => {
    const store = memoryStore()
    writeSoundsEnabled(false, store)
    expect(readSoundsEnabled(store)).toBe(false)
    writeSoundsEnabled(true, store)
    expect(readSoundsEnabled(store)).toBe(true)
  })
  it('ne plante pas si le stockage refuse', () => {
    const broken = {
      getItem: () => {
        throw new Error('refusé')
      },
      setItem: () => {
        throw new Error('refusé')
      },
    }
    expect(readSoundsEnabled(broken)).toBe(true)
    expect(() => writeSoundsEnabled(false, broken)).not.toThrow()
  })
})
