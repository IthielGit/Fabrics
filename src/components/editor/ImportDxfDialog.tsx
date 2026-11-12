import { useMemo, useState } from 'react'
import {
  DXF_UNIT_FACTORS,
  DxfReadError,
  dxfPathsToLines,
  dxfTextsToElements,
  parseDxfText,
  pathsExtent,
  placeImport,
  unitFromInsunits,
  type DxfUnit,
  type ParsedDxf,
} from '../../features/export/dxfImport'
import { PAGE_LIMITS } from '../../features/documents/pageSize'
import { clampZoom, FIT_PADDING, screenToDocument } from '../../features/geometry/viewport'
import { formatDecimal } from '../../features/units/format'
import { pxPerUnit } from '../../features/units/scale'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import Button from '../ui/Button'
import Choice from '../ui/Choice'
import Group from '../ui/ChoiceGroup'
import Modal from '../ui/Modal'

const UNITS: DxfUnit[] = ['mm', 'cm', 'm', 'in', 'ft']

type Reading = { parsed: ParsedDxf } | { error: DxfReadError['reason'] }

function read(text: string): Reading {
  try {
    return { parsed: parseDxfText(text) }
  } catch (error) {
    return { error: error instanceof DxfReadError ? error.reason : 'unreadable' }
  }
}

/**
 * Fenêtre « Importer un DXF » (M11) : unité du fichier (lue dans `$INSUNITS`, modifiable), taille
 * réelle du dessin en mm, nombre de traits, niveau d'arrivée. Le dessin est posé verrouillé, sous
 * les autres éléments, au centre de la vue.
 */
export default function ImportDxfDialog({
  fileName,
  text,
  onClose,
}: {
  fileName: string
  text: string
  onClose: () => void
}) {
  const reading = useMemo(() => read(text), [text])
  const parsed = 'parsed' in reading ? reading.parsed : null
  const declared = parsed ? unitFromInsunits(parsed.insUnits) : null
  const [unit, setUnit] = useState<DxfUnit>(declared ?? 'mm')
  const levelName = useEditorStore(
    (state) => state.project?.document.levels?.find((l) => l.id === state.activeLevelId)?.name ?? '',
  )

  const extent = useMemo(
    () =>
      parsed
        ? pathsExtent(
            parsed.paths.length > 0
              ? parsed.paths
              : [{ points: parsed.texts.flatMap((t) => [t.x, t.y]), closed: false }],
          )
        : null,
    [parsed],
  )
  const factor = DXF_UNIT_FACTORS[unit]
  const width = extent ? (extent.maxX - extent.minX) * factor : 0
  const height = extent ? (extent.maxY - extent.minY) * factor : 0

  const handleImport = () => {
    if (!parsed) return
    const store = useEditorStore.getState()
    const { project, viewportSize, zoom, stagePosition, activeLevelId } = store
    if (!project) return
    const ppu = pxPerUnit(project.document.unit)
    const viewCenter = screenToDocument(
      { x: viewportSize.width / 2, y: viewportSize.height / 2 },
      { zoom, x: stagePosition.x, y: stagePosition.y },
      ppu,
    )
    // Le dessin reste dans la page ; si elle est trop petite, on l'agrandit pour qu'il y tienne.
    const placement = placeImport(width, height, project.document.page, viewCenter, PAGE_LIMITS.mm.max)
    const center = placement.center
    if (placement.page) store.setPageSize(placement.page.width, placement.page.height)
    const meta = {
      name: fr.dxfImport.layerName(fileName),
      groupId: crypto.randomUUID(),
      ...(activeLevelId ? { levelId: activeLevelId } : {}),
    }
    const lines = dxfPathsToLines(parsed.paths, factor, center, meta, parsed.texts)
    const texts = dxfTextsToElements(parsed.paths, parsed.texts, factor, center, meta)
    store.addBackgroundElements([...lines, ...texts])
    // Dessin plus grand que la vue : on dézoome pour le voir en entier, centré.
    const fit = Math.min(
      (viewportSize.width - FIT_PADDING * 2) / (width * ppu),
      (viewportSize.height - FIT_PADDING * 2) / (height * ppu),
    )
    // Page agrandie : setPageSize a déjà ajusté la vue sur toute la page, qui contient le dessin.
    if (!placement.page && Number.isFinite(fit) && fit > 0 && fit < zoom) {
      const next = clampZoom(fit)
      store.setView({
        zoom: next,
        stagePosition: {
          x: viewportSize.width / 2 - center.x * next * ppu,
          y: viewportSize.height / 2 - center.y * next * ppu,
        },
      })
    }
    store.setNotice(fr.dxfImport.done(lines.length, texts.length))
    onClose()
  }

  return (
    <Modal title={fr.dxfImport.title} onClose={onClose}>
      <div className="space-y-4">
        <p className="truncate text-sm font-medium text-slate-900" title={fileName}>
          {fileName}
        </p>
        {'error' in reading ? (
          <p role="alert" className="text-sm text-red-600">
            {fr.dxfImport.errors[reading.error]}
          </p>
        ) : (
          <>
            <Group label={fr.dxfImport.unit}>
              {UNITS.map((value) => (
                <Choice key={value} name="dxf-unit" checked={unit === value} onSelect={() => setUnit(value)}>
                  {fr.dxfImport.units[value]}
                </Choice>
              ))}
            </Group>
            <p className="-mt-2 text-xs text-slate-500">
              {declared ? fr.dxfImport.unitDeclared(fr.dxfImport.units[declared]) : fr.dxfImport.unitMissing}
            </p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              <dt className="text-slate-500">{fr.dxfImport.size}</dt>
              <dd className="text-slate-900">
                {fr.dxfImport.sizeValue(formatDecimal(width, 0), formatDecimal(height, 0))}
              </dd>
              <dt className="text-slate-500">{fr.dxfImport.count}</dt>
              <dd className="text-slate-900">{parsed?.paths.length ?? 0}</dd>
              <dt className="text-slate-500">{fr.dxfImport.textCount}</dt>
              <dd className="text-slate-900">{parsed?.texts.length ?? 0}</dd>
              {levelName && (
                <>
                  <dt className="text-slate-500">{fr.dxfImport.level}</dt>
                  <dd className="text-slate-900">{levelName}</dd>
                </>
              )}
            </dl>
            <p className="text-xs text-slate-500">{fr.dxfImport.hint}</p>
          </>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button onClick={onClose}>{fr.common.cancel}</Button>
          <Button variant="primary" onClick={handleImport} disabled={!parsed}>
            {fr.dxfImport.submit}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
