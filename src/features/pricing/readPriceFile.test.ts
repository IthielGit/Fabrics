import { describe, expect, it } from 'vitest'
import { readPriceFile, sha256Hex } from './readPriceFile'
import { buildXlsx, syntheticWorkbook } from './testing/xlsxFixture'

describe('readPriceFile', () => {
  it('lit un classeur et un CSV', () => {
    expect(readPriceFile('prix.xlsx', buildXlsx(syntheticWorkbook()), 2000).workItems).toHaveLength(3)
    const csv = new TextEncoder().encode('type;désignation;unité;prix\nmatériau;Liant;Sac;100')
    expect(readPriceFile('prix.csv', csv, 2000).priceItems).toHaveLength(1)
  })

  it('un fichier illisible donne un message bloquant, sans exception', () => {
    const result = readPriceFile('prix.xlsx', new TextEncoder().encode('pas un classeur'), 2000)
    expect(result.issues).toEqual([{ code: 'notXlsx', level: 'blocking', count: 1, examples: [{ sheet: '', row: 0, detail: 'prix.xlsx' }] }])
  })

  it('calcule l’empreinte SHA-256', async () => {
    expect(await sha256Hex(new TextEncoder().encode('abc'))).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })
})
