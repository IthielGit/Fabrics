import type { Level } from '../../../types/document'
import { cardinalDirection, type Cardinal } from '../north'
import type { BuildingModel } from '../types'
import {
  facesBounds,
  levelMarks,
  lookTowards,
  projectModel,
  type LevelMark,
  type ViewBounds,
  type ViewFace,
} from './projection'

export interface ElevationView {
  cardinal: Cardinal
  /** Faces à dessiner dans l'ordre (la plus lointaine d'abord). */
  faces: ViewFace[]
  /** Emprise de la vue (mm), ou `null` si elle est vide. */
  bounds: ViewBounds | null
  /** Altitudes des planchers, pour les cotes de niveaux. */
  levels: LevelMark[]
}

/**
 * Façade d'un point cardinal : vue de l'extérieur, du côté `cardinal` (la façade Nord est vue du
 * nord, en regardant vers le sud). Le nord est tourné de `northAngle` degrés.
 */
export function buildElevation(
  model: BuildingModel,
  levels: readonly Level[],
  cardinal: Cardinal,
  northAngle: number,
): ElevationView {
  const look = lookTowards(cardinalDirection(cardinal, northAngle))
  const faces = projectModel(model, look)
  return { cardinal, faces, bounds: facesBounds(faces), levels: levelMarks(levels) }
}
