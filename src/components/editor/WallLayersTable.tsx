import { layerTotals, type WallLayerMeasure } from '../../features/measurements/wallLayers'
import { formatArea, formatLength, formatVolume } from '../../features/units/format'
import { fr } from '../../i18n/fr'

const HEAD = 'px-1 py-1 text-left text-xs font-medium text-slate-500'
const NUMBER = 'px-1 py-1 text-right tabular-nums'

/** Nom lisible d'une couche : son matériau (ou son rôle) en français, sinon le mot de Pascal. */
function layerLabel(layer: { role: string; material: string | null }): string {
  const role = fr.measurements.layerRoles[layer.role] ?? layer.role
  if (!layer.material) return role
  return `${role} · ${fr.measurements.layerMaterials[layer.material] ?? layer.material}`
}

/**
 * Quantités par couche des murs composés dans Pascal (M19 B3), regroupées par couche identique
 * (rôle, matériau, épaisseur). Rien si aucun mur n'a de composition.
 */
export default function WallLayersTable({ walls }: { walls: readonly { layers?: readonly WallLayerMeasure[] }[] }) {
  const totals = layerTotals(walls)
  if (totals.length === 0) return null
  return (
    <>
      <table className="mt-4 w-full text-sm">
        <caption className="pb-1 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          {fr.measurements.wallLayers}
        </caption>
        <thead>
          <tr>
            <th className={HEAD}>{fr.measurements.layer}</th>
            <th className={`${HEAD} text-right`}>{fr.measurements.thickness}</th>
            <th className={`${HEAD} text-right`}>{fr.measurements.area}</th>
            <th className={`${HEAD} text-right`}>{fr.measurements.volume}</th>
          </tr>
        </thead>
        <tbody>
          {totals.map((layer) => (
            <tr key={`${layer.role}|${layer.material}|${layer.thickness}`} className="border-t border-slate-100">
              <td className="max-w-28 truncate px-1 py-1" title={layerLabel(layer)}>
                {layerLabel(layer)}
              </td>
              <td className={NUMBER}>{formatLength(layer.thickness)}</td>
              <td className={NUMBER}>{formatArea(layer.area)}</td>
              <td className={NUMBER}>{formatVolume(layer.volume)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-1 text-xs text-slate-500">{fr.measurements.wallLayersNote}</p>
    </>
  )
}
