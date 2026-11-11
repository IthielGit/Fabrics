import { useMemo, useState } from 'react'
import { PAPER_TEXT_MM, type Drawing } from '../../features/building/views/drawing'
import { cartoucheFields } from '../../features/export/cartouche'
import { buildDrawingPdf } from '../../features/export/pdf'
import { exportFileName } from '../../features/export/fileName'
import {
  defaultOrientation,
  planPdfPlacement,
  PLAN_SCALES,
  sheetSize,
  type Orientation,
  type ScaleChoice,
  type SheetFormat,
} from '../../features/export/pdfLayout'
import { fr } from '../../i18n/fr'
import { formatDate } from '../../lib/date'
import { downloadBlob } from '../../lib/download'
import { useEditorStore } from '../../stores/editorStore'
import Button from '../ui/Button'
import Choice from '../ui/Choice'
import Group from '../ui/ChoiceGroup'
import Modal from '../ui/Modal'

interface ViewsPdfDialogProps {
  /** Construit le dessin avec une hauteur de texte donnée (mm réels) ; sans argument, hauteur automatique. */
  build: (fontMm?: number) => Drawing | null
  /** Titre de la vue (« Façade Nord », « Coupe A–A », « Planche »). */
  viewTitle: string
  /** Vrai pour la planche (qui contient des plans) : le cartouche montre la flèche du nord. */
  showNorth?: boolean
  onClose: () => void
}

const todayText = () => formatDate(new Date())

const EMPTY_DRAWING: Drawing = { width: 1, height: 1, polygons: [], lines: [], texts: [] }

/** Fenêtre « Exporter en PDF » de l'écran Vues : feuille, orientation, échelle, nom du fichier. */
export default function ViewsPdfDialog({ build, viewTitle, showNorth = false, onClose }: ViewsPdfDialogProps) {
  const projectName = useEditorStore((state) => state.project?.name ?? '')
  const northAngle = useEditorStore((state) => state.project?.document.plan?.northAngle ?? 0)
  const base = useMemo(() => build() ?? EMPTY_DRAWING, [build])

  const [fileName, setFileName] = useState(`${projectName} ${viewTitle}`.trim())
  const [sheet, setSheet] = useState<SheetFormat>('a4')
  const [orientation, setOrientation] = useState<Orientation>(() =>
    defaultOrientation(base.width, base.height),
  )
  const [scale, setScale] = useState<ScaleChoice>(() => {
    // La plus grande échelle standard qui tient sur une feuille A4 ; sinon « Ajuster ».
    const size = sheetSize('a4', defaultOrientation(base.width, base.height))
    return planPdfPlacement({ width: base.width, height: base.height }, size, 50).fittingScale ?? 'fit'
  })
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  const size = sheetSize(sheet, orientation)
  // Les textes ont la même hauteur sur le papier (environ 7 pt) quelle que soit l'échelle : on
  // reconstruit le dessin avec la hauteur réelle qui donne cette hauteur à l'échelle choisie.
  const nominalScale =
    scale === 'fit' ? planPdfPlacement({ width: base.width, height: base.height }, size, 'fit').scale : scale
  const fontMm = PAPER_TEXT_MM * nominalScale
  const drawing = useMemo(() => build(fontMm) ?? EMPTY_DRAWING, [build, fontMm])
  const placement = planPdfPlacement({ width: drawing.width, height: drawing.height }, size, scale)
  const doesNotFit = !placement.fits

  const submit = async () => {
    setBusy(true)
    setFailed(false)
    try {
      const blob = await buildDrawingPdf(drawing, size, placement.rect, placement.scale, {
        projectName,
        subtitle: viewTitle,
        fields: cartoucheFields(
          {
            exactScale: placement.exact,
            denominator: Math.round(placement.scale),
            date: todayText(),
            format: sheet,
          },
          fr.export.cartouche,
        ),
        scaleBarUnit: fr.export.cartouche.scaleBarUnit,
        northAngle: showNorth ? northAngle : undefined,
        northLabel: fr.viewer3d.cardinal.north,
      })
      downloadBlob(blob, exportFileName(fileName, 'pdf', fr.views.pdfFallbackName))
      onClose()
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={fr.views.pdfTitle(viewTitle)} onClose={onClose}>
      <div className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="views-pdf-name" className="text-sm font-medium text-slate-900">
            {fr.export.fileName}
          </label>
          <div className="flex items-center gap-2">
            <input
              id="views-pdf-name"
              type="text"
              value={fileName}
              maxLength={200}
              onChange={(event) => setFileName(event.target.value)}
              className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <span className="text-sm text-slate-500">.pdf</span>
          </div>
        </div>

        <Group label={fr.export.sheet}>
          <Choice name="views-sheet" checked={sheet === 'a4'} onSelect={() => setSheet('a4')}>
            A4
          </Choice>
          <Choice name="views-sheet" checked={sheet === 'a3'} onSelect={() => setSheet('a3')}>
            A3
          </Choice>
        </Group>
        <Group label={fr.export.orientation}>
          <Choice
            name="views-orientation"
            checked={orientation === 'portrait'}
            onSelect={() => setOrientation('portrait')}
          >
            {fr.export.portrait}
          </Choice>
          <Choice
            name="views-orientation"
            checked={orientation === 'landscape'}
            onSelect={() => setOrientation('landscape')}
          >
            {fr.export.landscape}
          </Choice>
        </Group>
        <Group label={fr.export.scale}>
          {PLAN_SCALES.map((value) => (
            <Choice key={value} name="views-scale" checked={scale === value} onSelect={() => setScale(value)}>
              {fr.export.scaleOption(value)}
            </Choice>
          ))}
          <Choice name="views-scale" checked={scale === 'fit'} onSelect={() => setScale('fit')}>
            {fr.export.scaleFit}
          </Choice>
        </Group>

        {doesNotFit && (
          <p role="alert" className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
            {fr.views.pdfDoesNotFit(typeof scale === 'number' ? scale : 0)}
            {placement.fittingScale !== null
              ? fr.export.scaleSuggestion(placement.fittingScale)
              : fr.export.scaleNoSuggestion}
          </p>
        )}
        {scale === 'fit' && (
          <p className="text-sm text-slate-600">{fr.export.scaleFitNote(Math.round(placement.scale))}</p>
        )}
        {scale !== 'fit' && <p className="text-xs text-slate-500">{fr.export.printHint}</p>}
        {failed && (
          <p role="alert" className="text-sm text-red-600">
            {fr.export.failed}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button onClick={onClose}>{fr.common.cancel}</Button>
          <Button variant="primary" onClick={submit} disabled={busy || doesNotFit}>
            {busy ? fr.export.working : fr.export.submit}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
