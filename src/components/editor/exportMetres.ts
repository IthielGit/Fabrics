import { buildMetresPdf } from '../../features/export/metresPdf'
import { exportFileName } from '../../features/export/fileName'
import { sheetSize, type Orientation, type SheetFormat } from '../../features/export/pdfLayout'
import { elementsOfLevel } from '../../features/documents/levels'
import {
  measurementsToCsv,
  measurementsToFlatCsv,
  type CsvMeta,
  type FurnitureCsvRow,
} from '../../features/measurements/csv'
import {
  computeBuildingMeasurements,
  restrictToLevel,
} from '../../features/measurements/measurements'
import { buildClientTables } from '../../features/measurements/clientView'
import { buildExecutionTables } from '../../features/measurements/executionView'
import type { MetresTable } from '../../features/measurements/tables'
import { buildBuildingModel } from '../../features/building/model'
import { levelPlanDrawing, type Drawing } from '../../features/building/views/drawing'
import { fr } from '../../i18n/fr'
import { formatDate } from '../../lib/date'
import { downloadBlob } from '../../lib/download'
import type { Project } from '../../types/document'
import { furnitureCsvRows } from '../library/furnitureRows'

export type MetresFormat = 'tables' | 'flat' | 'xlsx' | 'pdf'
export type MetresScope = 'building' | 'level'
/** Client : surfaces au sol simples ; Exécution : tous les détails et les règles de calcul (M10 ter). */
export type MetresVersion = 'client' | 'execution'

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

/** Quantités du projet sans calcul de prix : métrés du bâtiment (ou d'un niveau) prêts à exporter. */
export function prepareMetres(project: Project, options: Pick<MetresExportOptions, 'scope' | 'includeFurniture' | 'activeLevelId'>) {
  const doc = project.document
  let building = computeBuildingMeasurements(doc)
  let furnitureSource = doc.elements
  if (options.scope === 'level' && options.activeLevelId) {
    building = restrictToLevel(building, options.activeLevelId)
    furnitureSource = elementsOfLevel(doc.elements, options.activeLevelId)
  }
  const furniture: FurnitureCsvRow[] = options.includeFurniture ? furnitureCsvRows(furnitureSource) : []
  return { building, furniture }
}

/** Vignette du plan du premier niveau qui contient des murs ou des pièces (PDF Client). */
function planThumbnail(project: Project, levelId: string | null): Drawing | null {
  const doc = project.document
  const model = buildBuildingModel(doc)
  const levels = [...(doc.levels ?? [])].sort((a, b) => a.elevation - b.elevation)
  const ordered = levelId ? [...levels.filter((l) => l.id === levelId), ...levels] : levels
  for (const level of ordered) {
    const drawing = levelPlanDrawing(model, level)
    if (drawing) return drawing
  }
  return null
}

/** Les tableaux de la version demandée. */
export function metresTables(
  building: ReturnType<typeof prepareMetres>['building'],
  furniture: ReturnType<typeof prepareMetres>['furniture'],
  version: MetresVersion,
): MetresTable[] {
  const labels = fr.measurements.csv
  return version === 'client'
    ? buildClientTables(building, fr.measurements.client)
    : buildExecutionTables(building, labels, furniture, fr.measurements.execution)
}

/** Exporte les métrés du projet (CSV en tableaux, CSV à plat, Excel ou PDF) et fait télécharger le fichier. */
export async function exportMetres(project: Project, options: MetresExportOptions): Promise<void> {
  const { building, furniture } = prepareMetres(project, options)
  const labels = fr.measurements.csv
  const version = options.version ?? 'execution'
  const tables = metresTables(building, furniture, version)
  const date = formatDate(new Date())
  const meta: CsvMeta = { projectName: project.name, date }

  if (options.format === 'pdf') {
    const sheet = sheetSize(options.sheet, options.orientation)
    const client = version === 'client'
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
    }, client ? planThumbnail(project, options.activeLevelId) : null)
    downloadBlob(blob, exportFileName(options.fileName, 'pdf', fr.measurements.csvFallbackName))
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
      exportFileName(options.fileName, 'xlsx', fr.measurements.csvFallbackName),
    )
    return
  }

  const csv =
    options.format === 'flat' && version === 'execution'
      ? measurementsToFlatCsv(building, labels, furniture)
      : measurementsToCsv(building, labels, furniture, meta, tables)
  downloadBlob(
    new Blob([csv], { type: 'text/csv;charset=utf-8' }),
    exportFileName(options.fileName, 'csv', fr.measurements.csvFallbackName),
  )
}
