/**
 * Import d'un fichier CSV de prix (M23, 23.2), pour une liste tenue dans un autre tableur.
 *
 * Colonnes reconnues (première ligne, ordre libre, accents et majuscules indifférents) :
 *   type (matériau | matériel | main-d'œuvre | poste), code, catégorie, désignation, unité, prix,
 *   base (HT | TTC), sans TVA (oui | non), fournisseur, région, date (AAAA-MM-JJ ou JJ/MM/AAAA), devise.
 * Obligatoires : type, désignation, unité, prix. Séparateur : « ; », « , » ou tabulation.
 * Une devise autre que l'Ariary bloque tout le fichier ; une ligne invalide est écartée et signalée.
 */
import { ImportReportBuilder } from './importReport'
import type { ImportedLibrary } from './importWorkbook'
import { DEFAULT_REGION, priceHtFromSource, type PriceItemFields, type PriceKind, type WorkItemFields } from './model'
import { formatAriary, parseDecimal } from './money'
import { fold } from './search'
import { normalizeUnit } from './units'

const SHEET = 'CSV'

type Column =
  | 'type'
  | 'code'
  | 'category'
  | 'designation'
  | 'unit'
  | 'price'
  | 'basis'
  | 'vatExempt'
  | 'supplier'
  | 'region'
  | 'date'
  | 'currency'

const HEADERS: Record<Column, RegExp> = {
  type: /^type$/,
  code: /^code$/,
  category: /^categorie$/,
  designation: /^designation$/,
  unit: /^unite$/,
  price: /^prix( (ht|ttc))?$/,
  basis: /^base$/,
  vatExempt: /^sans tva$/,
  supplier: /^fournisseur$/,
  region: /^region$/,
  date: /^date( d.?effet)?$/,
  currency: /^devise$/,
}

/** Découpe un CSV (guillemets doubles, retours à la ligne dans un champ). */
export function parseCsvRows(text: string): string[][] {
  const clean = text.replace(/^﻿/, '')
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? ''
  const separator = [';', '\t', ','].sort((a, b) => firstLine.split(b).length - firstLine.split(a).length)[0]
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i]
    if (quoted) {
      if (ch === '"' && clean[i + 1] === '"') {
        field += '"'
        i++
      } else if (ch === '"') quoted = false
      else field += ch
    } else if (ch === '"' && field === '') quoted = true
    else if (ch === separator) {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && clean[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else field += ch
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''))
}

function kindOf(raw: string): PriceKind | 'work' | null {
  const key = fold(raw).replace(/[^a-z]/g, '')
  if (/^materiaux?$|^mtx$|^material$/.test(key)) return 'material'
  if (/^materiels?$|^mtl$|^equipment$/.test(key)) return 'equipment'
  if (/^maindoeuvre$|^mo$|^labour$/.test(key)) return 'labour'
  if (/^postes?$|^travaux$|^work$/.test(key)) return 'work'
  return null
}

function parseDate(raw: string): string | null | 'invalid' {
  const text = raw.trim()
  if (text === '') return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text
  const fr = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text)
  if (fr) return `${fr[3]}-${fr[2].padStart(2, '0')}-${fr[1].padStart(2, '0')}`
  return 'invalid'
}

export function importCsv(text: string, vatRateBp: number): ImportedLibrary {
  const report = new ImportReportBuilder()
  const rows = parseCsvRows(text)
  const header = rows[0]?.map((cell) => fold(cell).replace(/[’']/g, "'").replace(/\s+/g, ' ').trim()) ?? []
  const col = {} as Partial<Record<Column, number>>
  for (const key of Object.keys(HEADERS) as Column[]) {
    const index = header.findIndex((cell) => HEADERS[key].test(cell))
    if (index >= 0) col[key] = index
  }
  const missing = (['type', 'designation', 'unit', 'price'] as const).filter((key) => col[key] === undefined)
  if (missing.length > 0) {
    report.add('csvHeaderMissing', SHEET, 1, missing.join(', '))
    return { priceItems: [], workItems: [], priceDate: null, issues: report.list() }
  }
  // Colonne « prix TTC » : base par défaut TTC.
  const defaultBasis = /ttc/.test(header[col.price!]) ? 'ttc_delivered' : 'ht'

  const priceItems: PriceItemFields[] = []
  const workItems: WorkItemFields[] = []
  rows.slice(1).forEach((cells, index) => {
    const line = index + 2
    const get = (key: Column) => (col[key] === undefined ? '' : (cells[col[key]!] ?? '').trim())
    const currency = fold(get('currency'))
    if (currency && !/^(ar|mga|ariary)$/.test(currency)) {
      report.add('currencyMismatch', SHEET, line, get('currency'))
      return
    }
    const kind = kindOf(get('type'))
    const designation = get('designation').replace(/\s+/g, ' ')
    const unitRaw = get('unit')
    if (!kind || !designation || !unitRaw) {
      report.add('csvRowInvalid', SHEET, line, !kind ? `type « ${get('type')} »` : !designation ? 'désignation vide' : 'unité vide')
      return
    }
    const unit = normalizeUnit(unitRaw)
    if (unit.changed && unit.unit !== unitRaw.trim()) report.add('unitNormalized', SHEET, line, `${unitRaw.trim()} → ${unit.unit}`)
    if (!unit.known) report.add('unitUnknown', SHEET, line, unit.unit)
    const priceText = get('price').replace(/[\s  ]/g, '').replace(/ar$/i, '').replace(',', '.')
    let price = priceText === '' ? null : parseDecimal(priceText, 1)
    if (priceText !== '' && (price === null || price < 0n)) {
      report.add('csvRowInvalid', SHEET, line, `prix « ${get('price')} »`)
      return
    }
    if (price !== null) {
      const fine = parseDecimal(priceText, 12)
      if (fine !== null && fine !== price * 10n ** 11n) report.add('decimalsRounded', SHEET, line, `${priceText} → ${formatAriary(price, { unit: false })}`)
      if (price === 0n) {
        report.add('zeroPrice', SHEET, line, designation.slice(0, 60))
        price = null
      }
    } else report.add('priceMissing', SHEET, line, designation.slice(0, 60))
    const date = parseDate(get('date'))
    if (date === 'invalid') {
      report.add('csvRowInvalid', SHEET, line, `date « ${get('date')} »`)
      return
    }
    const code = get('code')
    const sourceKey = `CSV:${kind}:${code || fold(designation)}`
    if (kind === 'work') {
      workItems.push({
        code,
        category: get('category'),
        designation,
        unit: unit.unit,
        priceHt: price,
        referencePrice: null,
        sourceCoefficient: '',
        output: '',
        components: [],
        sourceRow: `${SHEET}!${line}`,
        sourceKey,
      })
      return
    }
    const basisText = fold(get('basis'))
    const sourceBasis = basisText === '' ? defaultBasis : /ttc/.test(basisText) ? 'ttc_delivered' : 'ht'
    const vatExempt = sourceBasis === 'ttc_delivered' && /^(oui|o|yes|1|x)$/.test(fold(get('vatExempt')))
    if (sourceBasis === 'ttc_delivered' && price !== null && !vatExempt) report.add('htFromTtc')
    priceItems.push({
      kind,
      code,
      category: get('category'),
      designation,
      unit: unit.unit,
      sourceBasis,
      sourcePrice: sourceBasis === 'ttc_delivered' ? price : null,
      vatExempt,
      priceHt: priceHtFromSource(sourceBasis, price, vatExempt, vatRateBp),
      supplier: get('supplier'),
      region: get('region') || DEFAULT_REGION,
      effectiveDate: date,
      details: {},
      sourceRow: `${SHEET}!${line}`,
      sourceKey,
    })
  })
  return { priceItems, workItems, priceDate: null, issues: report.list() }
}
