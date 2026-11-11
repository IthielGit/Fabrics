import type { CanvasElement, OpeningElement, WallElement } from '../../types/document'
import { relocateOpening } from '../geometry/openings'

const isWall = (el: CanvasElement): el is WallElement => el.type === 'wall'
const isOpening = (el: CanvasElement): el is OpeningElement => el.type === 'opening'

/** Identifiants des ouvertures posées sur l'un des murs donnés. */
export function openingIdsOfWalls(
  elements: readonly CanvasElement[],
  wallIds: ReadonlySet<string>,
): string[] {
  return elements.filter((el) => isOpening(el) && wallIds.has(el.wallId)).map((el) => el.id)
}

/** Supprimer un mur supprime ses ouvertures : ajoute leurs identifiants à ceux à supprimer. */
export function withWallOpeningIds(
  elements: readonly CanvasElement[],
  ids: Iterable<string>,
): Set<string> {
  const target = new Set(ids)
  for (const id of openingIdsOfWalls(elements, target)) target.add(id)
  return target
}

/**
 * Copier ou dupliquer un mur emmène ses ouvertures : ajoute à `selected` les ouvertures des murs
 * sélectionnés (dans l'ordre du document, après leur mur).
 */
export function includeWallOpenings(
  all: readonly CanvasElement[],
  selected: readonly CanvasElement[],
): CanvasElement[] {
  const wallIds = new Set(selected.filter(isWall).map((el) => el.id))
  const ids = new Set(selected.map((el) => el.id))
  const extra = all.filter((el) => isOpening(el) && wallIds.has(el.wallId) && !ids.has(el.id))
  return extra.length === 0 ? [...selected] : [...selected, ...extra]
}

/** Vrai si `next` est `previous` déplacé d'un même décalage (ou inchangé). */
function isTranslation(previous: readonly number[], next: readonly number[]): boolean {
  if (previous.length !== next.length || previous.length < 2) return false
  const dx = next[0] - previous[0]
  const dy = next[1] - previous[1]
  return next.every((value, i) => Math.abs(value - previous[i] - (i % 2 === 0 ? dx : dy)) < 1e-6)
}

/**
 * Vrai si `next` est `previous` après un déplacement et/ou une rotation (mouvement rigide) : même
 * nombre de points et mêmes longueurs de segments (à 1 mm près, pour les arrondis). Les segments
 * gardent alors leur numéro et leur longueur, et les ouvertures leur place relative.
 */
function isRigidMotion(previous: readonly number[], next: readonly number[]): boolean {
  if (previous.length !== next.length || previous.length < 4) return false
  for (let i = 0; i + 3 < previous.length; i += 2) {
    const before = Math.hypot(previous[i + 2] - previous[i], previous[i + 3] - previous[i + 1])
    const after = Math.hypot(next[i + 2] - next[i], next[i + 3] - next[i + 1])
    if (Math.abs(before - after) > 1) return false
  }
  // Même forme, pas seulement mêmes longueurs : les angles entre segments doivent être conservés.
  for (let i = 0; i + 5 < previous.length; i += 2) {
    const cross = (p: readonly number[]) =>
      (p[i + 2] - p[i]) * (p[i + 5] - p[i + 3]) - (p[i + 3] - p[i + 1]) * (p[i + 4] - p[i + 2])
    const dot = (p: readonly number[]) =>
      (p[i + 2] - p[i]) * (p[i + 4] - p[i + 2]) + (p[i + 3] - p[i + 1]) * (p[i + 5] - p[i + 3])
    const scale = Math.max(1, Math.hypot(cross(previous), dot(previous)))
    if (Math.abs(cross(previous) - cross(next)) / scale > 0.01) return false
    if (Math.abs(dot(previous) - dot(next)) / scale > 0.01) return false
  }
  return true
}

/**
 * Remet les ouvertures d'accord avec leurs murs après une modification : quand la forme d'un mur
 * change (sommet déplacé, ajouté ou retiré), ses ouvertures restent à l'endroit où elles étaient
 * (projetées sur le segment le plus proche) ; celles qui ne tiennent plus sont supprimées.
 * Les ouvertures d'un mur modifié repartent de leur état dans `previous` : en rejouant un geste
 * depuis son début, une ouverture écartée un instant retrouve sa place d'origine.
 * Un mur simplement déplacé ne change rien (la place d'une ouverture est relative à son mur).
 * Renvoie `next` lui-même quand rien n'est à corriger.
 */
export function reconcileOpenings(
  previous: readonly CanvasElement[],
  next: readonly CanvasElement[],
): readonly CanvasElement[] {
  const previousWalls = new Map(previous.filter(isWall).map((wall) => [wall.id, wall]))
  const changed = new Map<string, { before: WallElement; after: WallElement }>()
  for (const element of next) {
    if (!isWall(element)) continue
    const before = previousWalls.get(element.id)
    if (!before || before.points === element.points) continue
    if (isTranslation(before.points, element.points) || isRigidMotion(before.points, element.points)) {
      continue
    }
    changed.set(element.id, { before, after: element })
  }
  if (changed.size === 0) return next

  const previousOpenings = new Map(previous.filter(isOpening).map((o) => [o.id, o]))
  const moved = new Map<string, OpeningElement | null>() // null = supprimée

  for (const [wallId, { before, after }] of changed) {
    const onWall = next
      .filter(isOpening)
      .filter((o) => o.wallId === wallId)
      .map((o) => previousOpenings.get(o.id) ?? o)
      .sort((a, b) => a.segmentIndex - b.segmentIndex || a.offset - b.offset)

    const placed: OpeningElement[] = []
    for (const opening of onWall) {
      const relocated = relocateOpening(opening, before, after, placed)
      moved.set(opening.id, relocated)
      if (relocated) placed.push(relocated)
    }
  }

  return next.flatMap((element) => {
    if (!isOpening(element) || !moved.has(element.id)) return [element]
    const relocated = moved.get(element.id)
    return relocated ? [relocated] : []
  })
}
