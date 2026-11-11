import type { ChimneyElement, Level } from '../../types/document'
import type { Point } from '../geometry/viewport'
import type { WallPiece } from './types'

// Cheminées (M9, lot E) : fonctions pures.

/** Largeur par défaut d'un conduit de cheminée, en mm. */
export const DEFAULT_CHIMNEY_SIZE = 600
/** Dépassement par défaut au-dessus du dernier niveau, en mm. */
export const DEFAULT_CHIMNEY_HEIGHT_ABOVE_TOP = 800

const toRadians = (degrees: number) => (degrees * Math.PI) / 180

/** Les quatre coins de la cheminée dans le plan (x, y = coin haut-gauche avant rotation). */
export function chimneyFootprint(chimney: Pick<ChimneyElement, 'x' | 'y' | 'rotation' | 'width' | 'depth'>): Point[] {
  const angle = toRadians(chimney.rotation)
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return [
    [0, 0],
    [chimney.width, 0],
    [chimney.width, chimney.depth],
    [0, chimney.depth],
  ].map(([u, v]) => ({ x: chimney.x + u * cos - v * sin, y: chimney.y + u * sin + v * cos }))
}

/** Niveau d'une cheminée : le sien, ou le premier niveau (niveaux triés par altitude). */
function chimneyLevel(chimney: Pick<ChimneyElement, 'levelId'>, levels: readonly Level[]): Level | undefined {
  const sorted = [...levels].sort((a, b) => a.elevation - b.elevation)
  return sorted.find((level) => level.id === chimney.levelId) ?? sorted[0]
}

/** Vrai si le conduit traverse le niveau `levelId` (un niveau au-dessus du sien). */
export function chimneyRisesThrough(
  chimney: Pick<ChimneyElement, 'levelId'>,
  levels: readonly Level[],
  levelId: string,
): boolean {
  const own = chimneyLevel(chimney, levels)
  const target = levels.find((level) => level.id === levelId)
  return own !== undefined && target !== undefined && target.elevation > own.elevation
}

/**
 * Volume 3D d'une cheminée : du plancher de son niveau jusqu'au dessus du dernier niveau affiché,
 * plus `heightAboveTop`. Une seule boîte, orientée autour de l'axe vertical ; elle ne perce pas les
 * dalles. `visibleLevels` = niveaux affichés (tous, ou jusqu'au niveau actif).
 */
export function buildChimney(
  chimney: ChimneyElement,
  level: Level,
  visibleLevels: readonly Level[],
): WallPiece | null {
  const top = visibleLevels.reduce((max, l) => Math.max(max, l.elevation + l.height), level.elevation + level.height)
  const height = top + chimney.heightAboveTop - level.elevation
  if (height < 1) return null
  const [a, , c] = chimneyFootprint(chimney)
  return {
    sourceId: chimney.id,
    levelId: level.id,
    center: { x: (a.x + c.x) / 2, y: level.elevation + height / 2, z: (a.y + c.y) / 2 },
    size: { x: chimney.width, y: height, z: chimney.depth },
    rotationY: -toRadians(chimney.rotation),
  }
}
