import { Download } from 'lucide-react'
import { useMemo } from 'react'
import { furnitureCsvRows } from '../library/furnitureRows'
import { csvFileName, measurementsToCsv } from '../../features/measurements/csv'
import {
  computeBuildingMeasurements,
  computeMeasurements,
} from '../../features/measurements/measurements'
import { formatArea, formatLength } from '../../features/units/format'
import { fr } from '../../i18n/fr'
import { downloadBlob } from '../../lib/download'
import { useEditorStore } from '../../stores/editorStore'
import Button from '../ui/Button'

const HEAD = 'px-1 py-1 text-left text-xs font-medium text-slate-500'
const NUMBER = 'px-1 py-1 text-right tabular-nums'

/** Panneau « Métrés » d'un plan : tableau des pièces, tableau des murs, totaux, export CSV. */
export default function MeasurementsPanel() {
  const projectName = useEditorStore((state) => state.project?.name ?? '')
  const isPlan = useEditorStore((state) => state.project?.kind === 'plan')
  const elements = useEditorStore((state) => state.project?.document.elements)
  const levels = useEditorStore((state) => state.project?.document.levels)
  const activeLevelId = useEditorStore((state) => state.activeLevelId)
  const selectedIds = useEditorStore((state) => state.selectedIds)
  const setSelection = useEditorStore((state) => state.setSelection)
  const setActiveLevel = useEditorStore((state) => state.setActiveLevel)

  // Recalculé à chaque modification du document : le panneau est toujours à jour.
  const building = useMemo(
    () => computeBuildingMeasurements({ elements: elements ?? [], levels }),
    [elements, levels],
  )

  if (!isPlan) return null
  const active = building.levels.find((entry) => entry.level.id === activeLevelId)
  const measurements = active?.measurements ?? computeMeasurements([])
  const { rooms, walls, openings, totals } = measurements
  // Le niveau affiché est vide : on le dit ; le CSV, lui, couvre tout le bâtiment.
  const isEmpty = rooms.length === 0 && walls.length === 0
  const buildingEmpty = building.total.rooms.length === 0 && building.total.walls.length === 0

  const handleExport = () => {
    const csv = measurementsToCsv(building, fr.measurements.csv, furnitureCsvRows(elements ?? []))
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
    <section aria-label={fr.measurements.title} className="border-t border-slate-200 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900">{fr.measurements.title}</h2>
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

      {active && building.levels.length > 1 && (
        <p className="mt-2 text-xs font-medium text-slate-600">
          {fr.measurements.level} : {active.level.name}
        </p>
      )}

      {isEmpty && <p className="mt-3 text-sm text-slate-500">{fr.measurements.empty}</p>}

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
              <tr key={room.id} onClick={() => setSelection([room.id])} className={rowClass(room.id)}>
                <td className="max-w-24 truncate px-1 py-1">{room.name}</td>
                <td className={NUMBER}>{formatArea(room.area)}</td>
                <td className={NUMBER}>{formatLength(room.perimeter)}</td>
              </tr>
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
    </section>
  )
}
