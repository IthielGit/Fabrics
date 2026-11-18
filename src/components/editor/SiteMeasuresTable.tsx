import { useMemo } from 'react'
import { siteMeasures } from '../../features/scene/siteMeasures'
import { formatArea, formatDecimal, formatLength } from '../../features/units/format'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'

const HEAD = 'px-1 py-1 text-left text-xs font-medium text-slate-500'
const NUMBER = 'px-1 py-1 text-right tabular-nums'
const ROW = 'border-t border-slate-100'

/**
 * Terrain et implantation (M19 B4) : parcelle, emprise au sol, recul, relief et altitudes des niveaux,
 * lus dans la scène Pascal du projet ouvert (`features/scene/siteMeasures.ts`).
 */
export default function SiteMeasuresTable() {
  const scene = useEditorStore((state) => state.project?.scene ?? null)
  const site = useMemo(() => (scene ? siteMeasures(scene) : null), [scene])
  if (!site) return null
  const t = fr.measurements.site
  return (
    <div className="mt-4">
      <table className="w-full text-sm">
        <caption className="pb-1 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t.title}</caption>
        <tbody>
          {site.parcelDefined ? (
            <>
              <tr className={ROW}>
                <td className="px-1 py-1">{t.parcelArea}</td>
                <td className={NUMBER}>{formatArea(site.parcelArea)}</td>
              </tr>
              <tr className={ROW}>
                <td className="px-1 py-1">{t.parcelPerimeter}</td>
                <td className={NUMBER}>{formatLength(site.parcelPerimeter)}</td>
              </tr>
            </>
          ) : (
            <tr className={ROW}>
              <td colSpan={2} className="px-1 py-1 text-xs text-slate-500">
                {t.noParcel}
              </td>
            </tr>
          )}
          <tr className={ROW}>
            <td className="px-1 py-1">{t.footprint}</td>
            <td className={NUMBER}>{formatArea(site.footprintArea)}</td>
          </tr>
          {site.coverageRatio !== null && (
            <tr className={ROW}>
              <td className="px-1 py-1">{t.coverage}</td>
              <td className={NUMBER}>{formatDecimal(site.coverageRatio * 100, 1)} %</td>
            </tr>
          )}
          {site.minSetback !== null && (
            <tr className={ROW}>
              <td className="px-1 py-1">{t.setback}</td>
              <td className={NUMBER}>{formatLength(site.minSetback)}</td>
            </tr>
          )}
          <tr className={ROW}>
            <td className="px-1 py-1">{t.terrain}</td>
            <td className="px-1 py-1 text-right">{site.sculptedTerrain ? t.sculpted : t.flat}</td>
          </tr>
        </tbody>
      </table>
      {site.insideParcel === false && <p className="mt-1 text-xs font-medium text-red-600">{t.outside}</p>}
      <p className="mt-1 text-xs text-slate-500">{t.note}</p>

      {site.levels.length > 0 && (
        <table className="mt-3 w-full text-sm">
          <caption className="pb-1 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t.levels}</caption>
          <thead>
            <tr>
              <th className={HEAD}>{fr.measurements.name}</th>
              <th className={`${HEAD} text-right`}>{t.elevation}</th>
              <th className={`${HEAD} text-right`}>{t.height}</th>
            </tr>
          </thead>
          <tbody>
            {site.levels.map((level) => (
              <tr key={level.id} className={ROW}>
                <td className="max-w-24 truncate px-1 py-1">{level.name}</td>
                <td className={NUMBER}>{`${level.elevation > 0 ? '+' : ''}${formatLength(level.elevation)}`}</td>
                <td className={NUMBER}>{formatLength(level.height)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
