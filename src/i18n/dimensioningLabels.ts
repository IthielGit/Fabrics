import type { ExecutionLabels } from '../features/dimensioning/executionDimensions'
import { fr } from './fr'

/** Textes des cotes d'exécution (allège, altitudes, trémie, escaliers), venus de `fr.ts`. */
export const EXECUTION_LABELS: ExecutionLabels = {
  sill: fr.dimensioning.sill,
  floor: fr.dimensioning.floor,
  slab: fr.dimensioning.slab,
  ceiling: fr.dimensioning.ceiling,
  stairVoid: fr.dimensioning.stairVoid,
  risers: fr.dimensioning.risers,
  tread: fr.dimensioning.tread,
}
