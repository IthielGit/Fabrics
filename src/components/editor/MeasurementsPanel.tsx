import { Download, FileSpreadsheet } from 'lucide-react'
import { Fragment, useMemo, useState } from 'react'
import { furnitureCsvRows } from '../library/furnitureRows'
import { overlappingRoomIdsCached } from '../../features/geometry/roomOverlap'
import { buildClientTables } from '../../features/measurements/clientView'
import { csvFileName, measurementsToCsv } from '../../features/measurements/csv'
import {
  computeBuildingMeasurements,
  computeMeasurements,
} from '../../features/measurements/measurements'
import { cellText } from '../../features/measurements/tables'
import { formatArea, formatLength, formatVolume } from '../../features/units/format'
import { fr } from '../../i18n/fr'
import { formatDate } from '../../lib/date'
import { downloadBlob } from '../../lib/download'
import { useEditorStore } from '../../stores/editorStore'
import Button from '../ui/Button'
import { exportMetres, metresTables, type MetresVersion } from './exportMetres'

const HEAD = 'px-1 py-1 text-left text-xs font-medium text-slate-500'
const NUMBER = 'px-1 py-1 text-right tabular-nums'

/** Panneau « Métrés » d'un plan : tableau des pièces, tableau des murs, totaux, export Excel et CSV. */
export default function MeasurementsPanel() {
  const projectName = useEditorStore((state) => state.project?.name ?? '')
  const isPlan = useEditorStore((state) => state.project?.kind === 'plan')
  const elements = useEditorStore((state) => state.project?.document.elements)
  const levels = useEditorStore((state) => state.project?.document.levels)
  const activeLevelId = useEditorStore((state) => state.activeLevelId)
  const selectedIds = useEditorStore((state) => state.selectedIds)
  const setSelection = useEditorStore((state) => state.setSelection)
  const setActiveLevel = useEditorStore((state) => state.setActiveLevel)

  // Version affichée et exportée : un réglage d'interface, pas une donnée du document.
  const [version, setVersion] = useState<MetresVersion>('execution')
  // Recalculé à chaque modification du document : le panneau est toujours à jour.
  const building = useMemo(
    () => computeBuildingMeasurements({ elements: elements ?? [], levels }),
    [elements, levels],
  )

  if (!isPlan) return null
  const active = building.levels.find((entry) => entry.level.id === activeLevelId)
  const measurements = active?.measurements ?? computeMeasurements([])
  const { rooms, walls, platforms, stairs, roofs, openings, totals } = measurements
  const overlapIds = overlappingRoomIdsCached(elements ?? [])
  const overlapCount = rooms.filter((room) => overlapIds.has(room.id)).length
  // Le niveau affiché est vide : on le dit ; le CSV, lui, couvre tout le bâtiment.
  const isEmpty =
    rooms.length === 0 &&
    walls.length === 0 &&
    platforms.length === 0 &&
    stairs.length === 0 &&
    roofs.length === 0
  const buildingEmpty =
    building.total.rooms.length === 0 &&
    building.total.walls.length === 0 &&
    building.total.platforms.length === 0 &&
    building.total.stairs.length === 0 &&
    building.total.roofs.length === 0

  // Export principal : un vrai fichier Excel (onglets, nombres, totaux en formules), tout le bâtiment.
  const handleExportExcel = async () => {
    const project = useEditorStore.getState().project
    if (!project) return
    try {
      await exportMetres(project, {
        format: 'xlsx',
        version,
        scope: 'building',
        includeFurniture: true,
        activeLevelId: null,
        fileName: `${projectName} ${fr.measurements.csvFileSuffix}`,
        sheet: 'a4',
        orientation: 'landscape',
      })
    } catch {
      useEditorStore.getState().setNotice(fr.export.failed)
    }
  }

  const handleExport = () => {
    const furniture = furnitureCsvRows(elements ?? [])
    const csv = measurementsToCsv(
      building,
      fr.measurements.csv,
      furniture,
      { projectName, date: formatDate(new Date()) },
      metresTables(building, furniture, version),
    )
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    downloadBlob(
      blob,
      csvFileName(projectName, fr.measurements.csvFileSuffix, fr.measurements.csvFallbackName),
    )
  }

  const rowClass = (id: string) =>
    `cursor-pointer border-t border-slate-100 hover:bg-slate-50 ${
      selectedIds.includes(id) ? 'bg-indigo-50' : ''
    }`

  return (
    <section aria-label={fr.measurements.title} className="p-4">
      <div role="group" aria-label={fr.measurements.versionLabel} className="mb-3 flex rounded-md border border-slate-200 p-0.5 text-xs">
        {(['client', 'execution'] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={version === value}
            onClick={() => setVersion(value)}
            className={`flex-1 rounded px-2 py-1 font-medium ${
              version === value ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {fr.export.metres[value]}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-end gap-2">
        <h2 className="sr-only">{fr.measurements.title}</h2>
        <Button
          variant="primary"
          onClick={handleExportExcel}
          disabled={buildingEmpty}
          title={buildingEmpty ? fr.measurements.exportDisabled : fr.measurements.exportExcelHint}
          className="px-2 py-1 text-xs"
        >
          <FileSpreadsheet size={14} aria-hidden="true" />
          {fr.measurements.exportExcel}
        </Button>
        <Button
          onClick={handleExport}
          disabled={buildingEmpty}
          title={buildingEmpty ? fr.measurements.exportDisabled : undefined}
          className="px-2 py-1 text-xs"
        >
          <Download size={14} aria-hidden="true" />
          {fr.measurements.exportCsv}
        </Button>
      </div>

      {version === 'client' && (
        <div className="mt-3 space-y-4">
          {buildingEmpty && <p className="text-sm text-slate-500">{fr.measurements.empty}</p>}
          {buildClientTables(building, fr.measurements.client).map((table) => (
            // Six colonnes dans un panneau de 320 px : défilement horizontal plutôt que des chiffres écrasés.
            <div key={table.id} className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="pb-1 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {table.title}
                </caption>
                <thead>
                  <tr>
                    {table.columns.map((column) => (
                      <th key={column.header} className={`${HEAD} ${column.align === 'right' ? 'text-right' : ''}`}>
                        {column.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((cells, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      {cells.map((cell, j) => (
                        <td key={j} className={table.columns[j].align === 'right' ? NUMBER : 'px-1 py-1'}>
                          {cellText(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {table.total && (
                    <tr className="border-t border-slate-300 font-semibold">
                      {table.total.map((cell, j) => (
                        <td key={j} className={table.columns[j].align === 'right' ? NUMBER : 'px-1 py-1'}>
                          {cellText(cell)}
                        </td>
                      ))}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {version === 'execution' && (
        <>
      {active && building.levels.length > 1 && (
        <p className="mt-2 text-xs font-medium text-slate-600">
          {fr.measurements.level} : {active.level.name}
        </p>
      )}

      {isEmpty && <p className="mt-3 text-sm text-slate-500">{fr.measurements.empty}</p>}

      {overlapCount > 0 && (
        <p role="alert" className="mt-3 rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700">
          {fr.measurements.roomOverlap(overlapCount)}
        </p>
      )}

      {rooms.length > 0 && (
        <table className="mt-3 w-full text-sm">
          <caption className="pb-1 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            {fr.measurements.rooms}
          </caption>
          <thead>
            <tr>
              <th className={HEAD}>{fr.measurements.name}</th>
              <th className={`${HEAD} text-right`}>{fr.measurements.area}</th>
              <th className={`${HEAD} text-right`}>{fr.measurements.perimeter}</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <Fragment key={room.id}>
                <tr onClick={() => setSelection([room.id])} className={rowClass(room.id)}>
                  <td className="max-w-24 truncate px-1 py-1">{room.name}</td>
                  <td className={NUMBER}>{formatArea(room.area)}</td>
                  <td className={NUMBER}>{formatLength(room.perimeter)}</td>
                </tr>
                {room.voidArea > 0 && (
                  <tr onClick={() => setSelection([room.id])} className="cursor-pointer text-xs text-slate-500">
                    <td className="px-1 pb-1" colSpan={3}>
                      {fr.stairs.voidArea} −{formatArea(room.voidArea)} · {fr.stairs.netArea}{' '}
                      {formatArea(room.netArea)}
                    </td>
                  </tr>
                )}
                {room.voidOverflow && (
                  <tr>
                    <td className="px-1 pb-1 text-xs text-red-700" colSpan={3}>
                      {fr.stairs.voidOverflow}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-300 font-semibold">
              <td className="px-1 py-1">{fr.measurements.total}</td>
              <td className={NUMBER}>{formatArea(totals.roomArea)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      )}
      {rooms.length > 0 && <p className="mt-1 text-xs text-slate-500">{fr.measurements.areaNote}</p>}

      {walls.length > 0 && (
        <table className="mt-4 w-full text-sm">
          <caption className="pb-1 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            {fr.measurements.walls}
          </caption>
          <thead>
            <tr>
              <th className={HEAD}>{fr.measurements.name}</th>
              <th className={`${HEAD} text-right`}>{fr.measurements.length}</th>
              <th className={`${HEAD} text-right`}>{fr.measurements.wallGrossArea}</th>
              <th className={`${HEAD} text-right`}>{fr.measurements.wallNetArea}</th>
            </tr>
          </thead>
          <tbody>
            {walls.map((wall) => (
              <tr key={wall.id} onClick={() => setSelection([wall.id])} className={rowClass(wall.id)}>
                <td className="max-w-16 truncate px-1 py-1">{wall.name}</td>
                <td className={NUMBER}>{formatLength(wall.length)}</td>
                <td className={NUMBER}>{formatArea(wall.wallArea)}</td>
                <td className={NUMBER}>{formatArea(wall.netArea)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-300 font-semibold">
              <td className="px-1 py-1">{fr.measurements.total}</td>
              <td className={NUMBER}>{formatLength(totals.wallLength)}</td>
              <td className={NUMBER}>{formatArea(totals.wallArea)}</td>
              <td className={NUMBER}>{formatArea(totals.wallNetArea)}</td>
            </tr>
          </tfoot>
        </table>
      )}
      {walls.length > 0 && openings.length > 0 && (
        <p className="mt-1 text-xs text-slate-500">{fr.measurements.netAreaNote}</p>
      )}

      {stairs.length > 0 && (
        <table className="mt-4 w-full text-sm">
          <caption className="pb-1 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            {fr.measurements.stairs}
          </caption>
          <thead>
            <tr>
              <th className={HEAD}>{fr.measurements.name}</th>
              <th className={`${HEAD} text-right`}>{fr.measurements.stairRisers}</th>
              <th className={`${HEAD} text-right`}>{fr.measurements.stairRiserHeight}</th>
              <th className={`${HEAD} text-right`}>{fr.measurements.stairTreads}</th>
            </tr>
          </thead>
          <tbody>
            {stairs.map((stair) => (
              <tr
                key={stair.id}
                onClick={() => setSelection([stair.id])}
                className={rowClass(stair.id)}
                title={
                  stair.status === 'too-short'
                    ? fr.stairs.tooShort(Math.ceil(stair.requiredRun ?? 0))
                    : stair.status === 'no-level-above'
                      ? fr.stairs.noLevelAbove
                      : `${fr.stairs.treadDepth} : ${formatLength(stair.treadDepth ?? 0)} · ${fr.stairs.width} : ${formatLength(stair.width)}`
                }
              >
                <td className={`max-w-20 truncate px-1 py-1 ${stair.status === 'ok' ? '' : 'text-red-700'}`}>
                  {stair.name}
                </td>
                <td className={NUMBER}>{stair.risers ?? '—'}</td>
                <td className={NUMBER}>
                  {stair.riserHeight === null ? '—' : formatLength(stair.riserHeight)}
                </td>
                <td className={NUMBER}>{stair.treads ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {platforms.length > 0 && (
        <table className="mt-4 w-full text-sm">
          <caption className="pb-1 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            {fr.measurements.platforms}
          </caption>
          <thead>
            <tr>
              <th className={HEAD}>{fr.measurements.name}</th>
              <th className={`${HEAD} text-right`}>{fr.measurements.area}</th>
              <th className={`${HEAD} text-right`}>{fr.measurements.platformVolume}</th>
            </tr>
          </thead>
          <tbody>
            {platforms.map((platform) => (
              <tr
                key={platform.id}
                onClick={() => setSelection([platform.id])}
                className={rowClass(platform.id)}
                title={`${fr.measurements.platformElevation} : +${platform.elevation} mm · ${fr.measurements.thickness} : ${platform.thickness} mm`}
              >
                <td className="max-w-20 truncate px-1 py-1">{platform.name}</td>
                <td className={NUMBER}>{formatArea(platform.area)}</td>
                <td className={NUMBER}>{formatVolume(platform.volume)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-300 font-semibold">
              <td className="px-1 py-1">{fr.measurements.total}</td>
              <td className={NUMBER}>{formatArea(totals.platformArea)}</td>
              <td className={NUMBER}>{formatVolume(totals.platformVolume)}</td>
            </tr>
          </tfoot>
        </table>
      )}

      {roofs.length > 0 && (
        <table className="mt-4 w-full text-sm">
          <caption className="pb-1 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            {fr.measurements.roofs}
          </caption>
          <thead>
            <tr>
              <th className={HEAD}>{fr.measurements.name}</th>
              <th className={`${HEAD} text-right`}>{fr.measurements.roofRealArea}</th>
              <th className={`${HEAD} text-right`}>{fr.measurements.roofRidge}</th>
            </tr>
          </thead>
          <tbody>
            {roofs.map((roof) => (
              <tr
                key={roof.id}
                onClick={() => setSelection([roof.id])}
                className={rowClass(roof.id)}
                title={
                  roof.problem
                    ? fr.roof.problems[roof.problem]
                    : fr.measurements.roofDetails(
                        fr.roof.shapes[roof.shape],
                        roof.pitch,
                        formatLength(Math.round(roof.eaveLength)),
                        roof.gableCount,
                      )
                }
              >
                <td className={`max-w-20 truncate px-1 py-1 ${roof.problem ? 'text-red-600' : ''}`}>{roof.name}</td>
                <td className={NUMBER}>{formatArea(roof.realArea)}</td>
                <td className={NUMBER}>{formatLength(Math.round(roof.ridgeLength))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-300 font-semibold">
              <td className="px-1 py-1">{fr.measurements.total}</td>
              <td className={NUMBER}>{formatArea(totals.roofRealArea)}</td>
              <td className={NUMBER}>{formatLength(Math.round(totals.roofRidgeLength))}</td>
            </tr>
          </tfoot>
        </table>
      )}

      {openings.length > 0 && (
        <table className="mt-4 w-full text-sm">
          <caption className="pb-1 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            {fr.measurements.openings}
          </caption>
          <thead>
            <tr>
              <th className={HEAD}>{fr.measurements.name}</th>
              <th className={`${HEAD} text-right`}>{fr.measurements.openingSize}</th>
              <th className={`${HEAD} text-right`}>{fr.measurements.area}</th>
            </tr>
          </thead>
          <tbody>
            {openings.map((opening) => (
              <tr
                key={opening.id}
                onClick={() => setSelection([opening.id])}
                className={rowClass(opening.id)}
                title={`${fr.elements[opening.kind]} · ${fr.measurements.openingWall} : ${opening.wallName}`}
              >
                <td className="max-w-20 truncate px-1 py-1">{opening.name}</td>
                <td className={NUMBER}>
                  {opening.width} × {opening.height}
                </td>
                <td className={NUMBER}>{formatArea(opening.area)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-300 font-semibold">
              <td className="px-1 py-1">{fr.measurements.total}</td>
              <td />
              <td className={NUMBER}>{formatArea(totals.openingsArea)}</td>
            </tr>
          </tfoot>
        </table>
      )}
      {openings.length > 0 && (
        <p className="mt-1 text-xs text-slate-500">
          {fr.measurements.openingCounts(totals.doors, totals.windows, totals.bays)}
        </p>
      )}

      {building.levels.length > 1 && (
        <table className="mt-5 w-full text-sm">
          <caption className="pb-1 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            {fr.measurements.buildingTitle}
          </caption>
          <thead>
            <tr>
              <th className={HEAD}>{fr.measurements.level}</th>
              <th className={`${HEAD} text-right`}>{fr.measurements.levelRoomArea}</th>
              <th className={`${HEAD} text-right`}>{fr.measurements.levelWallLength}</th>
              <th className={`${HEAD} text-right`}>{fr.measurements.levelWallNetArea}</th>
            </tr>
          </thead>
          <tbody>
            {building.levels.map(({ level, measurements: m }) => (
              <tr
                key={level.id}
                onClick={() => setActiveLevel(level.id)}
                title={fr.levels.activate}
                className={`cursor-pointer border-t border-slate-100 hover:bg-slate-50 ${
                  level.id === activeLevelId ? 'bg-indigo-50' : ''
                }`}
              >
                <td className="max-w-20 truncate px-1 py-1">{level.name}</td>
                <td className={NUMBER}>{formatArea(m.totals.roomArea)}</td>
                <td className={NUMBER}>{formatLength(m.totals.wallLength)}</td>
                <td className={NUMBER}>{formatArea(m.totals.wallNetArea)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-300 font-semibold">
              <td className="px-1 py-1">{fr.measurements.building}</td>
              <td className={NUMBER}>{formatArea(building.total.totals.roomArea)}</td>
              <td className={NUMBER}>{formatLength(building.total.totals.wallLength)}</td>
              <td className={NUMBER}>{formatArea(building.total.totals.wallNetArea)}</td>
            </tr>
          </tfoot>
        </table>
      )}
      {building.levels.length > 1 && (
        <p className="mt-1 text-xs text-slate-500">{fr.measurements.buildingNote}</p>
      )}
        </>
      )}
    </section>
  )
}
