import type { FabricsDocument } from '../../types/document'
import { computeBuildingMeasurements } from '../measurements/measurements'
import { collectStairVoids } from '../stairs/voids'
import { clientDimensions } from './clientDimensions'
import { executionDimensions, type ExecutionLabels } from './executionDimensions'
import type { AutoAnnotations, DimensioningMode } from './types'

const EMPTY: AutoAnnotations = { dimensions: [], labels: [] }

/**
 * Cotes automatiques d'un niveau selon le réglage « Cotation ». Les quantités viennent des métrés du
 * bâtiment (`computeBuildingMeasurements`), les repères aussi : un seul calcul pour tout.
 * Les axes de construction (sans niveau) servent à la chaîne 2 des façades.
 */
export function levelAnnotations(
  document: Pick<FabricsDocument, 'elements' | 'levels'>,
  levelId: string,
  mode: DimensioningMode,
  labels: ExecutionLabels,
): AutoAnnotations {
  if (mode === 'none') return EMPTY
  const levels = [...(document.levels ?? [])].sort((a, b) => a.elevation - b.elevation)
  const index = levels.findIndex((level) => level.id === levelId)
  if (index < 0) return EMPTY
  const building = computeBuildingMeasurements(document)
  const entry = building.levels.find((l) => l.level.id === levelId)
  if (!entry) return EMPTY
  const own = document.elements.filter((el) => el.levelId === levelId)
  if (mode === 'client') return clientDimensions(own, entry.measurements.rooms)
  const axes = document.elements.filter((el) => el.type === 'axis' && el.levelId === undefined)
  return executionDimensions([...own, ...axes], {
    level: levels[index],
    levelAbove: levels[index + 1],
    measurements: entry.measurements,
    references: building.refs,
    voids: collectStairVoids(document.elements, document.levels).filter((v) => v.levelId === levelId),
    labels,
  })
}
