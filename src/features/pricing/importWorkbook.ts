/**
 * Import du classeur de prix (format « Expert BTP », M23, 23.2). Décisions : D23-2, D23-5, D23-10 à
 * D23-14 (`docs/phases/M23-decisions.md`).
 *
 * - Matériaux (MTX) : prix TTC livré chantier gardé comme source ; HT = TTC ÷ (1 + TVA).
 * - Matériel (MTL) et main-d'œuvre (MO) : en HT (D23-14) ; prix par jour.
 * - Postes (BIBLIOTHEQUE_TRAVAUX + SDP) : prix brut = débours sec HT du sous-détail (D23-12) ;
 *   le « prix de référence » (coefficient compris) est gardé pour information.
 * Les colonnes sont trouvées par leur en-tête, pas par leur position. Rien n'est corrigé en silence.
 */
import { ImportReportBuilder, type ImportIssue } from './importReport'
import {
  DEFAULT_REGION,
  priceHtFromSource,
  type ComponentGroup,
  type PriceItemFields,
  type WorkComponent,
  type WorkItemFields,
} from './model'
import { formatAriary, parseDecimal, roundUpToHundredAr, type Tenths } from './money'
import { fold } from './search'
import { normalizeUnit } from './units'
import { cellNumber, cellText, excelSerialToIso, type Sheet, type Workbook } from './xlsxRead'

export interface ImportedLibrary {
  priceItems: PriceItemFields[]
  workItems: WorkItemFields[]
  /** Date de mise à jour lue dans le classeur (AAAA-MM-JJ). */
  priceDate: string | null
  issues: ImportIssue[]
}

// ---------------------------------------------------------------------------------------------
// Outils communs

/** En-tête comparable : sans accents, majuscules, espaces simples. */
function headerKey(text: string): string {
  return fold(text).toUpperCase().replace(/\s+/g, ' ').trim()
}

type Header<K extends string> = { row: number; col: Record<K, number | undefined> }

/** La ligne `row` est-elle une ligne d'en-tête avec toutes les colonnes voulues ? */
function headerAtRow<K extends string>(
  sheet: Sheet,
  row: number,
  columns: Record<K, RegExp>,
  optional: readonly NoInfer<K>[],
): Header<K> | null {
  const cells = sheet.cells.get(row)
  if (!cells) return null
  const col = {} as Record<K, number | undefined>
  for (const key of Object.keys(columns) as K[]) {
    const found = [...cells.entries()].find(([, cell]) => cell.kind === 'string' && columns[key].test(headerKey(cell.text)))
    col[key] = found?.[0]
    if (found === undefined && !optional.includes(key)) return null
  }
  return { row, col }
}

/** Cherche, dans les 30 premières lignes, la ligne d'en-tête qui contient toutes les colonnes voulues. */
function findHeader<K extends string>(
  sheet: Sheet,
  columns: Record<K, RegExp>,
  optional: readonly NoInfer<K>[] = [],
): Header<K> | null {
  for (let row = 1; row <= Math.min(30, sheet.maxRow); row++) {
    const header = headerAtRow(sheet, row, columns, optional)
    if (header) return header
  }
  return null
}

/**
 * Une feuille peut contenir un second tableau avec ses propres en-têtes (MO, MTL) : une ligne qui
 * répète « Désignation » redéfinit les colonnes. Une ligne « TOTAL … » est ignorée.
 */
function restartOrTotal<K extends string>(
  sheet: Sheet,
  row: number,
  designation: string,
  columns: Record<K, RegExp>,
  optional: readonly NoInfer<K>[],
): { header: Header<K> | null; skip: boolean } {
  const key = headerKey(designation)
  if (/^DESIGNATIONS?$/.test(key)) return { header: headerAtRow(sheet, row, columns, optional), skip: true }
  return { header: null, skip: /^TOTAL\b/.test(key) }
}

/** En-tête d'un tableau de prix ; absent ou monnaie étrangère : signalé, `null`. */
function openTable<K extends string>(
  sheet: Sheet,
  columns: Record<K, RegExp>,
  optional: readonly NoInfer<K>[],
  report: ImportReportBuilder,
): Header<K> | null {
  const header = findHeader(sheet, columns, optional)
  if (!header) {
    report.add('sheetMissing', sheet.name, 0, 'en-têtes introuvables')
    return null
  }
  return checkCurrency(sheet, header.row, report) ? header : null
}

/**
 * Début d'une ligne d'un tableau qui peut en contenir un second (MO, MTL) : nouvelles colonnes,
 * ligne à ignorer (en-tête répété, total), ou arrêt (monnaie étrangère dans le second en-tête).
 */
function nextRow<K extends string>(
  sheet: Sheet,
  row: number,
  designation: string,
  col: Record<K, number | undefined>,
  columns: Record<K, RegExp>,
  optional: readonly NoInfer<K>[],
  report: ImportReportBuilder,
): { col: Record<K, number | undefined>; skip: boolean; stop: boolean } {
  const restart = restartOrTotal(sheet, row, designation, columns, optional)
  if (restart.header && !checkCurrency(sheet, row, report)) return { col, skip: true, stop: true }
  return { col: restart.header?.col ?? col, skip: restart.skip, stop: false }
}

/** Montants d'information (colonnes secondaires) écrits en Ariary. */
function amountDetails(sheet: Sheet, row: number, pairs: readonly [string, number | undefined][]): Record<string, string> {
  const details: Record<string, string> = {}
  for (const [label, c] of pairs) {
    const value = c === undefined ? null : parseDecimal(cellNumber(sheet, row, c) ?? '', 1)
    if (value !== null) details[label] = formatAriary(value)
  }
  return details
}

/** Texte nettoyé : lignes rognées, espaces multiples réduits. Signale le nettoyage. */
function cleanText(raw: string, report: ImportReportBuilder, sheet: string, row: number): string {
  const cleaned = raw
    .split(/\r?\n/)
    .map((line) => line.replace(/[ \t ]+/g, ' ').trim())
    .filter((line) => line !== '')
    .join('\n')
  if (cleaned !== raw && cleaned !== raw.trim()) report.add('spacesTrimmed', sheet, row, cleaned.slice(0, 60))
  return cleaned
}

/** Prix en dixièmes ; plus d'une décimale : arrondi au dixième, signalé. `null` si pas un nombre. */
function toTenths(raw: string | null, report: ImportReportBuilder, sheet: string, row: number): Tenths | null {
  if (raw === null) return null
  const tenths = parseDecimal(raw, 1)
  if (tenths === null) return null
  const fine = parseDecimal(raw, 12)
  if (fine !== null && fine !== tenths * 10n ** 11n) {
    report.add('decimalsRounded', sheet, row, `${raw} → ${formatAriary(tenths, { unit: false })}`)
  }
  return tenths
}

/** Unité normalisée ; `null` si absente. Normalisation et unité inconnue signalées. */
function toUnit(raw: string, report: ImportReportBuilder, sheet: string, row: number): string | null {
  if (raw.trim() === '') return null
  const unit = normalizeUnit(raw)
  if (unit.unit !== raw.trim()) report.add('unitNormalized', sheet, row, `${raw.trim()} → ${unit.unit}`)
  if (!unit.known) report.add('unitUnknown', sheet, row, unit.unit)
  return unit.unit
}

function findSheet(workbook: Workbook, pattern: RegExp): Sheet | undefined {
  return workbook.sheets.find((sheet) => pattern.test(headerKey(sheet.name)))
}

/** Date « Date de mise à jour » écrite en haut d'une feuille. */
function readPriceDate(sheet: Sheet): string | null {
  for (let row = 1; row <= Math.min(8, sheet.maxRow); row++) {
    const cells = [...(sheet.cells.get(row)?.entries() ?? [])].sort(([a], [b]) => a - b)
    const labelIndex = cells.findIndex(([, cell]) => cell.kind === 'string' && /DATE DE MISE A JOUR/.test(headerKey(cell.text)))
    if (labelIndex < 0) continue
    for (const [, cell] of cells.slice(labelIndex + 1)) {
      if (cell.kind === 'number') return excelSerialToIso(cell.raw)
      if (cell.kind === 'string' && /^\d{4}-\d{2}-\d{2}/.test(cell.text)) return cell.text.slice(0, 10)
    }
  }
  return null
}

/** Une monnaie autre que l'Ariary dans un en-tête de prix : fichier refusé (D23-1). */
function checkCurrency(sheet: Sheet, headerRow: number, report: ImportReportBuilder): boolean {
  for (const [col, cell] of sheet.cells.get(headerRow) ?? []) {
    if (cell.kind === 'string' && /€|\bEUR\b|\bUSD\b|\$/.test(cell.text.toUpperCase())) {
      report.add('currencyMismatch', sheet.name, headerRow, `colonne ${col} : ${cell.text}`)
      return false
    }
  }
  return true
}

/** « 1.1000000000000001 » → « 1.1 » (au millionième), pour un coefficient lu dans Excel. */
function normalizeDecimalText(raw: string): string {
  const value = parseDecimal(raw.trim(), 6)
  if (value === null) return raw.trim()
  const whole = value / 1000000n
  const fraction = (value < 0n ? -value : value) % 1000000n
  const digits = fraction.toString().padStart(6, '0').replace(/0+$/, '')
  return digits ? `${whole}.${digits}` : `${whole}`
}

function detailText(value: Tenths | null): string {
  return value === null ? '' : formatAriary(value, { unit: false })
}

// ---------------------------------------------------------------------------------------------
// Feuilles de prix

interface Context {
  report: ImportReportBuilder
  vatRateBp: number
  priceDate: string | null
}

function readMaterials(sheet: Sheet, ctx: Context): PriceItemFields[] {
  const { report } = ctx
  const header = openTable(
    sheet,
    {
      code: /^CODES?$/,
      category: /^CATEGORIES?$/,
      designation: /^DESIGNATIONS?$/,
      unit: /^UNITES?$/,
      ttcDelivered: /TTC LIVRE/,
      htDelivered: /HT LIVRE/,
      htTana: /^PU HT ANTANANARIVO/,
      ttcTana: /^PU TTC ANTANANARIVO/,
      transport: /TRANSPORT/,
      supplier: /^FOURNISSEURS?$/,
      contact: /CONTACT/,
    },
    ['htDelivered', 'htTana', 'ttcTana', 'transport', 'supplier', 'contact', 'category', 'code'],
    report,
  )
  if (!header) return []
  const { col } = header
  const read = (row: number, c: number | undefined) => (c === undefined ? '' : cellText(sheet, row, c))
  const items: PriceItemFields[] = []
  for (let row = header.row + 1; row <= sheet.maxRow; row++) {
    const code = read(row, col.code).trim()
    const designationRaw = read(row, col.designation)
    const unitRaw = read(row, col.unit)
    if (designationRaw.trim() === '' && unitRaw.trim() === '') {
      if (code !== '') report.add('categoryRowsSkipped', sheet.name, row, `${code} ${read(row, col.category)}`.trim())
      continue
    }
    const designation = cleanText(designationRaw, report, sheet.name, row)
    const unit = toUnit(unitRaw, report, sheet.name, row)
    if (!unit) {
      report.add('unitMissing', sheet.name, row, designation.slice(0, 60))
      continue
    }
    let ttc = toTenths(cellNumber(sheet, row, col.ttcDelivered!), report, sheet.name, row)
    if (ttc === null) report.add('priceMissing', sheet.name, row, designation.slice(0, 60))
    else if (ttc === 0n) {
      report.add('zeroPrice', sheet.name, row, designation.slice(0, 60))
      ttc = null
    }
    // D23-16 : un « HT livré » égal au TTC signale une ligne achetée sans TVA.
    const sheetHt = col.htDelivered === undefined ? null : parseDecimal(cellNumber(sheet, row, col.htDelivered) ?? '', 1)
    const vatExempt = ttc !== null && sheetHt === ttc
    const priceHt = priceHtFromSource('ttc_delivered', ttc, vatExempt, ctx.vatRateBp)
    if (vatExempt) report.add('vatExemptDetected', sheet.name, row, `${designation.slice(0, 40)} : ${detailText(ttc)}`)
    else if (priceHt !== null) {
      report.add('htFromTtc')
      if (sheetHt !== null && (sheetHt - priceHt > 1n || priceHt - sheetHt > 1n)) {
        report.add('htColumnGap', sheet.name, row, `${detailText(sheetHt)} / ${detailText(priceHt)}`)
      }
    }
    const details: Record<string, string> = {}
    const keep = (label: string, c: number | undefined) => {
      const value = c === undefined ? '' : read(row, c).trim()
      if (value) details[label] = value
    }
    keep('PU HT Antananarivo', col.htTana)
    keep('PU TTC Antananarivo', col.ttcTana)
    keep('Frais de transport', col.transport)
    keep('Contact fournisseur', col.contact)
    items.push({
      kind: 'material',
      code,
      category: cleanText(read(row, col.category), report, sheet.name, row),
      designation,
      unit,
      sourceBasis: 'ttc_delivered',
      sourcePrice: ttc,
      vatExempt,
      priceHt,
      supplier: cleanText(read(row, col.supplier), report, sheet.name, row),
      region: DEFAULT_REGION,
      effectiveDate: ctx.priceDate,
      details,
      sourceRow: `${sheet.name}!${row}`,
      sourceKey: code ? `MTX:${code}` : `MTX:#${fold(designation)}`,
    })
  }
  return items
}

function readEquipment(sheet: Sheet, ctx: Context): PriceItemFields[] {
  const { report } = ctx
  const columns = {
    designation: /^DESIGNATIONS?$/,
    unit: /^UNITES?$/,
    purchase: /^PRIX HT/,
    depreciation: /^DUREE D.?AMORTISSEMENT/,
    // Second tableau (« lot de petit matériel ») : amortissement par jour.
    perDay: /LOCATION PAR JOUR|^MONTANT D.?AMORTISSEMENT/,
    fuel: /CARBURANT/,
    perHour: /LOCATION PAR HEURE/,
    supplier: /^FOURNISSEURS?$/,
  }
  const optional = ['unit', 'purchase', 'depreciation', 'fuel', 'perHour', 'supplier'] as const
  const header = openTable(sheet, columns, optional, report)
  if (!header) return []
  let { col } = header
  const read = (row: number, c: number | undefined) => (c === undefined ? '' : cellText(sheet, row, c))
  const items: PriceItemFields[] = []
  for (let row = header.row + 1; row <= sheet.maxRow; row++) {
    const designationRaw = read(row, col.designation)
    if (designationRaw.trim() === '') continue
    const next = nextRow(sheet, row, designationRaw, col, columns, optional, report)
    if (next.stop) return items
    col = next.col
    if (next.skip) continue
    const designation = cleanText(designationRaw, report, sheet.name, row)
    const perDayRaw = cellNumber(sheet, row, col.perDay!)
    const anyNumber = [col.purchase, col.perDay, col.fuel, col.perHour].some(
      (c) => c !== undefined && cellNumber(sheet, row, c) !== null,
    )
    if (!anyNumber) {
      report.add('categoryRowsSkipped', sheet.name, row, designation.slice(0, 60))
      continue
    }
    let perDay = toTenths(perDayRaw, report, sheet.name, row)
    let unit = 'J'
    if (perDay === null || perDay === 0n) {
      // D23-18 : sans location par jour, le « prix HT » de la feuille, avec son unité.
      const purchase = col.purchase === undefined ? null : toTenths(cellNumber(sheet, row, col.purchase), report, sheet.name, row)
      const purchaseUnit = col.unit === undefined ? null : toUnit(read(row, col.unit), report, sheet.name, row)
      if (purchase !== null && purchase > 0n && purchaseUnit && headerKey(purchaseUnit) !== 'UNITES') {
        report.add('purchasePriceUsed', sheet.name, row, `${designation.slice(0, 40)} : ${detailText(purchase)} / ${purchaseUnit}`)
        perDay = purchase
        unit = purchaseUnit
      } else if (perDay === 0n) {
        report.add('zeroPrice', sheet.name, row, designation.slice(0, 60))
        perDay = null
      } else {
        report.add('priceMissing', sheet.name, row, designation.slice(0, 60))
      }
    }
    report.add('assumedHt', sheet.name, row, designation.slice(0, 40))
    const details = amountDetails(sheet, row, [
      ["Prix d'achat HT", col.purchase],
      ['Carburant par jour', col.fuel],
      ['Location par heure', col.perHour],
    ])
    const days = col.depreciation === undefined ? '' : read(row, col.depreciation).trim()
    if (days) details["Durée d'amortissement (jours)"] = days
    const purchaseUnit = read(row, col.unit).trim()
    if (purchaseUnit) details["Unité d'achat"] = purchaseUnit
    items.push({
      kind: 'equipment',
      code: '',
      category: '',
      designation,
      unit,
      sourceBasis: 'ht',
      sourcePrice: null,
      vatExempt: false,
      priceHt: perDay,
      supplier: cleanText(read(row, col.supplier), report, sheet.name, row),
      region: DEFAULT_REGION,
      effectiveDate: ctx.priceDate,
      details,
      sourceRow: `${sheet.name}!${row}`,
      sourceKey: `MTL:${fold(designation)}`,
    })
  }
  return items
}

function readLabour(sheet: Sheet, ctx: Context): PriceItemFields[] {
  const { report } = ctx
  const columns = {
    designation: /^DESIGNATIONS?$/,
    perMonth: /^MO ?\/ ?MOIS/,
    perWeek: /^MO ?\/ ?SEMAINE/,
    perDay: /^MO ?\/ ?(JR|JOUR)/,
    perHour: /^MO ?\/ ?(HR|HEURE)/,
  }
  const optional = ['perMonth', 'perWeek', 'perHour'] as const
  const header = openTable(sheet, columns, optional, report)
  if (!header) return []
  let { col } = header
  const items: PriceItemFields[] = []
  for (let row = header.row + 1; row <= sheet.maxRow; row++) {
    const designationRaw = cellText(sheet, row, col.designation!)
    if (designationRaw.trim() === '') continue
    const next = nextRow(sheet, row, designationRaw, col, columns, optional, report)
    if (next.stop) return items
    col = next.col
    if (next.skip) continue
    const designation = cleanText(designationRaw, report, sheet.name, row)
    let perDay = toTenths(cellNumber(sheet, row, col.perDay!), report, sheet.name, row)
    if (perDay === null) {
      report.add('priceMissing', sheet.name, row, designation.slice(0, 60))
    } else if (perDay === 0n) {
      report.add('zeroPrice', sheet.name, row, designation.slice(0, 60))
      perDay = null
    }
    report.add('assumedHt', sheet.name, row, designation.slice(0, 40))
    const details = amountDetails(sheet, row, [
      ['Par mois', col.perMonth],
      ['Par semaine', col.perWeek],
      ['Par heure', col.perHour],
    ])
    items.push({
      kind: 'labour',
      code: '',
      category: '',
      designation,
      unit: 'J',
      sourceBasis: 'ht',
      sourcePrice: null,
      vatExempt: false,
      priceHt: perDay,
      supplier: '',
      region: DEFAULT_REGION,
      effectiveDate: ctx.priceDate,
      details,
      sourceRow: `${sheet.name}!${row}`,
      sourceKey: `MO:${fold(designation)}`,
    })
  }
  return items
}

// ---------------------------------------------------------------------------------------------
// Sous-détails (SDP) et postes (BIBLIOTHEQUE_TRAVAUX)

interface DetailBlock {
  number: number
  id: string
  row: number
  coefficient: string
  unit: string
  output: string
  total: Tenths | null
  unitPrice: Tenths | null
  components: WorkComponent[]
  used: boolean
}

function groupOf(label: string): ComponentGroup | null {
  const key = headerKey(label)
  if (/^MATERIELS?$/.test(key)) return 'equipment'
  if (/^MATERIAUX$/.test(key)) return 'material'
  if (/^(PERSONNEL|MAIN D.?OEUVRE)$/.test(key)) return 'labour'
  return null
}

function readDetails(sheet: Sheet, report: ImportReportBuilder): Map<number, DetailBlock> {
  const blocks = new Map<number, DetailBlock>()
  let block: DetailBlock | null = null
  let group: ComponentGroup = 'other'
  let inLines = false
  for (let row = 1; row <= sheet.maxRow; row++) {
    const a = cellText(sheet, row, 1).trim()
    const label = cellText(sheet, row, 2).trim()
    const idMatch = /^SDP[-_ ]?(\d+)$/i.exec(a)
    if (idMatch) {
      block = {
        number: Number(idMatch[1]),
        id: a.toUpperCase(),
        row,
        coefficient: normalizeDecimalText(cellText(sheet, row, 6)),
        unit: '',
        output: '',
        total: null,
        unitPrice: null,
        components: [],
        used: false,
      }
      blocks.set(block.number, block)
      group = 'other'
      inLines = false
      continue
    }
    if (!block) continue
    const key = headerKey(label)
    if (key === 'UNITE') block.unit = cellText(sheet, row, 3).trim()
    else if (key === 'RENDEMENT') block.output = cellText(sheet, row, 3).trim()
    else if (key === 'POSTES') inLines = true
    else if (key === 'TOTAL') {
      block.total = toTenths(cellNumber(sheet, row, 6), report, sheet.name, row)
      inLines = false
    } else if (key.startsWith('PRIX UNITAIRE')) {
      block.unitPrice = toTenths(cellNumber(sheet, row, 6), report, sheet.name, row)
    } else if (inLines) {
      const summary = headerKey(cellText(sheet, row, 5))
      if (summary === 'MTL' || summary === 'MTX' || summary === 'MO') continue
      const asGroup = label ? groupOf(label) : null
      if (asGroup) {
        group = asGroup
        continue
      }
      if (!label) continue
      const quantity = cellNumber(sheet, row, 4)
      const unitPrice = toTenths(cellNumber(sheet, row, 5), report, sheet.name, row)
      const amount = toTenths(cellNumber(sheet, row, 6), report, sheet.name, row)
      if (quantity === null && amount === null) continue // intitulé de sous-groupe
      if ((amount ?? 0n) === 0n && (parseDecimal(quantity ?? '0', 6) ?? 0n) === 0n) {
        report.add('emptyComponentsSkipped', sheet.name, row, `${block.id} : ${label.slice(0, 40)}`)
        continue
      }
      block.components.push({
        group,
        designation: cleanText(label, report, sheet.name, row),
        unit: normalizeUnit(cellText(sheet, row, 3)).unit,
        quantity: quantity ?? '0',
        unitPriceHt: unitPrice ?? 0n,
        amountHt: amount ?? 0n,
      })
    }
  }
  return blocks
}

const LINK_EXACT = /^🔗?VOIR_SDP_\d+$/

function readWorks(sheet: Sheet, details: Map<number, DetailBlock> | null, ctx: Context): WorkItemFields[] {
  const { report } = ctx
  const header = openTable(
    sheet,
    {
      code: /^CODE$/,
      category: /^CATEGORIE$/,
      designation: /^DESIGNATION/,
      unit: /^UNITE$/,
      reference: /^PRIX DE REFERENCE/,
      link: /SDP/,
    },
    ['category', 'reference', 'link']
  , report)
  if (!header) return []
  const { col } = header
  const read = (row: number, c: number | undefined) => (c === undefined ? '' : cellText(sheet, row, c))
  const items: WorkItemFields[] = []
  for (let row = header.row + 1; row <= sheet.maxRow; row++) {
    const code = read(row, col.code).trim()
    if (!/^CAT-\d+-\d+$/i.test(code)) continue
    const designation = cleanText(read(row, col.designation), report, sheet.name, row)
    const linkRaw = read(row, col.link).trim()
    const linkNumber = /(\d+)\s*$/.exec(linkRaw)?.[1]
    if (linkRaw && !LINK_EXACT.test(linkRaw) && linkNumber) {
      report.add('linkFixed', sheet.name, row, `${linkRaw} → SDP-${linkNumber.padStart(3, '0')}`)
    }
    const block = linkNumber && details ? details.get(Number(linkNumber)) : undefined
    let unit = toUnit(read(row, col.unit), report, sheet.name, row)
    if (!unit && block && headerKey(block.unit) !== 'UNITE' && block.unit) unit = normalizeUnit(block.unit).unit
    if (!unit) {
      report.add('unitMissing', sheet.name, row, code)
      continue
    }
    const reference = col.reference === undefined ? null : toTenths(cellNumber(sheet, row, col.reference), report, sheet.name, row)
    let priceHt: Tenths | null = null
    if (!block) {
      report.add('workWithoutDetail', sheet.name, row, `${code} ${linkRaw}`.trim())
    } else {
      block.used = true
      priceHt = block.total
      if (priceHt === null) report.add('priceMissing', 'SDP', block.row, block.id)
      else checkDetail(block, priceHt, reference, code, row, report)
    }
    items.push({
      code,
      category: cleanText(read(row, col.category), report, sheet.name, row),
      designation,
      unit,
      priceHt,
      referencePrice: reference,
      sourceCoefficient: block?.coefficient ?? '',
      output: block?.output ?? '',
      components: block?.components ?? [],
      sourceRow: block ? `${sheet.name}!${row} · SDP!${block.row}` : `${sheet.name}!${row}`,
      sourceKey: `TRAV:${code.toUpperCase()}`,
    })
  }
  for (const block of details?.values() ?? []) {
    if (!block.used) report.add('detailWithoutWork', 'SDP', block.row, block.id)
  }
  return items
}

/** Contrôles d'un sous-détail : somme des lignes, prix de référence, ligne « prix unitaire ». */
function checkDetail(
  block: DetailBlock,
  total: Tenths,
  reference: Tenths | null,
  code: string,
  row: number,
  report: ImportReportBuilder,
) {
  const sum = block.components.reduce((acc, c) => acc + c.amountHt, 0n)
  const gap = sum > total ? sum - total : total - sum
  // Écart toléré : 1 Ar (arrondi de chaque ligne au dixième).
  if (block.components.length > 0 && gap > 10n) {
    report.add('detailTotalGap', 'SDP', block.row, `${block.id} : ${detailText(sum)} / ${detailText(total)}`)
  }
  const k = parseDecimal(block.coefficient, 6)
  if (k !== null && k > 0n) {
    const withK = (total * k + 500000n) / 1000000n
    if (reference !== null) {
      report.add(
        'referenceWithCoefficient',
        'BIBLIOTHEQUE_TRAVAUX',
        row,
        `${code} : ${detailText(total)} × ${block.coefficient.replace('.', ',')} → ${detailText(roundUpToHundredAr(withK))} (classeur : ${detailText(reference)})`,
      )
    }
    if (block.unitPrice !== null && block.unitPrice !== withK && block.unitPrice === total) {
      report.add('unitPriceWithoutCoefficient', 'SDP', block.row, block.id)
    }
  }
}

// ---------------------------------------------------------------------------------------------

/** Rend chaque clé d'import unique (suffixe « ~2 ») et signale les doublons. */
function dedupeKeys<T extends { sourceKey: string; sourceRow: string; designation: string }>(
  items: T[],
  report: ImportReportBuilder,
): T[] {
  const seen = new Map<string, number>()
  return items.map((item) => {
    const n = (seen.get(item.sourceKey) ?? 0) + 1
    seen.set(item.sourceKey, n)
    if (n === 1) return item
    report.add('duplicateKey', item.sourceRow.split('!')[0], Number(item.sourceRow.split('!')[1]?.split(' ')[0] ?? 0), item.designation.slice(0, 60))
    return { ...item, sourceKey: `${item.sourceKey}~${n}` }
  })
}

/** Lit le classeur entier. `vatRateBp` : taux de la bibliothèque (HT tiré du TTC des matériaux). */
export function importWorkbook(workbook: Workbook, vatRateBp: number): ImportedLibrary {
  const report = new ImportReportBuilder()
  const mtx = findSheet(workbook, /^MTX/)
  const mtl = findSheet(workbook, /^MTL/)
  const mo = findSheet(workbook, /^MO$/)
  const works = findSheet(workbook, /TRAVAUX/)
  const sdp = findSheet(workbook, /^SDP$/)
  if (!mtx && !mtl && !mo && !works) {
    report.add('noKnownSheet', '', 0, workbook.sheets.map((s) => s.name).join(', ').slice(0, 120))
    return { priceItems: [], workItems: [], priceDate: null, issues: report.list() }
  }
  for (const [sheet, name] of [
    [mtx, 'MTX'],
    [mtl, 'MTL ET OUTILLAGE'],
    [mo, 'MO'],
    [works, 'BIBLIOTHEQUE_TRAVAUX'],
    [sdp, 'SDP'],
  ] as const) {
    if (!sheet) report.add('sheetMissing', name, 0, '')
  }
  const priceDate = [mtx, mtl, mo].map((s) => (s ? readPriceDate(s) : null)).find((d) => d !== null) ?? null
  const ctx: Context = { report, vatRateBp, priceDate }
  const priceItems = dedupeKeys(
    [...(mtx ? readMaterials(mtx, ctx) : []), ...(mtl ? readEquipment(mtl, ctx) : []), ...(mo ? readLabour(mo, ctx) : [])],
    report,
  )
  const details = sdp ? readDetails(sdp, report) : null
  const workItems = dedupeKeys(works ? readWorks(works, details, ctx) : [], report)
  return { priceItems, workItems, priceDate, issues: report.list() }
}
