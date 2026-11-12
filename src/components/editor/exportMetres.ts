import { buildMetresPdf, type PlanThumbnail } from '../../features/export/metresPdf'
import { exportFileName } from '../../features/export/fileName'
import { sheetSize, type Orientation, type SheetFormat } from '../../features/export/pdfLayout'
import { elementsOfLevel } from '../../features/documents/levels'
import {
  measurementsToCsv,
  measurementsToFlatCsv,
  type CsvLabels,
  type CsvMeta,
  type FurnitureCsvRow,
} from '../../features/measurements/csv'
import {
  computeBuildingMeasurements,
  restrictToLevel,
} from '../../features/measurements/measurements'
import { buildClientTables, clientMetaLabels } from '../../features/measurements/clientView'
import { isBlockingWarning, metresWarnings } from '../../features/measurements/warnings'
import { buildExecutionTables } from '../../features/measurements/executionView'
import type { MetresTable, MetresVersion } from '../../features/measurements/tables'
import { buildBuildingModel } from '../../features/building/model'
import { levelPlanDrawing } from '../../features/building/views/drawing'
import { fr } from '../../i18n/fr'
import { formatDate } from '../../lib/date'
import { downloadBlob } from '../../lib/download'
import type { Project } from '../../types/document'
import { furnitureCsvRows } from '../library/furnitureRows'

export type MetresFormat = 'tables' | 'flat' | 'xlsx' | 'pdf'
export type MetresScope = 'building' | 'level'
export type { MetresVersion }

/** Le niveau demandé n'existe plus (supprimé depuis l'ouverture de la fenêtre) : l'export s'arrête. */
export class MetresLevelMissingError extends Error {
  constructor() {
    super(fr.export.metres.levelMissing)
    this.name = 'MetresLevelMissingError'
  }
}

/** Une pièce laisse un manque ou déborde des murs : l'export est refusé tant que ce n'est pas corrigé (D55). */
export class MetresCoverageError extends Error {
  constructor() {
    super(fr.measurements.warnings.blockedTitle)
    this.name = 'MetresCoverageError'
  }
}

/** Suffixe ajouté au nom de fichier selon la version (« -client » ou « -execution »). */
export const VERSION_FILE_SUFFIX: Record<MetresVersion, string> = {
  client: '-client',
  execution: '-execution',
}

export interface MetresExportOptions {
  format: MetresFormat
  /** Version du document ; absent : Exécution (le détail complet, comme avant M10 ter). */
  version?: MetresVersion
  /** Tout le bâtiment, ou seulement le niveau affiché. */
  scope: MetresScope
  includeFurniture: boolean
  /** Niveau affiché (pour `scope: 'level'`). */
  activeLevelId: string | null
  /** Nom saisi par l'utilisateur (l'extension est ajoutée si besoin). */
  fileName: string
  /** Réglages du PDF. */
  sheet: SheetFormat
  orientation: Orientation
}

/**
 * Quantités du projet sans calcul de prix : métrés du bâtiment (ou d'un niveau) prêts à exporter.
 * Lance `MetresLevelMissingError` si le niveau demandé n'existe pas, `MetresCoverageError` si une
 * pièce laisse un manque ou déborde des murs (export refusé, D55).
 */
export function prepareMetres(project: Project, options: Pick<MetresExportOptions, 'scope' | 'includeFurniture' | 'activeLevelId'>) {
  const doc = project.document
  let building = computeBuildingMeasurements(doc)
  let furnitureSource = doc.elements
  if (options.scope === 'level') {
    const restricted = options.activeLevelId ? restrictToLevel(building, options.activeLevelId) : null
    if (!restricted || !options.activeLevelId) throw new MetresLevelMissingError()
    building = restricted
    furnitureSource = elementsOfLevel(doc.elements, options.activeLevelId)
  }
  if (metresWarnings(doc, building).some(isBlockingWarning)) throw new MetresCoverageError()
  const furniture: FurnitureCsvRow[] = options.includeFurniture ? furnitureCsvRows(furnitureSource) : []
  return { building, furniture }
}

/**
 * Vignettes du plan pour le PDF Client : une par niveau qui a des murs (portée « bâtiment », du
 * plus bas au plus haut), ou celle du niveau exporté.
 */
function planThumbnails(project: Project, building: ReturnType<typeof prepareMetres>['building']): PlanThumbnail[] {
  const doc = project.document
  const model = buildBuildingModel(doc)
  const shown = new Set(building.levels.map((entry) => entry.level.id))
  const levels = [...(doc.levels ?? [])]
    .filter((level) => shown.has(level.id))
    .sort((a, b) => a.elevation - b.elevation)
  const thumbnails: PlanThumbnail[] = []
  for (const level of levels) {
    const drawing = levelPlanDrawing(model, level)
    if (drawing) thumbnails.push({ drawing, caption: fr.measurements.client.planCaption(level.name) })
  }
  return thumbnails
}

/** Les tableaux de la version demandée. */
export function metresTables(
  building: ReturnType<typeof prepareMetres>['building'],
  furniture: ReturnType<typeof prepareMetres>['furniture'],
  version: MetresVersion,
  scope: MetresScope = 'building',
): MetresTable[] {
  const labels = fr.measurements.csv
  return version === 'client'
    ? buildClientTables(building, fr.measurements.client, scope)
    : buildExecutionTables(building, labels, furniture, fr.measurements.execution)
}

/** Exporte les métrés du projet (CSV en tableaux, CSV à plat, Excel ou PDF) et fait télécharger le fichier. */
export async function exportMetres(project: Project, options: MetresExportOptions): Promise<void> {
  const { building, furniture } = prepareMetres(project, options)
  const version = options.version ?? 'execution'
  const client = version === 'client'
  // En-tête des fichiers : la version Client a son titre et sa remarque, sans la note technique.
  const labels: CsvLabels = client && fr.measurements.csv.meta
    ? { ...fr.measurements.csv, meta: clientMetaLabels(fr.measurements.csv.meta, fr.measurements.client) }
    : fr.measurements.csv
  const tables = metresTables(building, furniture, version, options.scope)
  const date = formatDate(new Date())
  const meta: CsvMeta = { projectName: project.name, date }
  const suffix = VERSION_FILE_SUFFIX[version]

  if (options.format === 'pdf') {
    const sheet = sheetSize(options.sheet, options.orientation)
    const blob = await buildMetresPdf(tables, sheet, {
      title: client ? fr.measurements.client.pdfTitle : fr.measurements.pdf.title,
      units: `${labels.meta?.units ?? ''} : ${labels.meta?.unitsValue ?? ''}`,
      note: client ? fr.measurements.client.pdfNote : (labels.meta?.noteValue ?? ''),
      continued: fr.measurements.pdf.continued,
      cartouche: {
        projectName: project.name,
        subtitle: client ? fr.measurements.client.pdfTitle : fr.measurements.pdf.title,
        dateLabel: fr.measurements.pdf.dateLabel,
        date,
        sheetLabel: fr.measurements.pdf.sheetLabel,
        sheet: options.sheet.toUpperCase(),
        pageLabel: fr.measurements.pdf.pageLabel,
      },
    }, client ? planThumbnails(project, building) : [])
    downloadBlob(blob, exportFileName(options.fileName, 'pdf', fr.measurements.csvFallbackName, suffix))
    return
  }

  if (options.format === 'xlsx') {
    // Chargé à la demande : le code du fichier Excel ne pèse que lorsqu'on l'exporte.
    const { buildMetresXlsx } = await import('../../features/export/metresXlsx')
    const m = labels.meta
    const bytes = buildMetresXlsx(
      tables,
      m && {
        title: m.title,
        rows: [
          [m.project, project.name],
          [m.date, date],
          [m.app, m.appName],
          [m.units, m.unitsValue],
          [m.note, m.noteValue],
        ],
      },
      new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
    )
    downloadBlob(
      new Blob([bytes as BlobPart], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
      exportFileName(options.fileName, 'xlsx', fr.measurements.csvFallbackName, suffix),
    )
    return
  }

  const csv =
    options.format === 'flat' && version === 'execution'
      ? measurementsToFlatCsv(building, labels, furniture)
      : measurementsToCsv(building, labels, furniture, meta, tables)
  downloadBlob(
    new Blob([csv], { type: 'text/csv;charset=utf-8' }),
    exportFileName(options.fileName, 'csv', fr.measurements.csvFallbackName, suffix),
  )
}
