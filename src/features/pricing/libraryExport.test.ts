import { describe, expect, it } from 'vitest'
import { buildLibraryWorkbook } from './libraryExport'
import type { PriceItemFields, PriceLibrary, WorkItemFields } from './model'
import { readPriceFile } from './readPriceFile'

const library: PriceLibrary = { id: 'lib', workspaceId: 'ws', name: 'Entreprise', version: 3, currency: 'MGA', vatRateBp: 2000, priceDate: '2026-10-01', updatedAt: '' }

const prices: PriceItemFields[] = [
  { kind: 'material', code: '1.1', category: 'Liants', designation: 'Ciment CEM II « 42,5 »', unit: 'Sac', sourceBasis: 'ttc_delivered', sourcePrice: 420000n, vatExempt: false, priceHt: 350000n, supplier: 'Holcim', region: 'Analamanga', effectiveDate: '2026-10-01', details: { 'Location / jour': '1 000,0 Ar' }, sourceRow: 'MTX!12', sourceKey: 'MTX:1.1' },
  { kind: 'labour', code: '', category: '', designation: 'Maçon\nqualifié', unit: 'j', sourceBasis: 'ht', sourcePrice: null, vatExempt: true, priceHt: null, supplier: '', region: '', effectiveDate: null, details: {}, sourceRow: '', sourceKey: '' },
  { kind: 'equipment', code: 'E1', category: 'Engins', designation: '=HYPERLINK("x")', unit: 'h', sourceBasis: 'ht', sourcePrice: null, vatExempt: false, priceHt: 123456789n, supplier: '', region: '', effectiveDate: null, details: {}, sourceRow: '', sourceKey: 'MTL:E1' },
]
const works: WorkItemFields[] = [
  { code: 'CAT-05-001', category: 'Maçonnerie', designation: 'Mur en brique', unit: 'm²', priceHt: 402620n, referencePrice: 442882n, sourceCoefficient: '1.1', output: '8 m²/j', components: [{ group: 'material', designation: 'Brique', unit: 'U', quantity: '55.5', unitPriceHt: 3000n, amountHt: 166500n }], sourceRow: 'SDP!40', sourceKey: 'TRAV:CAT-05-001' },
  { code: 'X', category: '', designation: 'Poste sans prix', unit: 'FFT', priceHt: null, referencePrice: null, sourceCoefficient: '', output: '', components: [], sourceRow: '', sourceKey: '' },
]

describe('« Exporter la bibliothèque » (M24, 24.3)', () => {
  it('aller-retour sans perte : « Importer » relit exactement chaque ligne et chaque poste', () => {
    const bytes = buildLibraryWorkbook(library, prices, works)
    const read = readPriceFile('bibliotheque.xlsx', bytes, 2000)
    expect(read.issues).toEqual([])
    expect(read.priceDate).toBe('2026-10-01')
    expect(read.priceItems).toEqual(prices)
    expect(read.workItems).toEqual(works)
  })
})
