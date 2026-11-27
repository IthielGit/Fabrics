/**
 * Gate G6 (M23, 23.8) : les critères d'acceptation de `docs/03-ROADMAP.md`, réunis ici. Le plan passe
 * par la scène Pascal, comme un vrai projet ; les prix viennent d'une bibliothèque (jamais inventés).
 *
 * 1. 13,11 m² × 45 000,0 Ar/m² (prix d'exemple) = 589 950 Ar → 590 000 Ar HT.
 * 2. Même révision + même bordereau = même DQE.
 * 3. Un poste sans prix empêche de marquer le devis comme définitif.
 * 4. Totaux identiques à l'écran, en XLSX et en PDF ; chaque poste affiche sa source et son unité.
 */
import { unzipSync, unzlibSync, strFromU8 } from 'fflate'
import { describe, expect, it } from 'vitest'
import type { CanvasElement, Level } from '../../types/document'
import { buildMetresPdf } from '../export/metresPdf'
import { buildMetresXlsx } from '../export/metresXlsx'
import { sheetSize } from '../export/pdfLayout'
import { planDocument } from '../scene/migrate/fixtureDocuments'
import { fabricsToScene } from '../scene/migrate/fromFabrics'
import { settleScene } from '../scene/settle'
import { sceneToFabricsView } from '../scene/view/toFabricsView'
import { canFinalize, EstimateNotFinalError, fingerprintSource, freezeEstimate } from './estimateVersions'
import { buildEstimateTables, type EstimateTableLabels } from './estimateTables'
import { LocalPricingRepository, memoryPricingStorage } from './LocalPricingRepository'
import type { WorkItem } from './model'
import { formatAriary } from './money'
import { projectEstimate } from './projectEstimate'
import { EMPTY_FILTER, type PricingRule } from './rules'

const BASE = { rotation: 0, opacity: 1, locked: false, hidden: false, x: 0, y: 0 }
const L = 'L0'
const levels: Level[] = [{ id: L, name: 'RDC', elevation: 0, height: 3000, slabThickness: 200 }]

/** Mur de 4 370 mm × 3 000 mm sans ouverture : 13,11 m² de surface nette (une face). */
const wall: CanvasElement = { ...BASE, id: 'w', levelId: L, type: 'wall', name: 'M', points: [0, 0, 4370, 0], thickness: 200, height: 3000, fill: '#ccc', material: 'brick' }
const door: CanvasElement = { ...BASE, id: 'p', levelId: L, type: 'opening', name: 'P', kind: 'door', wallId: 'w', segmentIndex: 0, offset: 1000, width: 900, height: 2100, sillHeight: 0, hinge: 'start', side: 'left' }

function work(id: string, unit: string, priceHt: bigint | null): WorkItem {
  return { id, libraryId: 'lib', code: id, category: 'Gros œuvre', designation: `Poste ${id}`, unit, priceHt, referencePrice: null, sourceCoefficient: '', output: '', components: [], sourceRow: '', sourceKey: '', updatedByEmail: '', updatedAt: '' }
}

function rule(id: string, patch: Partial<PricingRule>): PricingRule {
  return { id, libraryId: 'lib', name: id, quantityCode: 'wall.netArea', filter: EMPTY_FILTER, workItemId: null, wasteBp: 0, enabled: true, position: 0, updatedByEmail: '', updatedAt: '', ...patch }
}

function viaScene(elements: CanvasElement[]) {
  const scene = settleScene(fabricsToScene(planDocument(levels, elements)).scene)
  return { scene, document: sceneToFabricsView(scene) }
}

const NO_K1 = { a1Bp: 0, a2Bp: 0, a3Bp: 0, vatRateBp: 2000 }
const LABELS: EstimateTableLabels = {
  summaryTitle: 'Synthèse', totalsTitle: 'Totaux', amountAny: 'Montant', detailTitle: 'Détail', breakdownTitle: 'Décomposition',
  assumptionsTitle: 'Hypothèses', lot: 'Lot', code: 'Code', designation: 'Désignation', unit: 'Unité', quantity: 'Quantité',
  salePrice: 'PU HT', amount: 'Montant HT', label: 'Libellé', value: 'Valeur', totalHt: 'Total HT', vat: (r) => `TVA ${r}`,
  totalTtc: 'Total TTC', debours: 'Débours', overheadMargin: 'Frais et marge', noPrice: 'sans prix', provisional: 'provisoire',
  assumptions: [], detailNote: '',
}

function pdfStreams(bytes: Uint8Array): string {
  const raw = new TextDecoder('latin1').decode(bytes)
  let out = ''
  for (const match of raw.matchAll(/stream\r?\n/g)) {
    const start = match.index + match[0].length
    try {
      out += new TextDecoder('latin1').decode(unzlibSync(bytes.subarray(start, raw.indexOf('endstream', start))))
    } catch {
      // flux non compressé
    }
  }
  return out
}

describe('Gate G6 (M23)', () => {
  const { scene, document } = viaScene([wall])
  const masonry = rule('mac', { filter: { ...EMPTY_FILTER, wallMaterial: 'brick' }, workItemId: 'MAC' })
  const input = { document, scene, workItems: [work('MAC', 'm²', 450000n)], rules: [masonry], settings: NO_K1 }

  it('1. 13,11 m² × 45 000,0 Ar/m² = 589 950 Ar → 590 000 Ar HT', () => {
    const { estimate } = projectEstimate(input)
    const line = estimate.lots[0].lines[0]
    expect([line.quantity, line.quantityDecimals, line.unit]).toEqual([1311n, 2, 'm²'])
    expect(line.amountHt).toBe(5900000n)
    expect([estimate.totalHt, estimate.vat, estimate.totalTtc]).toEqual([5900000n, 1180000n, 7080000n])
  })

  it('2. même révision + même bordereau = même DQE et même empreinte', () => {
    const a = projectEstimate(input)
    const b = projectEstimate({ ...input, ...viaScene([wall]) })
    expect(freezeEstimate(b.estimate)).toEqual(freezeEstimate(a.estimate))
    const print = (r: typeof a) => fingerprintSource({ quantities: r.quantities, workItems: input.workItems, rules: input.rules, overrides: [], settings: NO_K1 })
    expect(print(b)).toBe(print(a))
    // Un prix change : l'empreinte change aussi.
    const changed = fingerprintSource({ quantities: a.quantities, workItems: [work('MAC', 'm²', 450001n)], rules: input.rules, overrides: [], settings: NO_K1 })
    expect(changed).not.toBe(print(a))
  })

  it('3. un poste sans prix empêche de marquer le devis comme définitif', async () => {
    const withDoor = viaScene([wall, door])
    const { estimate } = projectEstimate({
      ...input,
      ...withDoor,
      workItems: [work('MAC', 'm²', 450000n), work('PORTE', 'U', null)],
      rules: [masonry, rule('porte', { quantityCode: 'opening.count', workItemId: 'PORTE', position: 1 })],
    })
    expect(estimate.linesWithoutPrice).toBe(1)
    const snapshot = freezeEstimate(estimate)
    expect(canFinalize(snapshot)).toBe(false)
    const repo = new LocalPricingRepository(memoryPricingStorage())
    const ws = await repo.createWorkspace('E')
    const library = await repo.getLibrary(ws.id)
    const record = await repo.saveProjectEstimate(library.id, 'p', { ...NO_K1, overrides: [] })
    await expect(repo.freezeEstimateVersion(record.id, { status: 'final', libraryVersion: 1, fingerprint: 'f', snapshot, note: '' })).rejects.toBeInstanceOf(EstimateNotFinalError)
    // En brouillon, c'est permis.
    expect((await repo.freezeEstimateVersion(record.id, { status: 'draft', libraryVersion: 1, fingerprint: 'f', snapshot, note: '' })).status).toBe('draft')
  })

  it('4. totaux identiques à l’écran, en XLSX et en PDF ; chaque poste affiche sa source et son unité', async () => {
    const { estimate } = projectEstimate({ ...input, settings: { a1Bp: 500, a2Bp: 500, a3Bp: 0, vatRateBp: 2000 } })
    const screen = [estimate.totalHt, estimate.vat, estimate.totalTtc]
    const tables = buildEstimateTables(estimate, LABELS)
    // XLSX : valeurs gardées dans les cellules du tableau des totaux.
    const files = unzipSync(buildMetresXlsx(tables, undefined, '2026-11-27T00:00:00Z'))
    const totalsSheet = strFromU8(files['xl/worksheets/sheet2.xml'])
    const xlsxValues = [...totalsSheet.matchAll(/<c r="B\d+"[^>]*><v>([^<]+)<\/v>/g)].map((m) => BigInt(m[1]) * 10n)
    expect(xlsxValues).toEqual(screen)
    // PDF : chaque total écrit en entier.
    const blob = await buildMetresPdf(tables, sheetSize('a4', 'portrait'), {
      title: 'Devis', units: '', note: '', continued: 'suite',
      cartouche: { projectName: 'P', subtitle: 'S', dateLabel: 'Date', date: '27/11/2026', sheetLabel: 'Feuille', sheet: 'A4', pageLabel: 'Page' },
    })
    const text = pdfStreams(new Uint8Array(await blob.arrayBuffer()))
    const SPACE = String.raw`(?:\s|\xa0|\\240)`
    for (const value of screen) {
      expect(text).toMatch(new RegExp(formatAriary(value, { decimals: 0, unit: false }).replace(/ /g, SPACE)))
    }
    // Source et unité de chaque poste.
    const line = estimate.lots[0].lines[0]
    expect(line.unit).toBe('m²')
    expect(line.sources).toEqual([expect.objectContaining({ quantityKey: 'takeoff:wall.netArea:w', elementIds: ['w'], ruleId: 'mac' })])
  })
})
