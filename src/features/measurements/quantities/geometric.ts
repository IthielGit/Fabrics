/**
 * Quantités géométriques (M21, 21.1) : les métrés existants (`computeBuildingMeasurements`) mis sous
 * forme de `QuantityResult`, sans aucun nouveau calcul de forme. Les valeurs sont donc exactement
 * celles des tableaux de métrés (anti-régression). Fonctions pures.
 */
import type { SlabMeasure } from '../../scene/slabMeasures'
import type { BuildingMeasurements, Measurements } from '../measurements'
import type { LevelSlab } from './levelSlabs'
import { ruleOf } from './rules'
import { QUANTITY_DIMENSIONS, categoryOf, quantityKey, type QuantityCode, type QuantityResult } from './types'

function result(code: QuantityCode, value: number, elementId: string, levelId: string | null, partId: string | null = null): QuantityResult {
  return {
    key: quantityKey('geometric', code, elementId, partId),
    family: 'geometric',
    category: categoryOf(code),
    code,
    dimension: QUANTITY_DIMENSIONS[code],
    value,
    elementIds: [elementId],
    partId,
    levelId,
    rule: ruleOf('geometric', code),
  }
}

/** Quantités géométriques des métrés d'un niveau, dans l'ordre des tableaux (murs, ouvertures, pièces…). */
export function geometricQuantitiesOfLevel(m: Measurements, levelId: string | null): QuantityResult[] {
  const out: QuantityResult[] = []
  const push = (code: QuantityCode, value: number, elementId: string, partId: string | null = null) =>
    out.push(result(code, value, elementId, levelId, partId))

  for (const wall of m.walls) {
    push('wall.length', wall.length, wall.id)
    push('wall.grossArea', wall.wallArea, wall.id)
    push('wall.openingsArea', wall.openingsArea, wall.id)
    push('wall.netArea', wall.netArea, wall.id)
    push('wall.facesLength', wall.facesLength, wall.id)
    push('wall.facesGrossArea', wall.facesArea, wall.id)
    push('wall.facesNetArea', wall.facesNetArea, wall.id)
    // Volume brut = volume net + ouvertures × épaisseur (le volume net les a retirées une fois ;
    // la part d'un raccord en T reste retirée des deux). Un mur de hauteur nulle n'a pas d'ouverture
    // mesurée : brut et net valent 0.
    push('wall.grossVolume', wall.volume + wall.openingsArea * wall.thickness, wall.id)
    push('wall.netVolume', wall.volume, wall.id)
    for (const layer of wall.layers ?? []) {
      push('wallLayer.area', layer.area, wall.id, layer.id)
      push('wallLayer.volume', layer.volume, wall.id, layer.id)
    }
  }
  for (const opening of m.openings) {
    push('opening.count', 1, opening.id)
    push('opening.area', opening.area, opening.id)
  }
  for (const room of m.rooms) {
    push('room.area', room.area, room.id)
    push('room.perimeter', room.perimeter, room.id)
    push('room.voidArea', room.voidArea, room.id)
    push('room.netArea', room.netArea, room.id)
    push('room.habitableArea', room.habitableArea, room.id)
  }
  for (const platform of m.platforms) {
    push('platform.area', platform.area, platform.id)
    push('platform.volume', platform.volume, platform.id)
  }
  for (const roof of m.roofs) {
    push('roof.projectedArea', roof.projectedArea, roof.id)
    push('roof.realArea', roof.realArea, roof.id)
    push('roof.ridgeLength', roof.ridgeLength, roof.id)
    push('roof.eaveLength', roof.eaveLength, roof.id)
    push('roof.hipLength', roof.hipLength, roof.id)
    push('roof.gableCount', roof.gableCount, roof.id)
  }
  for (const stair of m.stairs) {
    push('stair.count', 1, stair.id)
    // Sans niveau au-dessus, le nombre de marches n'est pas connu : pas de quantité (statut en 21.4).
    if (stair.risers !== null) push('stair.risers', stair.risers, stair.id)
    if (stair.treads !== null) push('stair.treads', stair.treads, stair.id)
  }
  for (const chimney of m.chimneys) {
    push('chimney.count', 1, chimney.id)
    push('chimney.area', chimney.area, chimney.id)
  }
  return out
}

/** Quantités des dalles de la scène Pascal (`scene/slabMeasures.ts`, M19 B6). */
export function slabQuantities(slabs: readonly SlabMeasure[]): QuantityResult[] {
  return slabs.flatMap((slab) => [
    result('slab.area', slab.area, slab.id, slab.levelId),
    result('slab.perimeter', slab.perimeter, slab.id, slab.levelId),
    result('slab.volume', slab.volume, slab.id, slab.levelId),
  ])
}

/** Partie « dalle de niveau » d'un niveau (la quantité est rattachée au niveau). */
export const LEVEL_SLAB_PART = 'levelSlab'

/** Quantités des dalles de niveau (`levelSlabs.ts`), quand le niveau n'a pas de dalle dessinée. */
export function levelSlabQuantities(slabs: readonly LevelSlab[]): QuantityResult[] {
  return slabs.flatMap((slab) => [
    result('slab.area', slab.area, slab.levelId, slab.levelId, LEVEL_SLAB_PART),
    result('slab.volume', slab.volume, slab.levelId, slab.levelId, LEVEL_SLAB_PART),
  ])
}

/**
 * Quantités géométriques de tout le bâtiment, niveau par niveau (du plus bas au plus haut), puis
 * les dalles de la scène (dans l'ordre de la scène) et les dalles de niveau.
 */
export function geometricQuantities(
  building: BuildingMeasurements,
  slabs: readonly SlabMeasure[] = [],
  levelSlabList: readonly LevelSlab[] = [],
): QuantityResult[] {
  return [
    ...building.levels.flatMap((entry) => geometricQuantitiesOfLevel(entry.measurements, entry.level.id)),
    ...slabQuantities(slabs),
    ...levelSlabQuantities(levelSlabList),
  ]
}
