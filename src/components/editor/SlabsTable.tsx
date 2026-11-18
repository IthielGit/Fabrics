import { useMemo } from 'react'
import { slabMeasures } from '../../features/scene/slabMeasures'
import { formatArea, formatLength, formatVolume } from '../../features/units/format'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'

const HEAD = 'px-1 py-1 text-left text-xs font-medium text-slate-500'
const NUMBER = 'px-1 py-1 text-right tabular-nums'

/**
 * Dalles de Pascal du niveau affiché (M19 B6), à part des murs : surface, épaisseur, volume
 * (`features/scene/slabMeasures.ts`). Rien s'il n'y a pas de dalle.
 */
export default function SlabsTable({ levelId }: { levelId: string | null }) {
  const scene = useEditorStore((state) => state.project?.scene ?? null)
  const slabs = useMemo(
    () => (scene ? slabMeasures(scene).filter((slab) => levelId === null || slab.levelId === levelId) : []),
    [scene, levelId],
  )
  if (slabs.length === 0) return null
  const t = fr.measurements.slabs
  const total = slabs.reduce((sum, slab) => ({ area: sum.area + slab.area, volume: sum.volume + slab.volume }), { area: 0, volume: 0 })
  return (
    <>
      <table className="mt-4 w-full text-sm">
        <caption className="pb-1 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t.title}</caption>
        <thead>
          <tr>
            <th className={HEAD}>{fr.measurements.name}</th>
            <th className={`${HEAD} text-right`}>{fr.measurements.area}</th>
            <th className={`${HEAD} text-right`}>{fr.measurements.thickness}</th>
            <th className={`${HEAD} text-right`}>{fr.measurements.volume}</th>
          </tr>
        </thead>
        <tbody>
          {slabs.map((slab, index) => {
            const name = slab.name || (slab.role ? t.roles[slab.role] : undefined) || `${t.unnamed} ${index + 1}`
            return (
              <tr key={slab.id} className="border-t border-slate-100" title={`${t.elevation} : ${formatLength(slab.elevation)}`}>
                <td className="max-w-24 truncate px-1 py-1">{name}</td>
                <td className={NUMBER}>{formatArea(slab.area)}</td>
                <td className={NUMBER}>{formatLength(slab.thickness)}</td>
                <td className={NUMBER}>{formatVolume(slab.volume)}</td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-slate-300 font-semibold">
            <td className="px-1 py-1">{fr.measurements.total}</td>
            <td className={NUMBER}>{formatArea(total.area)}</td>
            <td />
            <td className={NUMBER}>{formatVolume(total.volume)}</td>
          </tr>
        </tfoot>
      </table>
      <p className="mt-1 text-xs text-slate-500">{t.note}</p>
    </>
  )
}
