/**
 * Lecture d'un fichier de prix choisi par l'utilisateur (M23, 23.2) : classeur .xlsx ou fichier .csv.
 * Un fichier illisible donne un rapport avec un message bloquant, jamais une exception.
 */
import { importCsv } from './importCsv'
import { ImportReportBuilder } from './importReport'
import { importWorkbook, type ImportedLibrary } from './importWorkbook'
import { importLibraryWorkbook } from './libraryExport'
import { readXlsx, XLSX_LIMITS, XlsxError } from './xlsxRead'

export function readPriceFile(fileName: string, bytes: Uint8Array, vatRateBp: number): ImportedLibrary {
  const blocked = (code: 'notXlsx' | 'tooLarge') => {
    const report = new ImportReportBuilder()
    report.add(code, '', 0, fileName)
    return { priceItems: [], workItems: [], priceDate: null, issues: report.list() }
  }
  if (bytes.byteLength > XLSX_LIMITS.maxFileBytes) return blocked('tooLarge')
  if (/\.(csv|txt)$/i.test(fileName)) {
    return importCsv(new TextDecoder('utf-8').decode(bytes), vatRateBp)
  }
  // Classeurs à macros (.xlsm, .xlsb…) refusés : rien n'est jamais exécuté (D24-7).
  if (!/\.xlsx$/i.test(fileName)) return blocked('notXlsx')
  try {
    const workbook = readXlsx(bytes)
    // Classeur exporté par Fabrics (M24, 24.3) : relu à l'identique ; sinon classeur « Expert BTP ».
    return importLibraryWorkbook(workbook) ?? importWorkbook(workbook, vatRateBp)
  } catch (error) {
    if (error instanceof XlsxError) return blocked(error.code === 'tooLarge' ? 'tooLarge' : 'notXlsx')
    throw error
  }
}

/** Empreinte SHA-256 du fichier (journal des imports : retrouver le fichier exact). */
export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes as Uint8Array<ArrayBuffer>)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
