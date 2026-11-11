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
import { buildMetresTables } from '../../features/measurements/tables'
import { fr } from '../../i18n/fr'
import { formatDate } from '../../lib/date'
import { downloadBlob } from '../../lib/download'
import type { Project } from '../../types/document'
import { furnitureCsvRows } from '../library/furnitureRows'

export type MetresFormat = 'tables' | 'flat' | 'xlsx' | 'pdf'
export type MetresScope = 'building' | 'level'

export interface MetresExportOptions {
  format: MetresFormat
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

/** Exporte les métrés du projet (CSV en tableaux, CSV à plat, Excel ou PDF) et fait télécharger le fichier. */
export async function exportMetres(project: Project, options: MetresExportOptions): Promise<void> {
  const { building, furniture } = prepareMetres(project, options)
  const labels = fr.measurements.csv
  const date = formatDate(new Date())
  const meta: CsvMeta = { projectName: project.name, date }

  if (options.format === 'pdf') {
    const sheet = sheetSize(options.sheet, options.orientation)
    const blob = await buildMetresPdf(buildMetresTables(building, labels, furniture), sheet, {
      title: fr.measurements.pdf.title,
      units: `${labels.meta?.units ?? ''} : ${labels.meta?.unitsValue ?? ''}`,
      note: labels.meta?.noteValue ?? '',
      continued: fr.measurements.pdf.continued,
      cartouche: {
        projectName: project.name,
        subtitle: fr.measurements.pdf.title,
        dateLabel: fr.measurements.pdf.dateLabel,
        date,
        sheetLabel: fr.measurements.pdf.sheetLabel,
        sheet: options.sheet.toUpperCase(),
        pageLabel: fr.measurements.pdf.pageLabel,
      },
    })
    downloadBlob(blob, exportFileName(options.fileName, 'pdf', fr.measurements.csvFallbackName))
    return
  }

  if (options.format === 'xlsx') {
    // Chargé à la demande : le code du fichier Excel ne pèse que lorsqu'on l'exporte.
    const { buildMetresXlsx } = await import('../../features/export/metresXlsx')
    const m = labels.meta
    const bytes = buildMetresXlsx(
      buildMetresTables(building, labels, furniture),
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
    options.format === 'flat'
      ? measurementsToFlatCsv(building, labels, furniture)
      : measurementsToCsv(building, labels, furniture, meta)
  downloadBlob(
    new Blob([csv], { type: 'text/csv;charset=utf-8' }),
    exportFileName(options.fileName, 'csv', fr.measurements.csvFallbackName),
  )
}
