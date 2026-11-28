/**
 * « Exporter la bibliothèque » (M24, 24.3, D24-3) : un classeur Excel que « Importer » relit sans perte.
 * Trois feuilles reconnaissables à leur nom (« Fabrics - … ») : informations, lignes de prix, postes.
 * Montants écrits en texte décimal exact (dixièmes d'Ariary), jamais en nombre flottant ; sous-détail
 * et colonnes d'information en JSON dans leur cellule.
 */
import { buildMetresXlsx } from '../export/metresXlsx'
import type { MetresTable } from '../measurements/tables'
import { ImportReportBuilder } from './importReport'
import type { ImportedLibrary } from './importWorkbook'
import type { ComponentGroup, PriceItemFields, PriceKind, PriceLibrary, SourceBasis, WorkComponent, WorkItemFields } from './model'
import { parseDecimal, type Tenths } from './money'
import { cellText, type Sheet, type Workbook } from './xlsxRead'

export const LIBRARY_SHEETS = { info: 'Fabrics - Informations', prices: 'Fabrics - Prix', works: 'Fabrics - Postes' } as const
const FORMAT = 'fabrics-library'
const FORMAT_VERSION = '1'

const PRICE_COLUMNS = [
  'Type', 'Code', 'Catégorie', 'Désignation', 'Unité', 'Base', 'Prix source (Ar)', 'Sans TVA', 'Prix HT (Ar)',
  'Fournisseur', 'Région', 'Date d’effet', 'Détails', 'Origine', 'Clé',
] as const
const WORK_COLUMNS = [
  'Code', 'Catégorie', 'Désignation', 'Unité', 'Prix brut HT (Ar)', 'Prix de référence (Ar)', 'Coefficient', 'Rendement',
  'Sous-détail', 'Origine', 'Clé',
] as const

/** Dixièmes → « 38181,8 » (exact, sans séparateur de milliers) ; `null` → cellule vide. */
function tenthsCell(value: Tenths | null): string {
  if (value === null) return ''
  const sign = value < 0n ? '-' : ''
  const abs = value < 0n ? -value : value
  return `${sign}${abs / 10n},${abs % 10n}`
}

const tenthsOf = (text: string): Tenths | null => (text.trim() === '' ? null : parseDecimal(text.replace(',', '.'), 1))

const left = (header: string) => ({ header, align: 'left' as const })

export function buildLibraryWorkbook(library: PriceLibrary, priceItems: readonly PriceItemFields[], workItems: readonly WorkItemFields[]): Uint8Array {
  const info: MetresTable = {
    id: 'info',
    title: LIBRARY_SHEETS.info,
    columns: [left('Clé'), left('Valeur')],
    rows: [
      ['Format', FORMAT],
      ['Version', FORMAT_VERSION],
      ['Bibliothèque', library.name],
      ['Date des prix', library.priceDate ?? ''],
      ['TVA (points de base)', String(library.vatRateBp)],
      ['Devise', library.currency],
    ],
  }
  const prices: MetresTable = {
    id: 'prices',
    title: LIBRARY_SHEETS.prices,
    columns: PRICE_COLUMNS.map(left),
    rows: priceItems.map((p) => [
      p.kind, p.code, p.category, p.designation, p.unit, p.sourceBasis, tenthsCell(p.sourcePrice), p.vatExempt ? 'oui' : 'non',
      tenthsCell(p.priceHt), p.supplier, p.region, p.effectiveDate ?? '', JSON.stringify(p.details), p.sourceRow, p.sourceKey,
    ]),
  }
  const works: MetresTable = {
    id: 'works',
    title: LIBRARY_SHEETS.works,
    columns: WORK_COLUMNS.map(left),
    rows: workItems.map((w) => [
      w.code, w.category, w.designation, w.unit, tenthsCell(w.priceHt), tenthsCell(w.referencePrice), w.sourceCoefficient, w.output,
      JSON.stringify(w.components.map((c) => ({ ...c, unitPriceHt: c.unitPriceHt.toString(), amountHt: c.amountHt.toString() }))),
      w.sourceRow, w.sourceKey,
    ]),
  }
  return buildMetresXlsx([info, prices, works], undefined, new Date().toISOString())
}

/** Ligne d'en-tête d'une feuille exportée (sa première cellule vaut `first`) et colonnes par en-tête. */
function headerOf(sheet: Sheet, first: string): { row: number; col: Map<string, number> } | null {
  for (let row = 1; row <= Math.min(10, sheet.maxRow); row++) {
    if (cellText(sheet, row, 1) !== first) continue
    const col = new Map<string, number>()
    for (const [c] of sheet.cells.get(row) ?? []) col.set(cellText(sheet, row, c), c)
    return { row, col }
  }
  return null
}

function parseJson<T>(text: string, fallback: T): T {
  try {
    return text.trim() ? (JSON.parse(text) as T) : fallback
  } catch {
    return fallback
  }
}

const KINDS: readonly PriceKind[] = ['material', 'equipment', 'labour']
const BASES: readonly SourceBasis[] = ['ht', 'ttc_delivered']
const GROUPS: readonly ComponentGroup[] = ['equipment', 'material', 'labour', 'other']

/** Classeur exporté par Fabrics ? Alors sa lecture exacte ; sinon `null` (classeur « Expert BTP »). */
export function importLibraryWorkbook(workbook: Workbook): ImportedLibrary | null {
  const sheet = (name: string) => workbook.sheets.find((s) => s.name === name)
  const infoSheet = sheet(LIBRARY_SHEETS.info)
  if (!infoSheet) return null
  const info = headerOf(infoSheet, 'Clé')
  if (!info) return null
  const values = new Map<string, string>()
  for (let row = info.row + 1; row <= infoSheet.maxRow; row++) values.set(cellText(infoSheet, row, 1), cellText(infoSheet, row, 2))
  if (values.get('Format') !== FORMAT) return null

  const report = new ImportReportBuilder()
  const priceItems: PriceItemFields[] = []
  const pricesSheet = sheet(LIBRARY_SHEETS.prices)
  const ph = pricesSheet && headerOf(pricesSheet, PRICE_COLUMNS[0])
  if (pricesSheet && ph) {
    const get = (row: number, header: (typeof PRICE_COLUMNS)[number]) => cellText(pricesSheet, row, ph.col.get(header) ?? 0)
    for (let row = ph.row + 1; row <= pricesSheet.maxRow; row++) {
      const kind = get(row, 'Type') as PriceKind
      const designation = get(row, 'Désignation')
      if (!designation) continue
      if (!KINDS.includes(kind)) {
        report.add('notXlsx', pricesSheet.name, row, designation)
        continue
      }
      const basis = get(row, 'Base') as SourceBasis
      priceItems.push({
        kind,
        code: get(row, 'Code'),
        category: get(row, 'Catégorie'),
        designation,
        unit: get(row, 'Unité'),
        sourceBasis: BASES.includes(basis) ? basis : 'ht',
        sourcePrice: tenthsOf(get(row, 'Prix source (Ar)')),
        vatExempt: get(row, 'Sans TVA') === 'oui',
        priceHt: tenthsOf(get(row, 'Prix HT (Ar)')),
        supplier: get(row, 'Fournisseur'),
        region: get(row, 'Région'),
        effectiveDate: get(row, 'Date d’effet') || null,
        details: parseJson<Record<string, string>>(get(row, 'Détails'), {}),
        sourceRow: get(row, 'Origine'),
        sourceKey: get(row, 'Clé'),
      })
    }
  }

  const workItems: WorkItemFields[] = []
  const worksSheet = sheet(LIBRARY_SHEETS.works)
  const wh = worksSheet && headerOf(worksSheet, WORK_COLUMNS[0])
  if (worksSheet && wh) {
    const get = (row: number, header: (typeof WORK_COLUMNS)[number]) => cellText(worksSheet, row, wh.col.get(header) ?? 0)
    for (let row = wh.row + 1; row <= worksSheet.maxRow; row++) {
      const designation = get(row, 'Désignation')
      if (!designation) continue
      const raw = parseJson<(Omit<WorkComponent, 'unitPriceHt' | 'amountHt'> & { unitPriceHt: string; amountHt: string })[]>(get(row, 'Sous-détail'), [])
      const components: WorkComponent[] = raw
        .filter((c) => GROUPS.includes(c.group) && /^-?\d+$/.test(c.unitPriceHt) && /^-?\d+$/.test(c.amountHt))
        .map((c) => ({ ...c, unitPriceHt: BigInt(c.unitPriceHt), amountHt: BigInt(c.amountHt) }))
      workItems.push({
        code: get(row, 'Code'),
        category: get(row, 'Catégorie'),
        designation,
        unit: get(row, 'Unité'),
        priceHt: tenthsOf(get(row, 'Prix brut HT (Ar)')),
        referencePrice: tenthsOf(get(row, 'Prix de référence (Ar)')),
        sourceCoefficient: get(row, 'Coefficient'),
        output: get(row, 'Rendement'),
        components,
        sourceRow: get(row, 'Origine'),
        sourceKey: get(row, 'Clé'),
      })
    }
  }
  return { priceItems, workItems, priceDate: values.get('Date des prix') || null, issues: report.list() }
}
