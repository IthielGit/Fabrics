/**
 * Quantités du quantitatif (M21, sous-lot 21.1) : une liste plate de résultats, chacun rattaché à ses
 * éléments sources, au lieu de champs dispersés dans les métrés.
 *
 * Deux familles (décisions `docs/phases/M21-decisions.md`) :
 * - `geometric` : la forme exacte du modèle (toutes les ouvertures déduites, par union) ;
 * - `takeoff` : la quantité de métré, selon la convention retenue (usages français, D21-1).
 *
 * Les valeurs sont gardées sans arrondi, dans l'unité de base : mm, mm², mm³ ou nombre. L'arrondi
 * (m² à 2 décimales, m³ à 3) se fait seulement à l'affichage (D21-6).
 *
 * Règle versionnée : 21.2 (`rules.ts`) ; traçabilité et statut : 21.3 et 21.4.
 */
import type { QuantityRule } from './rules'

export type QuantityFamily = 'geometric' | 'takeoff'

/** Grandeur d'une quantité ; l'unité de base en découle (mm, mm², mm³, nombre). */
export type QuantityDimension = 'length' | 'area' | 'volume' | 'count'

export type QuantityCategory = 'wall' | 'wallLayer' | 'opening' | 'room' | 'slab' | 'platform' | 'roof' | 'stair' | 'chimney'

/** Code d'une quantité : catégorie, puis ce qui est mesuré. */
export type QuantityCode =
  | 'wall.length'
  | 'wall.grossArea'
  | 'wall.openingsArea'
  | 'wall.netArea'
  | 'wall.facesLength'
  | 'wall.facesGrossArea'
  | 'wall.facesNetArea'
  | 'wall.grossVolume'
  | 'wall.netVolume'
  /** Métré seulement : faces des murs à enduire et à peindre (seuils propres, D21-2). */
  | 'wall.plasterArea'
  | 'wall.paintArea'
  | 'wallLayer.area'
  | 'wallLayer.volume'
  | 'opening.count'
  | 'opening.area'
  /** Métré seulement : tableaux (pourtour × épaisseur du mur, D21-3). */
  | 'opening.revealArea'
  | 'room.area'
  | 'room.perimeter'
  | 'room.voidArea'
  | 'room.netArea'
  | 'room.habitableArea'
  /** Métré seulement : revêtement de sol, plafond, plinthes (portes déduites). */
  | 'room.floorCoveringArea'
  | 'room.ceilingArea'
  | 'room.skirtingLength'
  | 'slab.area'
  | 'slab.perimeter'
  | 'slab.volume'
  | 'platform.area'
  | 'platform.volume'
  | 'roof.projectedArea'
  | 'roof.realArea'
  | 'roof.ridgeLength'
  | 'roof.eaveLength'
  | 'roof.hipLength'
  | 'roof.gableCount'
  | 'stair.count'
  | 'stair.risers'
  | 'stair.treads'
  | 'chimney.count'
  | 'chimney.area'

export interface QuantityResult {
  /** Identifiant stable : famille, code, élément et, pour une couche, la couche. */
  key: string
  family: QuantityFamily
  category: QuantityCategory
  code: QuantityCode
  dimension: QuantityDimension
  /** Valeur exacte dans l'unité de base (mm, mm², mm³ ou nombre), jamais arrondie. */
  value: number
  /** Éléments du modèle dont la quantité est tirée (identifiants stables de la scène). */
  elementIds: string[]
  /** Partie d'un élément (identifiant d'une couche de mur), sinon `null`. */
  partId: string | null
  /** Niveau de l'élément, `null` s'il n'en a pas. */
  levelId: string | null
  /** Règle et version qui ont produit la valeur (21.2). */
  rule: QuantityRule
}

/** Grandeur de chaque code (une seule table : pas de grandeur saisie à la main ailleurs). */
export const QUANTITY_DIMENSIONS: Record<QuantityCode, QuantityDimension> = {
  'wall.length': 'length',
  'wall.grossArea': 'area',
  'wall.openingsArea': 'area',
  'wall.netArea': 'area',
  'wall.facesLength': 'length',
  'wall.facesGrossArea': 'area',
  'wall.facesNetArea': 'area',
  'wall.grossVolume': 'volume',
  'wall.netVolume': 'volume',
  'wall.plasterArea': 'area',
  'wall.paintArea': 'area',
  'wallLayer.area': 'area',
  'wallLayer.volume': 'volume',
  'opening.count': 'count',
  'opening.area': 'area',
  'opening.revealArea': 'area',
  'room.area': 'area',
  'room.perimeter': 'length',
  'room.voidArea': 'area',
  'room.netArea': 'area',
  'room.habitableArea': 'area',
  'room.floorCoveringArea': 'area',
  'room.ceilingArea': 'area',
  'room.skirtingLength': 'length',
  'slab.area': 'area',
  'slab.perimeter': 'length',
  'slab.volume': 'volume',
  'platform.area': 'area',
  'platform.volume': 'volume',
  'roof.projectedArea': 'area',
  'roof.realArea': 'area',
  'roof.ridgeLength': 'length',
  'roof.eaveLength': 'length',
  'roof.hipLength': 'length',
  'roof.gableCount': 'count',
  'stair.count': 'count',
  'stair.risers': 'count',
  'stair.treads': 'count',
  'chimney.count': 'count',
  'chimney.area': 'area',
}

export function quantityKey(family: QuantityFamily, code: QuantityCode, elementId: string, partId: string | null): string {
  return partId === null ? `${family}:${code}:${elementId}` : `${family}:${code}:${elementId}:${partId}`
}

export function categoryOf(code: QuantityCode): QuantityCategory {
  return code.slice(0, code.indexOf('.')) as QuantityCategory
}
