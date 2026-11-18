/**
 * Quantités par couche de mur (M19 B3). Les couches viennent de la composition du mur dans Pascal
 * (`assembly`, de la face de référence vers l'intérieur), lue par la vue Fabrics. Fonctions pures.
 *
 * Règles (sans double comptage) :
 * - surface d'une couche = surface nette du mur à l'axe (longueur × hauteur − ouvertures) : chaque
 *   couche couvre une fois le mur ;
 * - volume d'une couche = volume net du mur × épaisseur de la couche / somme des épaisseurs : la somme
 *   des volumes des couches redonne exactement le volume du mur (ouvertures et raccords en T déduits).
 */
import type { WallLayer } from '../../types/document'

export interface WallLayerMeasure {
  id: string
  role: string
  material: string | null
  /** Épaisseur de la couche, en mm. */
  thickness: number
  /** Surface de la couche, en mm². */
  area: number
  /** Volume de la couche, en mm³. */
  volume: number
}

/** Quantités de chaque couche d'un mur, à partir de sa surface nette et de son volume net. */
export function wallLayerMeasures(
  layers: readonly WallLayer[] | undefined,
  wall: { netArea: number; volume: number },
): WallLayerMeasure[] {
  if (!layers || layers.length === 0) return []
  const total = layers.reduce((sum, layer) => sum + Math.max(0, layer.thickness), 0)
  return layers.map((layer) => {
    const thickness = Math.max(0, layer.thickness)
    return {
      id: layer.id,
      role: layer.role,
      material: layer.material ?? null,
      thickness,
      area: thickness > 0 ? wall.netArea : 0,
      volume: total > 0 ? (wall.volume * thickness) / total : 0,
    }
  })
}

export interface LayerTotal {
  /** Clé de regroupement : rôle et matériau. */
  role: string
  material: string | null
  /** Épaisseur, en mm (les couches de même rôle et matériau mais d'épaisseurs différentes restent à part). */
  thickness: number
  area: number
  volume: number
  /** Nombre de murs concernés. */
  walls: number
}

/** Totaux par couche identique (rôle, matériau, épaisseur), dans l'ordre de première apparition. */
export function layerTotals(walls: readonly { layers?: readonly WallLayerMeasure[] }[]): LayerTotal[] {
  const totals = new Map<string, LayerTotal>()
  for (const wall of walls) {
    for (const layer of wall.layers ?? []) {
      const key = `${layer.role}|${layer.material ?? ''}|${layer.thickness}`
      const entry = totals.get(key) ?? { role: layer.role, material: layer.material, thickness: layer.thickness, area: 0, volume: 0, walls: 0 }
      entry.area += layer.area
      entry.volume += layer.volume
      entry.walls += 1
      totals.set(key, entry)
    }
  }
  return [...totals.values()]
}
