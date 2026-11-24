/**
 * Contrôles qualité du quantitatif (M21, 21.7), ajoutés aux avertissements des métrés
 * (`warnings.ts`, un seul système d'avertissements) :
 * - géométrie incohérente : ouverture plus haute que son mur, contour de pièce qui se croise,
 *   toiture impossible à calculer, ouverture sans largeur ou sans hauteur ;
 * - propriétés manquantes : mur sans matériau ni composition (EDGE-01 « missing-material »), pièce
 *   sans nom ;
 * - unités incompatibles : épaisseur, hauteur ou largeur hors des valeurs plausibles en mm, signe
 *   probable d'une saisie en m ou en cm (ex. épaisseur 0,2 ou 20 au lieu de 200).
 * Rien n'est corrigé ni bloqué : ces points sont signalés. Fonctions pures.
 */
import type { CanvasElement, Level, OpeningElement, RoomElement, WallElement } from '../../types/document'
import { isOpeningOutside } from '../geometry/openings'
import type { BuildingMeasurements, Measurements } from './measurements'

/** Grandeur contrôlée par le contrôle d'unités. */
export type UnitField = 'wallThickness' | 'wallHeight' | 'openingWidth' | 'openingHeight' | 'levelHeight'

/** Plage plausible (mm) de chaque grandeur ; en dehors, l'unité est probablement fausse. */
export const PLAUSIBLE_MM: Record<UnitField, [number, number]> = {
  wallThickness: [20, 1500],
  wallHeight: [300, 20000],
  openingWidth: [100, 15000],
  openingHeight: [100, 15000],
  levelHeight: [1000, 20000],
}

export type QualityWarning =
  | { kind: 'openingTooTall'; levelId: string; openingId: string; openingRef: string; wallRef: string }
  | { kind: 'openingInvalidSize'; levelId: string; openingId: string; openingRef: string }
  | { kind: 'roomSelfIntersecting'; levelId: string; roomId: string; roomName: string }
  | { kind: 'roofInvalid'; levelId: string; roofId: string; roofName: string }
  | { kind: 'wallNoMaterial'; levelId: string; wallId: string; wallRef: string }
  | { kind: 'roomNoName'; levelId: string; roomId: string; roomName: string }
  | { kind: 'suspiciousUnit'; levelId: string; elementId: string; elementRef: string; field: UnitField; value: number }

/** Vrai si les segments [a, b] et [c, d] se coupent franchement (sans toucher seulement un bout). */
function properCross(a: number[], b: number[], c: number[], d: number[]): boolean {
  const orient = (p: number[], q: number[], r: number[]) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]))
  const o1 = orient(a, b, c)
  const o2 = orient(a, b, d)
  const o3 = orient(c, d, a)
  const o4 = orient(c, d, b)
  return o1 * o2 < 0 && o3 * o4 < 0
}

/** Contour fermé dont deux côtés non voisins se croisent (surface fausse). */
export function isSelfIntersecting(points: readonly number[]): boolean {
  const n = points.length / 2
  if (n < 4) return false
  const p = (i: number) => [points[2 * (i % n)], points[2 * (i % n) + 1]]
  for (let i = 0; i < n; i++) {
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue // côtés voisins par la fermeture
      if (properCross(p(i), p(i + 1), p(j), p(j + 1))) return true
    }
  }
  return false
}

const outOfRange = (field: UnitField, value: number) =>
  Number.isFinite(value) && value > 0 && (value < PLAUSIBLE_MM[field][0] || value > PLAUSIBLE_MM[field][1])

/** Contrôles qualité d'un niveau. */
export function qualityChecks(
  level: Level,
  elements: readonly CanvasElement[],
  measurements: Measurements,
  building: BuildingMeasurements,
): QualityWarning[] {
  const out: QualityWarning[] = []
  const levelId = level.id
  const walls = new Map(elements.filter((el): el is WallElement => el.type === 'wall').map((w) => [w.id, w]))
  const ref = (id: string, fallback: string) => building.refs.openings.get(id) ?? building.refs.walls.get(id) ?? fallback
  const unit = (elementId: string, elementRef: string, field: UnitField, value: number) => {
    if (outOfRange(field, value)) out.push({ kind: 'suspiciousUnit', levelId, elementId, elementRef, field, value })
  }

  unit(level.id, level.name, 'levelHeight', level.height)
  for (const wall of walls.values()) {
    const wallRef = ref(wall.id, wall.name)
    if (!wall.material && !(wall.layers?.length)) out.push({ kind: 'wallNoMaterial', levelId, wallId: wall.id, wallRef })
    unit(wall.id, wallRef, 'wallThickness', wall.thickness)
    unit(wall.id, wallRef, 'wallHeight', wall.height)
  }
  for (const opening of elements.filter((el): el is OpeningElement => el.type === 'opening')) {
    const wall = walls.get(opening.wallId)
    const openingRef = ref(opening.id, opening.name)
    if (!(opening.width > 0) || !(opening.height > 0)) {
      out.push({ kind: 'openingInvalidSize', levelId, openingId: opening.id, openingRef })
      continue
    }
    unit(opening.id, openingRef, 'openingWidth', opening.width)
    unit(opening.id, openingRef, 'openingHeight', opening.height)
    if (wall && wall.height > 0 && !isOpeningOutside(opening, wall) && opening.sillHeight + opening.height > wall.height) {
      out.push({ kind: 'openingTooTall', levelId, openingId: opening.id, openingRef, wallRef: ref(wall.id, wall.name) })
    }
  }
  elements
    .filter((el): el is RoomElement => el.type === 'room')
    .forEach((room, index) => {
      const roomName = room.name.trim() || `#${index + 1}`
      if (!room.name.trim()) out.push({ kind: 'roomNoName', levelId, roomId: room.id, roomName })
      if (isSelfIntersecting(room.points)) out.push({ kind: 'roomSelfIntersecting', levelId, roomId: room.id, roomName })
    })
  for (const roof of measurements.roofs) {
    if (roof.problem !== null && roof.problem !== 'trimmed' && roof.problem !== 'overlapCheck') {
      out.push({ kind: 'roofInvalid', levelId, roofId: roof.id, roofName: roof.name })
    }
  }
  return out
}
