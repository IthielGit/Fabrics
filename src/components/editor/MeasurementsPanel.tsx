import { Download } from 'lucide-react'
import { useMemo } from 'react'
import { csvFileName, measurementsToCsv } from '../../features/measurements/csv'
import { computeMeasurements } from '../../features/measurements/measurements'
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
  const selectedIds = useEditorStore((state) => state.selectedIds)
  const setSelection = useEditorStore((state) => state.setSelection)

  // Recalculé à chaque modification du document : le panneau est toujours à jour.
  const measurements = useMemo(() => computeMeasurements(elements ?? []), [elements])

  if (!isPlan) return null
  const { rooms, walls, totals } = measurements
  const isEmpty = rooms.length === 0 && walls.length === 0

  const handleExport = () => {
    const csv = measurementsToCsv(measurements, fr.measurements.csv)
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
          disabled={isEmpty}
          title={isEmpty ? fr.measurements.exportDisabled : undefined}
          className="px-2 py-1 text-xs"
        >
          <Download size={14} aria-hidden="true" />
          {fr.measurements.exportCsv}
        </Button>
      </div>

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
              <th className={`${HEAD} text-right`}>{fr.measurements.thickness}</th>
              <th className={`${HEAD} text-right`}>{fr.measurements.wallArea}</th>
            </tr>
          </thead>
          <tbody>
            {walls.map((wall) => (
              <tr key={wall.id} onClick={() => setSelection([wall.id])} className={rowClass(wall.id)}>
                <td className="max-w-20 truncate px-1 py-1">{wall.name}</td>
                <td className={NUMBER}>{formatLength(wall.length)}</td>
                <td className={NUMBER}>{formatLength(wall.thickness)}</td>
                <td className={NUMBER}>{formatArea(wall.wallArea)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-300 font-semibold">
              <td className="px-1 py-1">{fr.measurements.total}</td>
              <td className={NUMBER}>{formatLength(totals.wallLength)}</td>
              <td />
              <td className={NUMBER}>{formatArea(totals.wallArea)}</td>
            </tr>
          </tfoot>
        </table>
      )}
    </section>
  )
}
