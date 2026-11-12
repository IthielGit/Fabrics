import { exportFileName, type ExportFileType } from '../../features/export/fileName'
import { planExportExtent } from '../../features/export/bounds'
import { imageExportSize, pdfRasterSize } from '../../features/export/limits'
import { cartoucheFields } from '../../features/export/cartouche'
import { buildDesignPdf, buildPlanPdf } from '../../features/export/pdf'
import { formatDate } from '../../lib/date'
import {
  designPdfPlacement,
  planPdfPlacement,
  sheetSize,
  type Orientation,
  type ScaleChoice,
  type SheetFormat,
} from '../../features/export/pdfLayout'
import { computeMeasurements } from '../../features/measurements/measurements'
import { planOverlay, regionWithOverlay } from '../../features/dimensioning/planOverlay'
import { EXECUTION_LABELS } from '../../i18n/dimensioningLabels'
import { formatArea } from '../../features/units/format'
import { fr } from '../../i18n/fr'
import { dataUrlToBlob } from '../../lib/dataUrl'
import { downloadBlob } from '../../lib/download'
import { selectActiveElements, useEditorStore } from '../../stores/editorStore'
import type { Project } from '../../types/document'
import { captureRegion } from './exportStage'
import { exportMetres, MetresCoverageError, type MetresExportOptions } from './exportMetres'
import { blockingSurfaceWarnings } from '../../features/measurements/warnings'

/** Hauteur des textes des cotes automatiques à l'écran (mm), pour estimer leur place. */
const AUTO_DIMENSION_FONT_MM = 180
/** Marge autour des cotes automatiques dans la zone exportée (mm). */
const AUTO_DIMENSION_MARGIN_MM = 300

export interface ExportOptions {
  type: ExportFileType
  /** Nom saisi par l'utilisateur (l'extension est ajoutée si besoin). */
  fileName: string
  /** Multiplicateur de résolution (PNG et JPG). */
  multiplier: number
  /** Réglages du PDF. */
  sheet: SheetFormat
  orientation: Orientation
  scale: ScaleChoice
  /** Réglages de l'export des métrés (type `csv`). */
  metres: Pick<MetresExportOptions, 'format' | 'version' | 'scope' | 'includeFurniture'>
}

/**
 * Exporte le projet ouvert et fait télécharger le fichier. Lance une erreur si l'export est
 * impossible (plan vide, plan qui ne tient pas sur la feuille, image refusée par le navigateur).
 */
export async function exportProject(project: Project, options: ExportOptions): Promise<void> {
  const { document: doc } = project
  const isPlan = project.kind === 'plan'
  const fallback = isPlan ? fr.export.planFallbackName : fr.export.designFallbackName
  const fileName = exportFileName(options.fileName, options.type, fallback)

  // Un plan s'exporte niveau par niveau (celui qui est affiché) ; le CSV couvre tout le bâtiment.
  const shownElements = isPlan ? selectActiveElements(useEditorStore.getState()) : doc.elements

  if (options.type === 'csv') {
    await exportMetres(project, {
      ...options.metres,
      activeLevelId: useEditorStore.getState().activeLevelId,
      fileName: options.fileName,
      sheet: options.sheet,
      orientation: options.orientation,
    })
    return
  }

  // Plan dont une pièce laisse un manque ou déborde des murs : export refusé (D55).
  if (isPlan && blockingSurfaceWarnings(doc, useEditorStore.getState().activeLevelId).length > 0) {
    throw new MetresCoverageError()
  }

  // Zone exportée : la page d'un Visuel, l'emprise du contenu d'un plan (cotes automatiques comprises).
  const { dimensioningMode, activeLevelId } = useEditorStore.getState()
  const extent = isPlan
    ? planExportExtent(shownElements)
    : { x: 0, y: 0, width: doc.page.width, height: doc.page.height }
  if (!extent) throw new Error(fr.export.planEmpty)
  const region =
    isPlan && activeLevelId !== null
      ? regionWithOverlay(
          extent,
          planOverlay(doc, activeLevelId, dimensioningMode, EXECUTION_LABELS, AUTO_DIMENSION_FONT_MM),
          AUTO_DIMENSION_MARGIN_MM,
        )
      : extent
  const background = doc.page.background

  if (options.type === 'png' || options.type === 'jpg') {
    const size = imageExportSize(region.width, region.height, doc.unit, options.multiplier)
    const dataUrl = await captureRegion(
      {
        region,
        widthPx: size.width,
        heightPx: size.height,
        mimeType: options.type === 'png' ? 'image/png' : 'image/jpeg',
        quality: 0.92,
        background,
      },
      isPlan,
    )
    downloadBlob(dataUrlToBlob(dataUrl), fileName)
    return
  }

  // PDF
  const sheet = sheetSize(options.sheet, options.orientation)
  if (!isPlan) {
    const placement = designPdfPlacement(
      doc.page.width,
      doc.page.height,
      options.sheet,
      options.orientation,
    )
    const { size } = pdfRasterSize(placement.width, placement.height)
    const dataUrl = await captureRegion(
      { region, widthPx: size.width, heightPx: size.height, mimeType: 'image/png', background },
      false,
    )
    downloadBlob(await buildDesignPdf(dataUrl, sheet, placement, project.name), fileName)
    return
  }

  const placement = planPdfPlacement(region, sheet, options.scale)
  if (!placement.fits) throw new Error(fr.export.failed)
  const { size } = pdfRasterSize(placement.rect.width, placement.rect.height)
  const dataUrl = await captureRegion(
    { region, widthPx: size.width, heightPx: size.height, mimeType: 'image/png', background },
    true,
  )
  const measurements = computeMeasurements(shownElements)
  const levelName = doc.levels?.find((l) => l.id === useEditorStore.getState().activeLevelId)?.name
  const areaText =
    measurements.rooms.length > 0
      ? fr.export.cartouche.area(formatArea(measurements.totals.roomArea))
      : undefined
  const blob = await buildPlanPdf(dataUrl, sheet, placement.rect, placement.scale, {
    projectName: project.name,
    subtitle: [levelName, areaText].filter(Boolean).join(' · ') || undefined,
    fields: cartoucheFields(
      {
        exactScale: placement.exact,
        denominator: Math.round(placement.scale),
        date: formatDate(new Date()),
        format: options.sheet,
      },
      fr.export.cartouche,
    ),
    scaleBarUnit: fr.export.cartouche.scaleBarUnit,
    northAngle: doc.plan?.northAngle ?? 0,
    northLabel: fr.viewer3d.cardinal.north,
    // Note sur les baies : imprimée sur tout document d'exécution (D39).
    note: dimensioningMode === 'execution' ? fr.dimensioning.baysNote : undefined,
  })
  downloadBlob(blob, fileName)
}
