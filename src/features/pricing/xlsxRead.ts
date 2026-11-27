/**
 * Lecture d'un classeur Excel (.xlsx) pour l'import des prix (M23, 23.2), sans nouvelle dépendance :
 * le fichier est un zip (ouvert avec `fflate`, déjà utilisé) de fichiers XML lus ici.
 *
 * - Les nombres sont gardés **tels qu'écrits dans le fichier** (texte décimal) : aucun passage par un
 *   nombre à virgule flottante avant la conversion exacte en dixièmes d'Ariary.
 * - Une cellule calculée (formule) donne sa dernière valeur enregistrée par Excel.
 * - Aucun contenu n'est exécuté ; une feuille trop grande est refusée.
 */
import { strFromU8, unzipSync } from 'fflate'

export type Cell =
  | { kind: 'number'; raw: string }
  | { kind: 'string'; text: string }
  | { kind: 'bool'; value: boolean }
  | { kind: 'error'; code: string }

/** Une feuille : lignes et colonnes numérotées à partir de 1 (A1 = ligne 1, colonne 1). */
export interface Sheet {
  name: string
  cells: Map<number, Map<number, Cell>>
  maxRow: number
}

export interface Workbook {
  sheets: Sheet[]
}

/** Limites de sécurité (fichier fourni par l'utilisateur). */
export const XLSX_LIMITS = { maxFileBytes: 30 * 1024 * 1024, maxXmlBytes: 80 * 1024 * 1024, maxCells: 2_000_000 }

export class XlsxError extends Error {
  readonly code: 'notXlsx' | 'tooLarge' | 'corrupt'
  constructor(code: 'notXlsx' | 'tooLarge' | 'corrupt') {
    super(code)
    this.code = code
    this.name = 'XlsxError'
  }
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }

export function decodeXml(text: string): string {
  return text.replace(/&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g, (_, entity: string) => {
    if (entity.startsWith('#x')) return String.fromCodePoint(parseInt(entity.slice(2), 16))
    if (entity.startsWith('#')) return String.fromCodePoint(parseInt(entity.slice(1), 10))
    return ENTITIES[entity]
  })
}

/** Texte d'un élément `<si>` ou `<is>` : ses `<t>`, sans les annotations phonétiques `<rPh>`. */
function richText(xml: string): string {
  const withoutPhonetic = xml.replace(/<rPh\b[\s\S]*?<\/rPh>/g, '')
  let text = ''
  for (const match of withoutPhonetic.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>|<t(?:\s[^>]*)?\/>/g)) {
    text += decodeXml(match[1] ?? '')
  }
  return text
}

function sharedStrings(xml: string | undefined): string[] {
  if (!xml) return []
  return [...xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>|<si\b[^>]*\/>/g)].map((m) => richText(m[1] ?? ''))
}

/** « BC12 » → { col: 55, row: 12 }. */
export function cellRef(ref: string): { col: number; row: number } | null {
  const match = /^([A-Z]+)(\d+)$/.exec(ref)
  if (!match) return null
  let col = 0
  for (const ch of match[1]) col = col * 26 + (ch.charCodeAt(0) - 64)
  return { col, row: Number(match[2]) }
}

function attr(attrs: string, name: string): string | undefined {
  return new RegExp(`(?:^|\\s)${name}="([^"]*)"`).exec(attrs)?.[1]
}

function parseSheet(name: string, xml: string, strings: string[], budget: { cells: number }): Sheet {
  const cells = new Map<number, Map<number, Cell>>()
  let maxRow = 0
  let implicitRow = 0
  for (const rowMatch of xml.matchAll(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)) {
    const rowNumber = Number(attr(rowMatch[1], 'r') ?? implicitRow + 1)
    implicitRow = rowNumber
    const body = rowMatch[2]
    if (!body) continue
    let implicitCol = 0
    for (const cellMatch of body.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = cellMatch[1]
      const ref = attr(attrs, 'r')
      const position = ref ? cellRef(ref) : { col: implicitCol + 1, row: rowNumber }
      if (!position) continue
      implicitCol = position.col
      const inner = cellMatch[2] ?? ''
      const type = attr(attrs, 't') ?? 'n'
      const value = /<v>([\s\S]*?)<\/v>/.exec(inner)?.[1]
      let cell: Cell | null = null
      if (type === 'inlineStr') {
        const is = /<is>([\s\S]*?)<\/is>/.exec(inner)?.[1]
        if (is !== undefined) cell = { kind: 'string', text: richText(is) }
      } else if (value !== undefined) {
        if (type === 's') cell = { kind: 'string', text: strings[Number(value)] ?? '' }
        else if (type === 'str') cell = { kind: 'string', text: decodeXml(value) }
        else if (type === 'b') cell = { kind: 'bool', value: value === '1' }
        else if (type === 'e') cell = { kind: 'error', code: decodeXml(value) }
        else cell = { kind: 'number', raw: value.trim() }
      }
      if (!cell) continue
      if (++budget.cells > XLSX_LIMITS.maxCells) throw new XlsxError('tooLarge')
      let row = cells.get(position.row)
      if (!row) cells.set(position.row, (row = new Map()))
      row.set(position.col, cell)
      if (position.row > maxRow) maxRow = position.row
    }
  }
  return { name, cells, maxRow }
}

/** Chemin d'une cible de relation, relatif au dossier `xl/`. */
function resolveTarget(target: string): string {
  const clean = target.replace(/^\//, '')
  return clean.startsWith('xl/') ? clean : `xl/${clean}`
}

/** Ouvre un classeur. Erreurs nommées : `notXlsx`, `tooLarge`, `corrupt`. */
export function readXlsx(bytes: Uint8Array): Workbook {
  if (bytes.byteLength > XLSX_LIMITS.maxFileBytes) throw new XlsxError('tooLarge')
  // Signature d'un zip : « PK\x03\x04 ».
  if (bytes.byteLength < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw new XlsxError('notXlsx')
  let files: Record<string, Uint8Array>
  try {
    let total = 0
    files = unzipSync(bytes, {
      filter: (file) => {
        const wanted =
          file.name === 'xl/workbook.xml' ||
          file.name === 'xl/_rels/workbook.xml.rels' ||
          file.name === 'xl/sharedStrings.xml' ||
          /^xl\/worksheets\/[^/]+\.xml$/.test(file.name)
        if (wanted) total += file.originalSize
        if (total > XLSX_LIMITS.maxXmlBytes) throw new XlsxError('tooLarge')
        return wanted
      },
    })
  } catch (error) {
    if (error instanceof XlsxError) throw error
    throw new XlsxError('notXlsx')
  }
  const workbookXml = files['xl/workbook.xml']
  const relsXml = files['xl/_rels/workbook.xml.rels']
  if (!workbookXml || !relsXml) throw new XlsxError('notXlsx')

  const rels = new Map<string, string>()
  for (const match of strFromU8(relsXml).matchAll(/<Relationship\b([^>]*)\/?>/g)) {
    const id = attr(match[1], 'Id')
    const target = attr(match[1], 'Target')
    if (id && target) rels.set(id, resolveTarget(target))
  }
  const strings = sharedStrings(files['xl/sharedStrings.xml'] ? strFromU8(files['xl/sharedStrings.xml']) : undefined)
  const budget = { cells: 0 }
  const sheets: Sheet[] = []
  for (const match of strFromU8(workbookXml).matchAll(/<sheet\b([^>]*)\/?>/g)) {
    const name = decodeXml(attr(match[1], 'name') ?? '')
    const relId = attr(match[1], 'r:id')
    const path = relId ? rels.get(relId) : undefined
    const xml = path ? files[path] : undefined
    if (!xml) continue
    sheets.push(parseSheet(name, strFromU8(xml), strings, budget))
  }
  if (sheets.length === 0) throw new XlsxError('corrupt')
  return { sheets }
}

/** Texte d'une cellule (un nombre donne son écriture brute) ; `''` si vide. */
export function cellText(sheet: Sheet, row: number, col: number): string {
  const cell = sheet.cells.get(row)?.get(col)
  if (!cell) return ''
  if (cell.kind === 'string') return cell.text
  if (cell.kind === 'number') return cell.raw
  if (cell.kind === 'bool') return cell.value ? 'VRAI' : 'FAUX'
  return ''
}

/** Écriture décimale d'une cellule nombre (ou d'un texte qui en est un) ; `null` sinon. */
export function cellNumber(sheet: Sheet, row: number, col: number): string | null {
  const cell = sheet.cells.get(row)?.get(col)
  if (!cell) return null
  if (cell.kind === 'number') return cell.raw
  if (cell.kind === 'string') {
    const normalized = cell.text.replace(/[\s  ]/g, '').replace(',', '.')
    return /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(normalized) ? normalized : null
  }
  return null
}

/** Date Excel (numéro de série, calendrier 1900) → « AAAA-MM-JJ ». */
export function excelSerialToIso(raw: string): string | null {
  const serial = Number(raw)
  if (!Number.isFinite(serial) || serial < 1 || serial > 2958465) return null
  const days = Math.floor(serial)
  // Le 1er janvier 1900 vaut 1 ; Excel compte un faux 29 février 1900 : origine au 30 décembre 1899.
  const ms = Date.UTC(1899, 11, 30) + days * 86_400_000
  return new Date(ms).toISOString().slice(0, 10)
}
