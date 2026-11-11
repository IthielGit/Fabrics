import { useMemo, useState } from 'react'
import { planExportExtent } from '../../features/export/bounds'
import type { ExportFileType } from '../../features/export/fileName'
import { resolutionOptions } from '../../features/export/limits'
import {
  defaultOrientation,
  matchingSheetFormat,
  planPdfPlacement,
  PLAN_SCALES,
  sheetSize,
  type Orientation,
  type ScaleChoice,
  type SheetFormat,
} from '../../features/export/pdfLayout'
import { computeBuildingMeasurements } from '../../features/measurements/measurements'
import { fr } from '../../i18n/fr'
import { selectActiveElements, useEditorStore } from '../../stores/editorStore'
import Button from '../ui/Button'
import Choice from '../ui/Choice'
import Group from '../ui/ChoiceGroup'
import Modal from '../ui/Modal'
import { exportProject } from './exportProject'
import type { MetresFormat, MetresScope } from './exportMetres'

/** Fenêtre « Exporter » : PNG, JPG, PDF et, pour un plan, CSV des métrés. */
export default function ExportDialog({ onClose }: { onClose: () => void }) {
  const project = useEditorStore((state) => state.project)
  if (!project) return null
  // Le contenu est remis à zéro à chaque ouverture : la fenêtre est démontée à la fermeture.
  return <ExportForm key={project.id} onClose={onClose} />
}

function ExportForm({ onClose }: { onClose: () => void }) {
  const project = useEditorStore((state) => state.project)
  // Un plan s'exporte niveau par niveau : le niveau affiché. Le CSV couvre tout le bâtiment.
  const elements = useEditorStore(selectActiveElements)
  const document = project?.document
  const isPlan = project?.kind === 'plan'

  const extent = useMemo(
    () => (isPlan ? planExportExtent(elements) : null),
    [isPlan, elements],
  )
  const measurements = useMemo(
    () => computeBuildingMeasurements({ elements: document?.elements ?? [], levels: document?.levels }),
    [document?.elements, document?.levels],
  )
  const hasMeasures = measurements.total.rooms.length > 0 || measurements.total.walls.length > 0

  // Zone exportée, dans l'unité du document.
  const region = useMemo(() => {
    if (!project) return null
    if (isPlan) return extent
    return { x: 0, y: 0, width: project.document.page.width, height: project.document.page.height }
  }, [project, isPlan, extent])

  const options = useMemo(
    () =>
      region && project ? resolutionOptions(region.width, region.height, project.document.unit) : [],
    [region, project],
  )

  const [type, setType] = useState<ExportFileType>('png')
  const [fileName, setFileName] = useState(project?.name ?? '')
  const [multiplier, setMultiplier] = useState<number>(() =>
    options.find((o) => o.multiplier === 1 && o.allowed)
      ? 1
      : (options.find((o) => o.allowed)?.multiplier ?? 1),
  )
  const [sheet, setSheet] = useState<SheetFormat>(() =>
    project && !isPlan
      ? (matchingSheetFormat(project.document.page.width, project.document.page.height) ?? 'a4')
      : 'a4',
  )
  const [orientation, setOrientation] = useState<Orientation>(() =>
    region ? defaultOrientation(region.width, region.height) : 'portrait',
  )
  const [scale, setScale] = useState<ScaleChoice>(() => {
    const wanted = project?.document.plan?.scale
    return PLAN_SCALES.find((s) => s === wanted) ?? 50
  })
  // Métrés : présentation, périmètre et mobilier.
  const [metresFormat, setMetresFormat] = useState<MetresFormat>('tables')
  const [metresScope, setMetresScope] = useState<MetresScope>('building')
  const [includeFurniture, setIncludeFurniture] = useState(true)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  if (!project) return null

  const planPlacement =
    isPlan && region ? planPdfPlacement(region, sheetSize(sheet, orientation), scale) : null

  const emptyMessage =
    type === 'csv'
      ? hasMeasures
        ? null
        : fr.export.csvEmpty
      : isPlan && !extent
        ? fr.export.planEmpty
        : null
  // Les métrés en PDF ont leur propre mise en page : ni échelle ni emprise.
  const metresPdf = type === 'csv' && metresFormat === 'pdf'
  const fileExtension = type === 'csv' ? (metresFormat === 'pdf' ? 'pdf' : 'csv') : type
  const planDoesNotFit = type === 'pdf' && planPlacement !== null && !planPlacement.fits
  const selectedOption = options.find((o) => o.multiplier === multiplier)
  const tooBig = (type === 'png' || type === 'jpg') && selectedOption?.allowed === false
  const canSubmit = !busy && emptyMessage === null && !planDoesNotFit && !tooBig

  const handleSubmit = async () => {
    setBusy(true)
    setFailed(false)
    try {
      await exportProject(project, {
        type,
        fileName,
        multiplier,
        sheet,
        orientation,
        scale,
        metres: { format: metresFormat, scope: metresScope, includeFurniture },
      })
      onClose()
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  const types: { id: ExportFileType; label: string }[] = [
    { id: 'png', label: fr.export.formatPng },
    { id: 'jpg', label: fr.export.formatJpg },
    { id: 'pdf', label: fr.export.formatPdf },
    ...(isPlan ? [{ id: 'csv' as const, label: fr.export.formatCsv }] : []),
  ]

  return (
    <Modal title={fr.export.title} onClose={onClose}>
      <div className="space-y-4">
        <Group label={fr.export.format}>
          {types.map((item) => (
            <Choice
              key={item.id}
              name="export-format"
              checked={type === item.id}
              onSelect={() => setType(item.id)}
            >
              {item.label}
            </Choice>
          ))}
        </Group>
        <p className="-mt-2 text-xs text-slate-500">{fr.export.formatHint[type]}</p>

        <div className="space-y-1">
          <label htmlFor="export-file-name" className="text-sm font-medium text-slate-900">
            {fr.export.fileName}
          </label>
          <div className="flex items-center gap-2">
            <input
              id="export-file-name"
              type="text"
              value={fileName}
              maxLength={200}
              onChange={(event) => setFileName(event.target.value)}
              className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <span className="text-sm text-slate-500">.{fileExtension}</span>
          </div>
        </div>

        {(type === 'png' || type === 'jpg') && region && (
          <Group label={fr.export.resolution}>
            {options.map((option) => (
              <Choice
                key={option.multiplier}
                name="export-resolution"
                checked={multiplier === option.multiplier}
                disabled={!option.allowed}
                onSelect={() => setMultiplier(option.multiplier)}
              >
                <span className="font-medium">{fr.export.multiplier(option.multiplier)}</span>
                <span className="text-xs text-slate-500">
                  {fr.export.pixelSize(option.size.width, option.size.height)}
                </span>
              </Choice>
            ))}
          </Group>
        )}
        {tooBig && <p className="text-sm text-red-600">{fr.export.tooBig}</p>}

        {type === 'csv' && (
          <>
            <Group label={fr.export.metres.format}>
              {(['tables', 'flat', 'pdf'] as const).map((value) => (
                <Choice
                  key={value}
                  name="export-metres-format"
                  checked={metresFormat === value}
                  onSelect={() => {
                    setMetresFormat(value)
                    if (value === 'pdf') setOrientation('landscape')
                  }}
                >
                  {fr.export.metres[value]}
                </Choice>
              ))}
            </Group>
            <p className="-mt-2 text-xs text-slate-500">{fr.export.metres.hint[metresFormat]}</p>
            <Group label={fr.export.metres.scope}>
              <Choice
                name="export-metres-scope"
                checked={metresScope === 'building'}
                onSelect={() => setMetresScope('building')}
              >
                {fr.export.metres.building}
              </Choice>
              <Choice
                name="export-metres-scope"
                checked={metresScope === 'level'}
                onSelect={() => setMetresScope('level')}
              >
                {fr.export.metres.level}
              </Choice>
            </Group>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={includeFurniture}
                onChange={(event) => setIncludeFurniture(event.target.checked)}
              />
              {fr.export.metres.furniture}
            </label>
          </>
        )}

        {(type === 'pdf' || metresPdf) && (
          <>
            <Group label={fr.export.sheet}>
              <Choice name="export-sheet" checked={sheet === 'a4'} onSelect={() => setSheet('a4')}>
                A4
              </Choice>
              <Choice name="export-sheet" checked={sheet === 'a3'} onSelect={() => setSheet('a3')}>
                A3
              </Choice>
            </Group>
            <Group label={fr.export.orientation}>
              <Choice
                name="export-orientation"
                checked={orientation === 'portrait'}
                onSelect={() => setOrientation('portrait')}
              >
                {fr.export.portrait}
              </Choice>
              <Choice
                name="export-orientation"
                checked={orientation === 'landscape'}
                onSelect={() => setOrientation('landscape')}
              >
                {fr.export.landscape}
              </Choice>
            </Group>
          </>
        )}

        {type === 'pdf' && isPlan && planPlacement && (
          <>
            <Group label={fr.export.scale}>
              {PLAN_SCALES.map((value) => (
                <Choice
                  key={value}
                  name="export-scale"
                  checked={scale === value}
                  onSelect={() => setScale(value)}
                >
                  {fr.export.scaleOption(value)}
                </Choice>
              ))}
              <Choice name="export-scale" checked={scale === 'fit'} onSelect={() => setScale('fit')}>
                {fr.export.scaleFit}
              </Choice>
            </Group>
            {planDoesNotFit && (
              <p role="alert" className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
                {fr.export.scaleDoesNotFit(typeof scale === 'number' ? scale : 0)}
                {planPlacement.fittingScale !== null
                  ? fr.export.scaleSuggestion(planPlacement.fittingScale)
                  : fr.export.scaleNoSuggestion}
              </p>
            )}
            {scale === 'fit' && (
              <p className="text-sm text-slate-600">
                {fr.export.scaleFitNote(Math.round(planPlacement.scale))}
              </p>
            )}
            {scale !== 'fit' && <p className="text-xs text-slate-500">{fr.export.printHint}</p>}
          </>
        )}

        {emptyMessage && <p className="text-sm text-slate-600">{emptyMessage}</p>}
        {failed && (
          <p role="alert" className="text-sm text-red-600">
            {fr.export.failed}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button onClick={onClose}>{fr.common.cancel}</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!canSubmit}>
            {busy ? fr.export.working : fr.export.submit}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
