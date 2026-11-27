import { strFromU8, unzipSync, unzlibSync } from 'fflate'
import { describe, expect, it } from 'vitest'
import { buildMetresPdf } from '../export/metresPdf'
import { buildMetresXlsx } from '../export/metresXlsx'
import { sheetSize } from '../export/pdfLayout'
import { cellText } from '../measurements/tables'
import { computeEstimate } from './estimate'
import { buildEstimateTables, type EstimateTableLabels } from './estimateTables'
import type { WorkItem } from './model'
import { formatAriary } from './money'
import type { MatchedLine } from './rules'

const LABELS: EstimateTableLabels = {
  summaryTitle: 'Synthèse',
  totalsTitle: 'Totaux',
  amountAny: 'Montant',
  detailTitle: 'Détail',
  breakdownTitle: 'Décomposition',
  assumptionsTitle: 'Hypothèses',
  lot: 'Lot',
  code: 'Code',
  designation: 'Désignation',
  unit: 'Unité',
  quantity: 'Quantité',
  salePrice: 'PU HT',
  amount: 'Montant HT',
  label: 'Libellé',
  value: 'Valeur',
  totalHt: 'Total HT',
  vat: (rate) => `TVA ${rate}`,
  totalTtc: 'Total TTC',
  debours: 'Débours sec',
  overheadMargin: 'Frais et marge',
  noPrice: 'sans prix',
  provisional: 'provisoire',
  assumptions: [['Arrondis', 'centaine supérieure']],
  detailNote: '',
}

function work(id: string, unit: string, priceHt: bigint | null, category: string): WorkItem {
  return { id, libraryId: 'l', code: id, category, designation: `Poste ${id}`, unit, priceHt, referencePrice: null, sourceCoefficient: '', output: '', components: [], sourceRow: '', sourceKey: '', updatedByEmail: '', updatedAt: '' }
}

function line(workItemId: string, value: number, dimension: MatchedLine['dimension'] = 'area'): MatchedLine {
  return { workItemId, quantityKey: `k:${workItemId}`, code: 'wall.netArea', dimension, value, elementIds: ['w'], partId: null, levelId: null, status: 'validated', ruleId: 'r', overrideId: null, wasteBp: 0 }
}

const estimate = computeEstimate({
  lines: [line('A', 13_110_000), line('B', 3, 'count'), line('C', 1_000_000)],
  workItems: new Map([
    ['A', work('A', 'm²', 450000n, 'Maçonnerie')],
    ['B', work('B', 'U', 1234567n, 'Menuiserie')],
    ['C', work('C', 'm²', null, 'Menuiserie')],
  ]),
  settings: { a1Bp: 500, a2Bp: 500, a3Bp: 0, vatRateBp: 2000 },
})

describe('tableaux du DQE', () => {
  const tables = buildEstimateTables(estimate, LABELS)
  const [summary, totals, detail, breakdown] = tables

  it('reprend les montants du calcul sans les recalculer (gate G6)', () => {
    expect(cellText(summary.total![1])).toBe('1 058 900') // = estimate.totalHt
    expect(estimate.totalHt).toBe(10589000n)
    expect(totals.rows.map((r) => cellText(r[1]))).toEqual(['1 058 900', '211 800', '1 270 700'])
    expect(cellText(detail.total![6])).toBe('1 058 900')
    expect(cellText(breakdown.total![1])).toBe('1 058 900')
  })

  it('détail : quantité dans l’unité du poste, prix de vente, « sans prix »', () => {
    expect(detail.rows.map((r) => r.map(cellText))).toEqual([
      ['Maçonnerie', 'A', 'Poste A', 'm²', '13,11', '49 612,5', '650 500'],
      ['Menuiserie', 'B', 'Poste B', 'U', '3', '136 111,0', '408 400'],
      ['Menuiserie', 'C', 'Poste C', 'm²', '1,00', 'sans prix', 'sans prix'],
    ])
  })

  it('le classeur XLSX garde les mêmes totaux et des formats en Ariary', () => {
    const files = unzipSync(buildMetresXlsx(tables, undefined, '2026-11-27T00:00:00Z'))
    const styles = strFromU8(files['xl/styles.xml'])
    expect(styles).toContain('formatCode="#,##0"')
    const sheet = strFromU8(files['xl/worksheets/sheet3.xml'])
    // Somme de la colonne des montants ; valeur gardée = total exact du calcul.
    expect(sheet).toMatch(/<f>SUM\(G\d+:G\d+\)<\/f><v>1058900<\/v>/)
  })
})

/** Texte des flux d'un PDF compressé (jsPDF, FlateDecode), en latin1. */
function pdfText(bytes: Uint8Array): string {
  const raw = new TextDecoder('latin1').decode(bytes)
  let out = ''
  for (const match of raw.matchAll(/stream\r?\n/g)) {
    const start = match.index + match[0].length
    const end = raw.indexOf('endstream', start)
    try {
      out += new TextDecoder('latin1').decode(unzlibSync(bytes.subarray(start, end)))
    } catch {
      // Flux non compressé : ignoré.
    }
  }
  return out
}

describe('PDF du DQE', () => {
  it('écrit chaque total en entier, jamais tronqué (gate G6)', async () => {
    const big = computeEstimate({
      lines: [line('A', 243_680_000)],
      workItems: new Map([['A', { ...work('A', 'm²', 365_176n * 10n, 'Maçonnerie / Enduits'), designation: 'Maçonnerie en briques d’épaisseur 22 cm hourdées au mortier de terre, très longue désignation de poste' }]]),
      settings: { a1Bp: 500, a2Bp: 500, a3Bp: 0, vatRateBp: 2000 },
    })
    const tables = buildEstimateTables(big, LABELS)
    const blob = await buildMetresPdf(tables, sheetSize('a4', 'portrait'), {
      title: 'Devis',
      units: '',
      note: '',
      continued: 'suite',
      cartouche: { projectName: 'P', subtitle: 'S', dateLabel: 'Date', date: '27/11/2026', sheetLabel: 'Feuille', sheet: 'A4', pageLabel: 'Page' },
    })
    const text = pdfText(new Uint8Array(await blob.arrayBuffer()))
    // Espace ins\u00e9cable \u00e9crite telle quelle, en octal (\240) ou en espace simple selon la police.
    const SPACE = String.raw`(?:\s|\xa0|\\240)`
    const total = formatAriary(big.totalHt, { decimals: 0, unit: false }).replace(/\u00a0/g, SPACE)
    // Synthèse, totaux, détail, décomposition : le total HT y figure quatre fois, en entier.
    expect((text.match(new RegExp(total, 'g')) ?? []).length).toBeGreaterThanOrEqual(4)
    const price = formatAriary(big.lots[0].lines[0].salePriceHt!, { unit: false }).replace(/\u00a0/g, SPACE)
    expect(text).toMatch(new RegExp(price))
  })
})
