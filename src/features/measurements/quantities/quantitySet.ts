/**
 * Point d'entrée du quantitatif (M21) : les deux familles de quantités d'un plan, calculées à partir
 * des métrés (`computeBuildingMeasurements`) et de la scène Pascal (dalles). Fonctions pures.
 */
import type { FabricsDocument } from '../../../types/document'
import type { PlanScene } from '../../scene/sceneTypes'
import { levelFootprintAreas } from '../../scene/siteMeasures'
import { slabMeasures } from '../../scene/slabMeasures'
import { collectStairVoids } from '../../stairs/voids'
import { computeBuildingMeasurements, type BuildingMeasurements } from '../measurements'
import { geometricQuantities } from './geometric'
import { levelSlabs } from './levelSlabs'
import { takeoffSettingsOf } from './rules'
import { takeoffQuantities } from './takeoff'
import { quantitySummary, unsupportedQuantities, withStatus, type Quantity, type QuantitySummary } from './status'
import { traceQuantities } from './trace'
import type { QuantityResult } from './types'

export interface QuantitySet {
  geometric: Quantity[]
  takeoff: Quantity[]
  /** Statuts du quantitatif de métré : incomplet dès qu'une quantité n'est pas validée. */
  summary: QuantitySummary
}

export interface QuantityInput {
  document: Pick<FabricsDocument, 'elements' | 'levels' | 'pascalQuantities' | 'plan'>
  /** Scène Pascal du projet (dalles) ; absente pour un plan qui n'en a pas encore. */
  scene?: PlanScene | null
  /** Métrés déjà calculés pour ce document (évite de les refaire). */
  building?: BuildingMeasurements
}

/** Les deux familles de quantités d'un plan. */
export function computeQuantities(input: QuantityInput): QuantitySet {
  const building = input.building ?? computeBuildingMeasurements(input.document)
  const slabs = input.scene ? slabMeasures(input.scene) : []
  // Dalle de niveau : lue dans l'emprise des murs de la scène ; sans scène, pas de dalle de niveau.
  const levelSlabList = input.scene
    ? levelSlabs({
        building,
        levels: input.document.levels ?? [],
        voids: collectStairVoids(input.document.elements, input.document.levels),
        footprints: levelFootprintAreas(input.scene),
        drawnSlabLevels: new Set(slabs.flatMap((slab) => (slab.levelId ? [slab.levelId] : []))),
      })
    : []
  const geometric = geometricQuantities(building, slabs, levelSlabList)
  const takeoff = takeoffQuantities(geometric, {
    building,
    elements: input.document.elements,
    settings: takeoffSettingsOf(input.document.plan?.takeoff),
  })
  const traceContext = { building, elements: input.document.elements, levels: input.document.levels ?? [], slabs, levelSlabs: levelSlabList }
  const statusContext = { building, elements: input.document.elements }
  const geometricList = [...withStatus(traceQuantities(geometric, traceContext), statusContext), ...unsupportedQuantities(input.scene, 'geometric')]
  const takeoffList = [...withStatus(traceQuantities(takeoff, traceContext), statusContext), ...unsupportedQuantities(input.scene, 'takeoff')]
  return { geometric: geometricList, takeoff: takeoffList, summary: quantitySummary(takeoffList) }
}

/** Somme d'un code sur une liste de quantités (valeur exacte, sans arrondi). */
export function sumQuantity(list: readonly QuantityResult[], code: QuantityResult['code']): number {
  return list.reduce((sum, q) => (q.code === code ? sum + q.value : sum), 0)
}
