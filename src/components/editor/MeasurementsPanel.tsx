import { Download, FileSpreadsheet } from 'lucide-react'
import { Fragment, useMemo } from 'react'
import { buildClientTables } from '../../features/measurements/clientView'
import {
  computeBuildingMeasurements,
  computeMeasurements,
} from '../../features/measurements/measurements'
import { buildCeilingTable, cellText } from '../../features/measurements/tables'
import { type MetresWarning, isBlockingWarning, isSurfaceWarning, metresWarnings } from '../../features/measurements/warnings'
import { formatArea, formatLength, formatVolume } from '../../features/units/format'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import Button from '../ui/Button'
import { SEGMENTED_BAR, segmentClass } from '../ui/segmented'
import { exportMetres } from './exportMetres'
import MetresWarningList from './MetresWarningList'

/** À corriger (manque, débord : bloque l'export) en rouge, puis le reste à vérifier en orange. */
function SurfaceWarnings({ warnings }: { warnings: readonly MetresWarning[] }) {
  const blocking = warnings.filter(isBlockingWarning)
  const others = warnings.filter((w) => !isBlockingWarning(w))
  return (
    <div className="space-y-2">
      <MetresWarningList warnings={blocking} title={fr.measurements.warnings.toFix} tone="error" interactive />
      <MetresWarningList warnings={others} title={fr.measurements.warnings.title} interactive />
    </div>
  )
}

const HEAD = 'px-1 py-1 text-left text-xs font-medium text-slate-600'

/**
 * Ordre d'affichage des colonnes de la vue Client : les surfaces passent juste après les colonnes de
 * texte (niveau, pièce), pour qu'on les voie sans faire défiler (périmètre et hauteur suivent).
 * Seul l'affichage change : le fichier exporté garde son ordre.
 */
function clientColumnOrder(columns: readonly { header: string; align: string }[]): number[] {
  const surfaceHeaders: string[] = [fr.measurements.client.floorArea, fr.measurements.client.livingArea]
  const indexes = columns.map((_, i) => i)
  const left = indexes.filter((i) => columns[i].align === 'left')
  const surfaces = indexes.filter((i) => surfaceHeaders.includes(columns[i].header))
  const others = indexes.filter((i) => !left.includes(i) && !surfaces.includes(i))
  return [...left, ...surfaces, ...others]
}
const NUMBER = 'whitespace-nowrap px-1 py-1 text-right tabular-nums'

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

  // Version affichée et exportée : un réglage d'interface partagé avec la fenêtre Exporter, pas une donnée du document.
  const version = useEditorStore((state) => state.metresVersion)
  const setVersion = useEditorStore((state) => state.setMetresVersion)
  // Recalculé à chaque modification du document : le panneau est toujours à jour.
  const building = useMemo(
    () => computeBuildingMeasurements({ elements: elements ?? [], levels }),
    [elements, levels],
  )
  // Surfaces douteuses (superpositions, trémies, espace non couvert entre les murs) : signalées, jamais corrigées.
  const surfaceWarnings = useMemo(
    () => metresWarnings({ elements: elements ?? [], levels }, building).filter(isSurfaceWarning),
    [elements, levels, building],
  )

  if (!isPlan) return null
  const active = building.levels.find((entry) => entry.level.id === activeLevelId)
  const measurements = active?.measurements ?? computeMeasurements([])
  const { rooms, walls, platforms, stairs, roofs, openings, totals } = measurements
  // Plafonds du niveau affiché (le tableau complet du bâtiment est dans les exports).
  const ceilingTable = active
    ? buildCeilingTable({ ...building, levels: [active] }, fr.measurements.csv.ceilings)
    : null
  const levelWarnings = surfaceWarnings.filter((w) => 'levelId' in w && w.levelId === activeLevelId)
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
  // Manque ou débord quelque part dans le bâtiment : les exports du panneau (tout le bâtiment) sont refusés.
  const blocked = surfaceWarnings.some(isBlockingWarning)
  const exportTitle = buildingEmpty
    ? fr.measurements.exportDisabled
    : blocked
      ? fr.measurements.warnings.blockedButton
      : undefined

  // Exports du panneau : tout le bâtiment, dans la version affichée.
  const runExport = async (format: 'xlsx' | 'tables') => {
    const project = useEditorStore.getState().project
    if (!project) return
    try {
      await exportMetres(project, {
        format,
        version,
        scope: 'building',
        includeFurniture: true,
        activeLevelId: null,
        fileName: `${projectName} ${fr.measurements.csvFileSuffix}`,
        sheet: 'a4',
        orientation: 'landscape',
      })
    } catch {
      useEditorStore.getState().setNotice(fr.export.failed, 'error')
    }
  }
  // Export principal : un vrai fichier Excel (onglets, nombres, totaux en formules).
  const handleExportExcel = () => runExport('xlsx')
  const handleExport = () => runExport('tables')

  const rowClass = (id: string) =>
    `cursor-pointer border-t border-slate-100 hover:bg-slate-50 ${
      selectedIds.includes(id) ? 'bg-indigo-50' : ''
    }`

  return (
    <section aria-label={fr.measurements.title} className="p-4">
      <div
        role="group"
        aria-label={fr.measurements.versionLabel}
        className={`${SEGMENTED_BAR} mb-3 w-full`}
      >
        {(['client', 'execution'] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={version === value}
            onClick={() => setVersion(value)}
            className={`${segmentClass(version === value)} flex-1`}
          >
            {fr.export.metres[value]}
          </button>
        ))}
      </div>
      <p className="-mt-1 mb-3 text-xs leading-relaxed text-slate-600">{fr.export.metres.versionHint[version]}</p>
      <h2 className="sr-only">{fr.measurements.title}</h2>
      <div className="flex items-center gap-2">
        <Button
          variant="primary"
          onClick={handleExportExcel}
          disabled={buildingEmpty || blocked}
          title={exportTitle ?? fr.measurements.exportExcelHint}
          className="flex-1 justify-center"
        >
          <FileSpreadsheet size={16} aria-hidden="true" />
          {fr.measurements.exportExcel}
        </Button>
        <Button
          onClick={handleExport}
          disabled={buildingEmpty || blocked}
          title={exportTitle}
          className="justify-center"
        >
          <Download size={16} aria-hidden="true" />
          {fr.measurements.exportCsv}
        </Button>
      </div>
      {/* La raison du blocage est écrite, pas seulement dans une infobulle. */}
      {exportTitle && (
        <p
          className={blocked ? 'mt-2 rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900' : 'mt-2 text-xs text-slate-500'}
          role="status"
        >
          {exportTitle}
        </p>
      )}

      {version === 'client' && (
        <div className="mt-3 space-y-4">
          {buildingEmpty && <p className="text-sm text-slate-500">{fr.measurements.empty}</p>}
          <SurfaceWarnings warnings={surfaceWarnings} />
          {buildClientTables(building, fr.measurements.client).map((table) => {
            const order = clientColumnOrder(table.columns)
            return (
              // Plusieurs colonnes dans un panneau étroit : défilement horizontal plutôt que des chiffres écrasés.
              <div key={table.id} className="overflow-x-auto">
                <table className="w-full text-sm">
                  <caption className="pb-1 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    {table.title}
                  </caption>
                  <thead>
                    <tr>
                      {order.map((j) => (
                        <th
                          key={table.columns[j].header}
                          className={`${HEAD} ${table.columns[j].align === 'right' ? 'text-right' : ''}`}
                        >
                          {table.columns[j].header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((cells, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        {order.map((j) => (
                          <td key={j} className={table.columns[j].align === 'right' ? NUMBER : 'px-1 py-1'}>
                            {cellText(cells[j])}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {table.total && (
                      <tr className="border-t border-slate-300 font-semibold">
                        {order.map((j) => (
                          <td key={j} className={table.columns[j].align === 'right' ? NUMBER : 'px-1 py-1'}>
                            {cellText(table.total![j])}
                          </td>
                        ))}
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )
          })}
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

      {levelWarnings.length > 0 && (
        <div className="mt-3">
          <SurfaceWarnings warnings={levelWarnings} />
        </div>
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
      {ceilingTable && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="pb-1 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              {ceilingTable.title}
            </caption>
            <thead>
              <tr>
                {ceilingTable.columns.slice(1).map((column) => (
                  <th key={column.header} className={`${HEAD} ${column.align === 'right' ? 'text-right' : ''}`}>
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ceilingTable.rows.map((cells, i) => (
                <tr key={i} className="border-t border-slate-100">
                  {cells.slice(1).map((cell, j) => (
                    <td key={j} className={ceilingTable.columns[j + 1].align === 'right' ? NUMBER : 'max-w-24 truncate px-1 py-1'}>
                      {cellText(cell)}
                    </td>
                  ))}
                </tr>
              ))}
              {ceilingTable.total && (
                <tr className="border-t border-slate-300 font-semibold">
                  {ceilingTable.total.slice(1).map((cell, j) => (
                    <td key={j} className={ceilingTable.columns[j + 1].align === 'right' ? NUMBER : 'px-1 py-1'}>
                      {cellText(cell)}
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
          <p className="mt-1 text-xs text-slate-500">{ceilingTable.note}</p>
        </div>
      )}

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
