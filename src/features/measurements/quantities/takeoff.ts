/**
 * Quantités de métré (M21, 21.1) : la famille `takeoff`, tirée des quantités géométriques selon la
 * convention retenue (`docs/phases/M21-decisions.md`).
 *
 * Avec les réglages par défaut, la convention redonne les valeurs géométriques :
 * - D21-2 : seuil de déduction des vides à 0 m² par défaut, donc toutes les ouvertures sont déduites ;
 * - D21-4 : longueur des murs à l'axe, faces sur les faces, raccords comptés une fois (inchangé).
 * Les deux familles restent pourtant distinctes : en 21.2, les règles versionnées (seuils par
 * catégorie, tableaux des ouvertures, revêtements) ne modifient que la famille `takeoff`.
 * Fonctions pures.
 */
import type { BuildingMeasurements } from '../measurements'
import { geometricQuantities } from './geometric'
import { quantityKey, type QuantityResult } from './types'

/** Quantités de métré à partir des quantités géométriques (même ordre, mêmes sources). */
export function takeoffQuantities(geometric: readonly QuantityResult[]): QuantityResult[] {
  return geometric
    .filter((q) => q.family === 'geometric')
    .map((q) => ({
      ...q,
      key: quantityKey('takeoff', q.code, q.elementIds[0], q.partId),
      family: 'takeoff' as const,
      elementIds: [...q.elementIds],
    }))
}

export interface QuantitySet {
  geometric: QuantityResult[]
  takeoff: QuantityResult[]
}

/** Les deux familles de quantités d'un bâtiment. */
export function buildingQuantities(building: BuildingMeasurements): QuantitySet {
  const geometric = geometricQuantities(building)
  return { geometric, takeoff: takeoffQuantities(geometric) }
}

/** Somme d'un code sur une liste de quantités (valeur exacte, sans arrondi). */
export function sumQuantity(list: readonly QuantityResult[], code: QuantityResult['code']): number {
  return list.reduce((sum, q) => (q.code === code ? sum + q.value : sum), 0)
}
