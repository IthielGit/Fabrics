import type { CanvasElement, FurnitureElement } from '../../types/document'
import { elementBounds } from '../export/bounds'
import { unionBoxes } from '../geometry/box'
import type { SetDef, SetMember } from './catalog/sets'
import type { UserSet } from './userRegistry'

/** Nombre maximal d'ensembles gardés par l'utilisateur. */
export const MAX_USER_SETS = 50
/** Longueur maximale du nom d'un ensemble. */
export const MAX_USER_SET_NAME = 60

const isFurniture = (element: CanvasElement): element is FurnitureElement => element.type === 'furniture'

/** Nombre d'objets de la bibliothèque dans la sélection (les seuls éléments qu'un ensemble garde). */
export function countSavableObjects(elements: readonly CanvasElement[]): number {
  return elements.filter(isFurniture).length
}

/**
 * Ensemble personnel à partir d'une sélection : les objets de la bibliothèque (position, rotation,
 * taille, retournement) relatifs au coin haut-gauche de leur emprise commune. Les murs, pièces et
 * autres éléments ne sont pas gardés. `null` sans objet ou sans nom.
 */
export function createUserSet(
  selection: readonly CanvasElement[],
  name: string,
  id: string = `user-${crypto.randomUUID()}`,
): UserSet | null {
  const cleanName = name.trim().slice(0, MAX_USER_SET_NAME)
  const objects = selection.filter(isFurniture)
  if (objects.length === 0 || cleanName === '') return null
  const box = unionBoxes(objects.flatMap((object) => elementBounds(object) ?? []))
  if (!box) return null
  const members: SetMember[] = objects.map((object) => ({
    symbol: object.symbol,
    x: Math.round(object.x - box.x),
    y: Math.round(object.y - box.y),
    rotation: object.rotation,
    width: object.width,
    depth: object.depth,
    ...(object.mirrored ? { mirrored: true } : {}),
  }))
  const def: SetDef = {
    id,
    category: 'sets',
    width: Math.max(1, Math.round(box.width)),
    depth: Math.max(1, Math.round(box.height)),
    members,
  }
  return { id, name: cleanName, def }
}

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

function parseMember(value: unknown): SetMember | null {
  if (typeof value !== 'object' || value === null) return null
  const m = value as Record<string, unknown>
  if (typeof m.symbol !== 'string' || !isNumber(m.x) || !isNumber(m.y)) return null
  if (!isNumber(m.rotation) || !isNumber(m.width) || !isNumber(m.depth)) return null
  if (m.width <= 0 || m.depth <= 0) return null
  return {
    symbol: m.symbol,
    x: m.x,
    y: m.y,
    rotation: m.rotation,
    width: m.width,
    depth: m.depth,
    ...(m.mirrored === true ? { mirrored: true } : {}),
  }
}

/** Lit les ensembles enregistrés (JSON) ; une entrée invalide est ignorée, un texte invalide donne une liste vide. */
export function parseUserSets(raw: string | null): UserSet[] {
  if (raw === null) return []
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return []
  }
  if (!Array.isArray(value)) return []
  const sets: UserSet[] = []
  const seen = new Set<string>()
  for (const item of value) {
    if (typeof item !== 'object' || item === null) continue
    const entry = item as Record<string, unknown>
    if (typeof entry.id !== 'string' || !entry.id.startsWith('user-') || seen.has(entry.id)) continue
    if (typeof entry.name !== 'string' || entry.name.trim() === '') continue
    const def = entry.def as Record<string, unknown> | undefined
    if (!def || !isNumber(def.width) || !isNumber(def.depth) || !Array.isArray(def.members)) continue
    const members = def.members.map(parseMember)
    if (members.length === 0 || members.some((member) => member === null)) continue
    seen.add(entry.id)
    sets.push({
      id: entry.id,
      name: entry.name.slice(0, MAX_USER_SET_NAME),
      def: { id: entry.id, category: 'sets', width: def.width, depth: def.depth, members: members as SetMember[] },
    })
  }
  return sets.slice(0, MAX_USER_SETS)
}

/** Ajoute un ensemble en tête de liste (les plus récents d'abord) ; au-delà de la limite, le plus ancien part. */
export function addUserSet(sets: readonly UserSet[], set: UserSet): UserSet[] {
  return [set, ...sets.filter((existing) => existing.id !== set.id)].slice(0, MAX_USER_SETS)
}

export function removeUserSet(sets: readonly UserSet[], id: string): UserSet[] {
  return sets.filter((set) => set.id !== id)
}
