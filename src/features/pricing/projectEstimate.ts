/**
 * DQE d'un projet Plan (M23, 23.4) : quantités de métré de M21 → règles de l'espace (23.3) → montants.
 * Aucune quantité n'est recalculée ici : le DQE dérive du même quantitatif que les métrés (D79).
 */
import { computeQuantities, type QuantityInput } from '../measurements/quantities/quantitySet'
import { computeEstimate, type Estimate, type EstimateSettings } from './estimate'
import type { WorkItem } from './model'
import { elementFacts, matchQuantities, type PricingRule, type QuantityOverride } from './rules'

export interface ProjectEstimateInput {
  document: QuantityInput['document']
  scene?: QuantityInput['scene']
  building?: QuantityInput['building']
  rules: readonly PricingRule[]
  workItems: readonly WorkItem[]
  settings: EstimateSettings
  overrides?: readonly QuantityOverride[]
}

export function projectEstimate(input: ProjectEstimateInput): Estimate {
  const { takeoff } = computeQuantities({ document: input.document, scene: input.scene, building: input.building })
  const workItems = new Map(input.workItems.map((work) => [work.id, work]))
  const match = matchQuantities({
    quantities: takeoff,
    facts: elementFacts(input.document.elements),
    rules: input.rules,
    workItems,
    overrides: input.overrides,
  })
  return computeEstimate({
    lines: match.lines,
    workItems,
    settings: input.settings,
    uncoveredElementIds: match.uncoveredElementIds,
    warnings: match.warnings,
  })
}
