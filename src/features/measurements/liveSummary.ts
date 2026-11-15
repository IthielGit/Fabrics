import type { BuildingMeasurements } from './measurements'

/** Résumé des métrés du niveau affiché, pour la barre « métrés en direct » (M15 bis, lot D). */
export interface LiveMetresSummary {
  rooms: number
  /** Surface totale des pièces, en mm² (la même que sur les étiquettes des pièces). */
  roomArea: number
  /** Longueur totale des murs, en mm. */
  wallLength: number
}

const EMPTY: LiveMetresSummary = { rooms: 0, roomArea: 0, wallLength: 0 }

/** Résumé du niveau `activeLevelId` ; un niveau inconnu (ou aucun) donne un résumé vide. */
export function liveMetresSummary(
  building: Pick<BuildingMeasurements, 'levels'>,
  activeLevelId: string | null,
): LiveMetresSummary {
  const active = building.levels.find((entry) => entry.level.id === activeLevelId)
  if (!active) return EMPTY
  const { rooms, totals } = active.measurements
  return { rooms: rooms.length, roomArea: totals.roomArea, wallLength: totals.wallLength }
}
