import { describe, expect, it } from 'vitest'
import type { ImportIssueCode } from './importReport'
import { importWorkbook } from './importWorkbook'
import { buildXlsx, syntheticWorkbook } from './testing/xlsxFixture'
import { readXlsx, XlsxError } from './xlsxRead'

function run() {
  return importWorkbook(readXlsx(buildXlsx(syntheticWorkbook())), 2000)
}

function issue(result: ReturnType<typeof run>, code: ImportIssueCode) {
  return result.issues.find((i) => i.code === code)
}

describe('importWorkbook (classeur synthétique)', () => {
  it('lit la date des prix', () => {
    expect(run().priceDate).toBe('2026-10-01')
  })

  it('matériaux : TTC livré gardé, HT = TTC ÷ 1,20, sans TVA quand le HT du classeur égale le TTC', () => {
    const materials = run().priceItems.filter((i) => i.kind === 'material')
    expect(materials.map((m) => [m.code, m.unit, m.sourcePrice, m.priceHt, m.vatExempt])).toEqual([
      ['1.1', 'Sac', 12000n, 10000n, false],
      ['1.2', 'm³', 5000n, 5000n, true],
      ['1.3', 'U', null, null, false],
      ['1.4', 'kg', 365000n, 304167n, false],
    ])
    expect(materials[0].designation).toBe('Liant synthétique\nsac A')
    expect(materials[0].sourceKey).toBe('MTX:1.1')
    expect(materials[0].sourceRow).toBe('MTX!6')
    expect(materials[0].effectiveDate).toBe('2026-10-01')
  })

  it('matériel : location par jour, sinon prix HT avec son unité (D23-18), second tableau compris', () => {
    const equipment = run().priceItems.filter((i) => i.kind === 'equipment')
    expect(equipment.map((e) => [e.designation, e.unit, e.priceHt])).toEqual([
      ['Engin synthétique', 'J', 90000n],
      ['Casque synthétique', 'U', 25000n],
      ['Pelle synthétique', 'J', 1000n],
    ])
    expect(equipment[0].details).toMatchObject({ "Prix d'achat HT": '900 000,0 Ar', "Unité d'achat": 'U' })
  })

  it('main-d’œuvre : prix par jour, dans les deux tableaux de la feuille', () => {
    const labour = run().priceItems.filter((i) => i.kind === 'labour')
    expect(labour.map((l) => [l.designation, l.unit, l.priceHt])).toEqual([
      ['Chef synthétique', 'J', 200000n],
      ['Aide synthétique', 'J', 163462n],
    ])
  })

  it('postes : prix brut = débours sec du sous-détail (D23-12), composition gardée', () => {
    const works = run().workItems
    expect(works.map((w) => [w.code, w.unit, w.priceHt, w.referencePrice])).toEqual([
      ['CAT-01-001', 'm²', 33626n, 37000n],
      ['CAT-01-002', 'ml', 10000n, 11000n],
      ['CAT-01-003', 'U', null, 5000n],
    ])
    const a = works[0]
    expect(a.sourceCoefficient).toBe('1.1')
    expect(a.components.map((c) => [c.group, c.designation, c.quantity, c.amountHt])).toEqual([
      ['equipment', 'Outil synthétique', '1', 10000n],
      ['material', 'Granulat synthétique', '0.5', 10000n],
      ['labour', 'Aide synthétique', '2', 13626n],
    ])
    expect(a.sourceKey).toBe('TRAV:CAT-01-001')
  })

  it('signale chaque correction et chaque manque, sans rien bloquer', () => {
    const result = run()
    expect(result.issues.filter((i) => i.level === 'blocking')).toEqual([])
    expect(issue(result, 'linkFixed')?.examples[0].detail).toBe('🔗 VOIR_SPD_002 → SDP-002')
    expect(issue(result, 'workWithoutDetail')?.count).toBe(1)
    expect(issue(result, 'detailWithoutWork')?.examples[0].detail).toBe('SDP-003')
    expect(issue(result, 'zeroPrice')?.count).toBe(1)
    expect(issue(result, 'vatExemptDetected')?.count).toBe(1)
    expect(issue(result, 'purchasePriceUsed')?.count).toBe(1)
    expect(issue(result, 'unitNormalized')?.count).toBeGreaterThan(0)
    expect(issue(result, 'emptyComponentsSkipped')?.count).toBe(1)
    expect(issue(result, 'unitPriceWithoutCoefficient')?.examples[0].detail).toBe('SDP-002')
    expect(issue(result, 'decimalsRounded')?.count).toBeGreaterThan(0)
    expect(issue(result, 'spacesTrimmed')?.count).toBeGreaterThan(0)
  })

  it('refuse un fichier qui n’est pas un classeur', () => {
    expect(() => readXlsx(new TextEncoder().encode('code;prix\n'))).toThrow(XlsxError)
  })

  it('bloque un classeur sans aucune feuille connue', () => {
    const result = importWorkbook(readXlsx(buildXlsx([{ name: 'Feuil1', rows: [['x']] }])), 2000)
    expect(result.issues[0]).toMatchObject({ code: 'noKnownSheet', level: 'blocking' })
  })

  it('bloque une autre monnaie que l’Ariary', () => {
    const sheets = syntheticWorkbook()
    sheets[0].rows[3][9] = 'PRIX TTC LIVRE SUR CHANTIER (€)'
    const result = importWorkbook(readXlsx(buildXlsx(sheets)), 2000)
    expect(result.issues.some((i) => i.code === 'currencyMismatch' && i.level === 'blocking')).toBe(true)
  })

  it('rend uniques les clés en double et le signale', () => {
    const sheets = syntheticWorkbook()
    sheets[2].rows.push([null, 'Chef synthétique', 1, 1, 1, 1])
    const result = importWorkbook(readXlsx(buildXlsx(sheets)), 2000)
    expect(result.priceItems.filter((i) => i.kind === 'labour').map((l) => l.sourceKey)).toEqual([
      'MO:chef synthetique',
      'MO:aide synthetique',
      'MO:chef synthetique~2',
    ])
    expect(result.issues.find((i) => i.code === 'duplicateKey')?.count).toBe(1)
  })
})
