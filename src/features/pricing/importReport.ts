/**
 * Rapport d'import des prix (M23, 23.2) : chaque correction, ligne ignorée ou écart est signalé,
 * jamais fait en silence (D23-5). Les messages sont regroupés par type, avec des exemples.
 */

export type ImportIssueCode =
  // Bloquants (rien n'est importé).
  | 'notXlsx'
  | 'tooLarge'
  | 'noKnownSheet'
  | 'currencyMismatch'
  | 'csvHeaderMissing'
  // Avertissements (ligne importée ou ignorée, à vérifier).
  | 'sheetMissing'
  | 'priceMissing'
  | 'zeroPrice'
  | 'unitMissing'
  | 'unitUnknown'
  | 'duplicateKey'
  | 'workWithoutDetail'
  | 'detailWithoutWork'
  | 'detailTotalGap'
  | 'csvRowInvalid'
  | 'htColumnGap'
  // Informations (corrections faites et hypothèses).
  | 'decimalsRounded'
  | 'unitNormalized'
  | 'linkFixed'
  | 'spacesTrimmed'
  | 'htFromTtc'
  | 'vatExemptDetected'
  | 'purchasePriceUsed'
  | 'assumedHt'
  | 'referenceWithCoefficient'
  | 'unitPriceWithoutCoefficient'
  | 'categoryRowsSkipped'
  | 'emptyComponentsSkipped'

export type IssueLevel = 'blocking' | 'warning' | 'info'

const BLOCKING: ReadonlySet<ImportIssueCode> = new Set([
  'notXlsx',
  'tooLarge',
  'noKnownSheet',
  'currencyMismatch',
  'csvHeaderMissing',
])

const WARNINGS: ReadonlySet<ImportIssueCode> = new Set([
  'sheetMissing',
  'priceMissing',
  'zeroPrice',
  'unitMissing',
  'unitUnknown',
  'duplicateKey',
  'workWithoutDetail',
  'detailWithoutWork',
  'detailTotalGap',
  'csvRowInvalid',
  'htColumnGap',
])

export function issueLevel(code: ImportIssueCode): IssueLevel {
  if (BLOCKING.has(code)) return 'blocking'
  return WARNINGS.has(code) ? 'warning' : 'info'
}

/** Un exemple : feuille, ligne, détail (texte libre court). */
export interface IssueExample {
  sheet: string
  row: number
  detail: string
}

export interface ImportIssue {
  code: ImportIssueCode
  level: IssueLevel
  count: number
  examples: IssueExample[]
}

/** Nombre d'exemples gardés par type de message. */
const MAX_EXAMPLES = 5

export class ImportReportBuilder {
  private readonly issues = new Map<ImportIssueCode, ImportIssue>()

  add(code: ImportIssueCode, sheet = '', row = 0, detail = ''): void {
    let issue = this.issues.get(code)
    if (!issue) {
      issue = { code, level: issueLevel(code), count: 0, examples: [] }
      this.issues.set(code, issue)
    }
    issue.count++
    if (issue.examples.length < MAX_EXAMPLES && (sheet || detail)) issue.examples.push({ sheet, row, detail })
  }

  /** Bloquants d'abord, puis avertissements, puis informations. */
  list(): ImportIssue[] {
    const order: Record<IssueLevel, number> = { blocking: 0, warning: 1, info: 2 }
    return [...this.issues.values()].sort((a, b) => order[a.level] - order[b.level])
  }
}

export function hasBlocking(issues: readonly ImportIssue[]): boolean {
  return issues.some((issue) => issue.level === 'blocking')
}
