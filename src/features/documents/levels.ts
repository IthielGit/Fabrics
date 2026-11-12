import type { CanvasElement, Level } from '../../types/document'
import { cloneElements } from './elements'
import { includeWallOpenings } from './wallOpenings'

/** Hauteur d'étage par défaut, en mm. */
export const DEFAULT_LEVEL_HEIGHT = 2700
/** Épaisseur de dalle par défaut, en mm. */
export const DEFAULT_SLAB_THICKNESS = 200
/** Hauteur d'étage minimale acceptée, en mm. */
export const MIN_LEVEL_HEIGHT = 100

export function createLevel(
  name: string,
  elevation: number,
  height: number = DEFAULT_LEVEL_HEIGHT,
  slabThickness: number = DEFAULT_SLAB_THICKNESS,
): Level {
  return { id: crypto.randomUUID(), name, elevation, height, slabThickness }
}

/** Niveaux triés par altitude croissante (à altitude égale, l'ordre d'origine est gardé). */
export function sortLevels(levels: readonly Level[]): Level[] {
  return [...levels].sort((a, b) => a.elevation - b.elevation)
}

/**
 * Empile les niveaux à partir de l'indice `fromIndex` : chaque niveau au-dessus démarre là où
 * finit celui du dessous (altitude + hauteur d'étage). Les niveaux en dessous ne changent pas.
 */
export function restackLevels(levels: readonly Level[], fromIndex = 0): Level[] {
  const next = [...levels]
  for (let i = Math.max(fromIndex, 0) + 1; i < next.length; i += 1) {
    const below = next[i - 1]
    const elevation = below.elevation + below.height
    if (next[i].elevation !== elevation) next[i] = { ...next[i], elevation }
  }
  return next
}

/** « Étage 2 » : numéro = nombre de niveaux existants (le rez-de-chaussée est le niveau 0). */
export function nextLevelName(levels: readonly Level[], floorName: (n: number) => string): string {
  return floorName(levels.length)
}

/** Altitude du plancher d'un niveau posé juste au-dessus de `level`. */
export function elevationAbove(level: Level): number {
  return level.elevation + level.height
}

/** Niveau le plus haut d'une liste triée. */
function topLevel(levels: readonly Level[]): Level | undefined {
  return levels[levels.length - 1]
}

/** Nouveau niveau au sommet du bâtiment, avec la hauteur du niveau du dessous. */
export function newTopLevel(levels: readonly Level[], name: string): Level {
  const top = topLevel(levels)
  if (!top) return createLevel(name, 0)
  return createLevel(name, elevationAbove(top), top.height, top.slabThickness)
}

/** Insère `level` juste au-dessus de `sourceId` ; les niveaux plus hauts sont remontés d'autant. */
export function insertLevelAbove(
  levels: readonly Level[],
  sourceId: string,
  level: Level,
): Level[] {
  const index = levels.findIndex((l) => l.id === sourceId)
  if (index === -1) return [...levels]
  const source = levels[index]
  const next = [...levels]
  next.splice(index + 1, 0, { ...level, elevation: elevationAbove(source) })
  return restackLevels(next, index + 1)
}

/**
 * Échange un niveau avec son voisin (`'up'` = vers le haut du bâtiment) puis recalcule les
 * altitudes à partir du niveau le plus bas : la liste reste triée par altitude.
 * Renvoie la même liste (même référence) si le déplacement est impossible.
 */
export function moveLevel(
  levels: readonly Level[],
  id: string,
  direction: 'up' | 'down',
): readonly Level[] {
  const index = levels.findIndex((l) => l.id === id)
  const swapWith = direction === 'up' ? index + 1 : index - 1
  if (index === -1 || swapWith < 0 || swapWith >= levels.length) return levels
  const next = [...levels]
  ;[next[index], next[swapWith]] = [next[swapWith], next[index]]
  // Le niveau le plus bas garde l'altitude du plancher de départ.
  const base = levels[0].elevation
  next[0] = { ...next[0], elevation: base }
  return restackLevels(next, 0)
}

export type LevelPatch = Partial<Pick<Level, 'name' | 'elevation' | 'height' | 'slabThickness'>>

/**
 * Modifie un niveau (nom, altitude, hauteur d'étage, épaisseur de dalle) ; la liste est retriée par
 * altitude. Les valeurs invalides sont ignorées. Même référence si rien ne change.
 */
export function updateLevel(
  levels: readonly Level[],
  id: string,
  patch: LevelPatch,
): readonly Level[] {
  const current = levels.find((l) => l.id === id)
  if (!current) return levels
  const next: Level = { ...current }
  if (patch.name !== undefined && patch.name.trim() !== '') next.name = patch.name.trim()
  if (patch.elevation !== undefined && Number.isFinite(patch.elevation)) {
    next.elevation = Math.round(patch.elevation)
  }
  if (patch.height !== undefined && Number.isFinite(patch.height)) {
    next.height = Math.max(MIN_LEVEL_HEIGHT, Math.round(patch.height))
  }
  if (patch.slabThickness !== undefined && Number.isFinite(patch.slabThickness)) {
    next.slabThickness = Math.max(0, Math.round(patch.slabThickness))
  }
  const unchanged = (Object.keys(next) as (keyof Level)[]).every((key) => next[key] === current[key])
  if (unchanged) return levels
  const sorted = sortLevels(levels.map((l) => (l.id === id ? next : l)))

  // Changer la hauteur d'étage d'un niveau empilé sous le suivant (le niveau du dessus démarre
  // exactement là où il finissait) remonte ou descend d'autant les niveaux au-dessus : le
  // bâtiment reste empilé, et les escaliers se recalculent.
  const delta = next.height - current.height
  const index = sorted.findIndex((l) => l.id === id)
  const above = sorted[index + 1]
  if (delta !== 0 && above && above.elevation === current.elevation + current.height) {
    return sorted.map((l, i) => (i > index ? { ...l, elevation: l.elevation + delta } : l))
  }
  return sorted
}

/**
 * Retire un niveau ; les niveaux au-dessus redescendent d'autant. Même référence s'il est le seul
 * niveau ou s'il n'existe pas (un plan garde toujours au moins un niveau).
 */
export function removeLevel(levels: readonly Level[], id: string): readonly Level[] {
  const index = levels.findIndex((l) => l.id === id)
  if (index === -1 || levels.length <= 1) return levels
  const next = levels.filter((l) => l.id !== id)
  return restackLevels(next, Math.max(index - 1, 0))
}

/**
 * Vrai pour les éléments communs à tous les niveaux (axes de construction, lignes de coupe) : ils ne reçoivent
 * jamais de `levelId`, ni à la création ni au collage.
 */
export function isLevelIndependent(element: CanvasElement): boolean {
  return element.type === 'axis' || element.type === 'section'
}

/** Éléments visibles sur un niveau : ceux de ce niveau et ceux communs à tous les niveaux. */
export function elementsOnLevel(
  elements: readonly CanvasElement[],
  levelId: string,
): CanvasElement[] {
  return elements.filter((el) => el.levelId === undefined || el.levelId === levelId)
}

/** Éléments qui appartiennent en propre à un niveau (hors éléments communs). */
export function elementsOfLevel(
  elements: readonly CanvasElement[],
  levelId: string,
): CanvasElement[] {
  return elements.filter((el) => el.levelId === levelId)
}

/** Niveau juste en dessous de `levelId` (niveau de référence), s'il existe. */
export function levelBelow(levels: readonly Level[], levelId: string): Level | undefined {
  const index = levels.findIndex((l) => l.id === levelId)
  return index > 0 ? levels[index - 1] : undefined
}

/** Niveau juste au-dessus de `levelId`, s'il existe. */
export function levelAbove(levels: readonly Level[], levelId: string): Level | undefined {
  const index = levels.findIndex((l) => l.id === levelId)
  return index >= 0 && index + 1 < levels.length ? levels[index + 1] : undefined
}

/**
 * Niveaux de référence du niveau actif : celui du dessous quand `showLower`, celui du dessus quand
 * `showUpper` (les deux s'affichent en transparence et attirent le tracé). Vide sans niveau actif.
 */
export function referenceLevels(
  levels: readonly Level[] | undefined,
  activeLevelId: string | null,
  showLower: boolean,
  showUpper: boolean,
): Level[] {
  if (!levels || activeLevelId === null) return []
  const lower = showLower ? levelBelow(levels, activeLevelId) : undefined
  const upper = showUpper ? levelAbove(levels, activeLevelId) : undefined
  return [lower, upper].filter((level): level is Level => level !== undefined)
}

/**
 * Copie d'un niveau : ses murs (avec leurs ouvertures) sont recopiés au même endroit sur
 * `targetLevelId`. Les pièces, cotes, textes et images ne sont pas copiés.
 */
export function copyLevelWalls(
  elements: readonly CanvasElement[],
  sourceLevelId: string,
  targetLevelId: string,
): CanvasElement[] {
  const walls = elementsOfLevel(elements, sourceLevelId).filter((el) => el.type === 'wall')
  const withOpenings = includeWallOpenings(elements, walls)
  return cloneElements(withOpenings, 0).map((el) => ({ ...el, levelId: targetLevelId }))
}

/**
 * Niveau à afficher après un changement du document : le niveau actif s'il existe encore,
 * sinon le plus bas ; `null` pour un document sans niveaux (visuel).
 */
export function validActiveLevelId(
  levels: readonly Level[] | undefined,
  current: string | null,
): string | null {
  if (!levels || levels.length === 0) return null
  return levels.some((l) => l.id === current) ? current : levels[0].id
}
