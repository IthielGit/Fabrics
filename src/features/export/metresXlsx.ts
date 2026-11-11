import { strToU8, zipSync } from 'fflate'
import { cellText, type MetresCell, type MetresTable, type MetresUnit } from '../measurements/tables'

/**
 * Fichier Excel (.xlsx) des métrés, écrit à la main : un zip de fichiers XML (format Office Open XML)
 * fabriqué avec `fflate`. Un onglet par tableau, de vrais nombres (valeurs exactes, affichées en mm
 * entiers ou en m² et m³ à 2 décimales), des totaux en formules `SOMME`, des en-têtes figés et un
 * filtre, une mise en page paysage à une page de large. Le texte est stocké comme texte : un nom
 * qui commence par `=` n'est jamais lu comme une formule.
 */

export interface XlsxInfo {
  /** Titre de l'onglet d'information et du classeur (« Métrés »). */
  title: string
  /** Lignes « intitulé ; valeur » (projet, date, unités, remarque). */
  rows: [label: string, value: string][]
}

const NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
const REL_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
const PKG_REL = 'http://schemas.openxmlformats.org/package/2006/relationships'

/** Indices de styles (`cellXfs` de `styles.xml`). */
const STYLE = {
  text: 0,
  title: 1,
  note: 2,
  headerLeft: 3,
  headerRight: 4,
  mm: 5,
  decimal: 6,
  count: 7,
  totalText: 8,
  totalMm: 9,
  totalDecimal: 10,
  totalCount: 11,
  label: 12,
} as const

/** Retire les caractères interdits en XML 1.0 et échappe les cinq caractères réservés. */
export function xmlEscape(text: string): string {
  return text
    // eslint-disable-next-line no-control-regex -- les caractères de contrôle sont interdits en XML 1.0
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Nom de colonne Excel : 0 → A, 25 → Z, 26 → AA. */
export function columnName(index: number): string {
  let n = index + 1
  let name = ''
  while (n > 0) {
    const rest = (n - 1) % 26
    name = String.fromCharCode(65 + rest) + name
    n = Math.floor((n - 1) / 26)
  }
  return name
}

/** Nom d'onglet valide : 31 caractères au plus, sans `[ ] : * ? / \`, unique. */
export function sheetName(title: string, taken: ReadonlySet<string>): string {
  const base = title.replace(/[[\]:*?/\\]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 31) || 'Feuille'
  let name = base
  let n = 2
  while (taken.has(name.toLowerCase())) {
    const suffix = ` ${n++}`
    name = base.slice(0, 31 - suffix.length) + suffix
  }
  return name
}

const textCell = (ref: string, text: string, style: number) =>
  text === ''
    ? `<c r="${ref}" s="${style}"/>`
    : `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(text)}</t></is></c>`

const numberCell = (ref: string, value: number, style: number, formula?: string) =>
  `<c r="${ref}" s="${style}">${formula ? `<f>${xmlEscape(formula)}</f>` : ''}<v>${Number.isFinite(value) ? value : 0}</v></c>`

const numberStyle = (unit: MetresUnit, total: boolean): number => {
  if (unit === 'mm') return total ? STYLE.totalMm : STYLE.mm
  if (unit === 'count') return total ? STYLE.totalCount : STYLE.count
  return total ? STYLE.totalDecimal : STYLE.decimal
}

interface SheetXml {
  name: string
  xml: string
}

/** Largeur de colonne en caractères : le contenu le plus long, borné ; l'en-tête passe à la ligne. */
function columnWidths(table: MetresTable): number[] {
  return table.columns.map((column, index) => {
    const words = column.header.split(/\s+/).map((word) => word.length)
    const cells = [...table.rows, ...(table.total ? [table.total] : [])].map((row) =>
      cellText(row[index] ?? '').length,
    )
    const header = Math.min(Math.max(...words), 14)
    return Math.min(46, Math.max(10, header + 2, ...cells.map((length) => length + 2)))
  })
}

function tableSheet(table: MetresTable, name: string): SheetXml {
  const lines: string[] = []
  let row = 1
  lines.push(`<row r="${row}">${textCell(`A${row}`, table.title, STYLE.title)}</row>`)
  row++
  if (table.note) {
    lines.push(`<row r="${row}">${textCell(`A${row}`, table.note, STYLE.note)}</row>`)
    row++
  }
  const headerRow = row
  lines.push(
    `<row r="${row}" ht="42" customHeight="1">${table.columns
      .map((column, i) =>
        textCell(`${columnName(i)}${row}`, column.header, column.align === 'right' ? STYLE.headerRight : STYLE.headerLeft),
      )
      .join('')}</row>`,
  )
  row++

  const firstData = row
  const renderCell = (cell: MetresCell, column: number, rowNumber: number, total: boolean): string => {
    const ref = `${columnName(column)}${rowNumber}`
    if (typeof cell === 'string') return textCell(ref, cell, total ? STYLE.totalText : STYLE.text)
    return numberCell(ref, cell.value, numberStyle(cell.unit, total))
  }
  for (const cells of table.rows) {
    lines.push(`<row r="${row}">${table.columns.map((_, i) => renderCell(cells[i] ?? '', i, row, false)).join('')}</row>`)
    row++
  }
  const lastData = row - 1

  if (table.total) {
    const total = table.total
    const cells = table.columns.map((_, i) => {
      const cell = total[i] ?? ''
      const ref = `${columnName(i)}${row}`
      if (typeof cell === 'string') return textCell(ref, cell, STYLE.totalText)
      // Total en formule (SOMME de la colonne) ; sa valeur gardée est la valeur exacte calculée par Fabrics.
      const formula = lastData >= firstData ? `SUM(${columnName(i)}${firstData}:${columnName(i)}${lastData})` : undefined
      return numberCell(ref, cell.value, numberStyle(cell.unit, true), formula)
    })
    lines.push(`<row r="${row}">${cells.join('')}</row>`)
    row++
  }

  const widths = columnWidths(table)
  const cols = widths
    .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
    .join('')
  const lastColumn = columnName(table.columns.length - 1)
  const filter =
    lastData >= firstData ? `<autoFilter ref="A${headerRow}:${lastColumn}${lastData}"/>` : ''

  const xml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="${NS}" xmlns:r="${REL_NS}">` +
    `<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>` +
    `<dimension ref="A1:${lastColumn}${row - 1}"/>` +
    `<sheetViews><sheetView workbookViewId="0"><pane ySplit="${headerRow}" topLeftCell="A${headerRow + 1}" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft"/></sheetView></sheetViews>` +
    `<sheetFormatPr defaultRowHeight="15"/>` +
    `<cols>${cols}</cols>` +
    `<sheetData>${lines.join('')}</sheetData>` +
    filter +
    `<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>` +
    `<pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/>` +
    `</worksheet>`
  return { name, xml }
}

function infoSheet(info: XlsxInfo, name: string): SheetXml {
  const lines: string[] = [`<row r="1">${textCell('A1', info.title, STYLE.title)}</row>`]
  info.rows.forEach(([label, value], i) => {
    const r = i + 3
    lines.push(`<row r="${r}">${textCell(`A${r}`, label, STYLE.label)}${textCell(`B${r}`, value, STYLE.text)}</row>`)
  })
  const xml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="${NS}" xmlns:r="${REL_NS}">` +
    `<dimension ref="A1:B${info.rows.length + 2}"/>` +
    `<sheetViews><sheetView workbookViewId="0" showGridLines="0"/></sheetViews>` +
    `<sheetFormatPr defaultRowHeight="15"/>` +
    `<cols><col min="1" max="1" width="18" customWidth="1"/><col min="2" max="2" width="90" customWidth="1"/></cols>` +
    `<sheetData>${lines.join('')}</sheetData>` +
    `<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>` +
    `</worksheet>`
  return { name, xml }
}

/** Styles : police et encre neutres, en-tête gris clair souligné, totaux en gras avec un filet au-dessus. */
const STYLES_XML =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
  `<styleSheet xmlns="${NS}">` +
  `<fonts count="5">` +
  `<font><sz val="10"/><color rgb="FF1A1A1A"/><name val="Calibri"/><family val="2"/></font>` +
  `<font><b/><sz val="10"/><color rgb="FF1A1A1A"/><name val="Calibri"/><family val="2"/></font>` +
  `<font><b/><sz val="14"/><color rgb="FF1A1A1A"/><name val="Calibri"/><family val="2"/></font>` +
  `<font><i/><sz val="9"/><color rgb="FF666666"/><name val="Calibri"/><family val="2"/></font>` +
  `<font><b/><sz val="9"/><color rgb="FF1A1A1A"/><name val="Calibri"/><family val="2"/></font>` +
  `</fonts>` +
  `<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>` +
  `<fill><patternFill patternType="solid"><fgColor rgb="FFF2F2F2"/><bgColor indexed="64"/></patternFill></fill></fills>` +
  `<borders count="3"><border><left/><right/><top/><bottom/><diagonal/></border>` +
  `<border><left/><right/><top/><bottom style="thin"><color rgb="FF1A1A1A"/></bottom><diagonal/></border>` +
  `<border><left/><right/><top style="thin"><color rgb="FF1A1A1A"/></top><bottom/><diagonal/></border></borders>` +
  `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
  `<cellXfs count="13">` +
  `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>` + // 0 texte
  `<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>` + // 1 titre
  `<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>` + // 2 note
  `<xf numFmtId="0" fontId="4" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>` + // 3 en-tête gauche
  `<xf numFmtId="0" fontId="4" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center" wrapText="1"/></xf>` + // 4 en-tête droite
  `<xf numFmtId="1" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>` + // 5 mm
  `<xf numFmtId="2" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>` + // 6 m² et m³
  `<xf numFmtId="1" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>` + // 7 nombre
  `<xf numFmtId="0" fontId="1" fillId="0" borderId="2" xfId="0" applyFont="1" applyBorder="1"/>` + // 8 total texte
  `<xf numFmtId="1" fontId="1" fillId="0" borderId="2" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1"/>` + // 9 total mm
  `<xf numFmtId="2" fontId="1" fillId="0" borderId="2" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1"/>` + // 10 total décimal
  `<xf numFmtId="1" fontId="1" fillId="0" borderId="2" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1"/>` + // 11 total nombre
  `<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>` + // 12 intitulé
  `</cellXfs>` +
  `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>` +
  `</styleSheet>`

/**
 * Construit le classeur : un onglet d'information (si `info` est donné), puis un onglet par tableau.
 * Renvoie les octets du fichier `.xlsx`.
 */
export function buildMetresXlsx(
  tables: readonly MetresTable[],
  info?: XlsxInfo,
  /** Date de création inscrite dans les propriétés du fichier (ISO 8601). */
  createdIso: string = '2000-01-01T00:00:00Z',
): Uint8Array {
  const taken = new Set<string>()
  const sheets: SheetXml[] = []
  const claim = (title: string) => {
    const name = sheetName(title, taken)
    taken.add(name.toLowerCase())
    return name
  }
  if (info) sheets.push(infoSheet(info, claim(info.title)))
  for (const table of tables) sheets.push(tableSheet(table, claim(table.title)))

  const files: Record<string, Uint8Array> = {
    '[Content_Types].xml': strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
        `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
        `<Default Extension="xml" ContentType="application/xml"/>` +
        `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
        `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
        `<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>` +
        sheets
          .map(
            (_, i) =>
              `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
          )
          .join('') +
        `</Types>`,
    ),
    '_rels/.rels': strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="${PKG_REL}">` +
        `<Relationship Id="rId1" Type="${REL_NS}/officeDocument" Target="xl/workbook.xml"/>` +
        `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>` +
        `</Relationships>`,
    ),
    'docProps/core.xml': strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">` +
        `<dc:title>${xmlEscape(info?.title ?? 'Métrés')}</dc:title><dc:creator>Fabrics</dc:creator>` +
        `<dcterms:created xsi:type="dcterms:W3CDTF">${xmlEscape(createdIso)}</dcterms:created></cp:coreProperties>`,
    ),
    'xl/workbook.xml': strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<workbook xmlns="${NS}" xmlns:r="${REL_NS}"><bookViews><workbookView/></bookViews><sheets>` +
        sheets
          .map((s, i) => `<sheet name="${xmlEscape(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
          .join('') +
        `</sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`,
    ),
    'xl/_rels/workbook.xml.rels': strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="${PKG_REL}">` +
        sheets
          .map(
            (_, i) =>
              `<Relationship Id="rId${i + 1}" Type="${REL_NS}/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
          )
          .join('') +
        `<Relationship Id="rId${sheets.length + 1}" Type="${REL_NS}/styles" Target="styles.xml"/>` +
        `</Relationships>`,
    ),
    'xl/styles.xml': strToU8(STYLES_XML),
  }
  sheets.forEach((s, i) => {
    files[`xl/worksheets/sheet${i + 1}.xml`] = strToU8(s.xml)
  })
  return zipSync(files, { level: 6 })
}
