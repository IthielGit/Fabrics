/**
 * Recalcul ciblé du quantitatif (M21, 21.5) : après une modification, seules les quantités des
 * éléments touchés sont recalculées ; les autres sont reprises telles quelles (même objet).
 *
 * 1. Éléments modifiés : ajoutés, supprimés ou changés (empreinte de leurs données), y compris les
 *    toitures et escaliers de Pascal (`pascalQuantities`).
 * 2. Éléments dépendants : un mur entraîne ses ouvertures, les murs qui le touchent (raccords, faces)
 *    et les pièces de son niveau (plinthes) ; une ouverture entraîne son mur et les pièces de son
 *    niveau ; un escalier, une toiture ou une plateforme entraînent les pièces (trémies, surface
 *    habitable).
 * 3. Les métrés ne sont refaits que pour les niveaux qui contiennent un élément touché ; les autres
 *    niveaux sont repris du calcul précédent.
 * Un élément dont le nom affiché change est traité comme modifié. Les niveaux ou les réglages de
 * métré qui changent entraînent un recalcul complet.
 * Les dalles et les éléments non pris en charge de la scène sont toujours recalculés (peu nombreux).
 * Fonctions pures.
 */
import type { CanvasElement, FabricsDocument } from '../../../types/document'
import { withDisplayNames } from '../../naming/autoNames'
import type { PlanScene } from '../../scene/sceneTypes'
import { computeBuildingMeasurements, type BuildingMeasurements, type Measurements } from '../measurements'
import { computeQuantities, type QuantitySet } from './quantitySet'
import { quantitySummary, type Quantity } from './status'

export interface QuantityCache {
  /** Empreinte de chaque élément (et de chaque toiture ou escalier de Pascal). */
  fingerprints: Map<string, string>
  /** Empreinte de ce qui force un recalcul complet (niveaux, réglages, noms affichés). */
  globalKey: string
  /** Niveau de chaque élément. */
  levelOf: Map<string, string | null>
  building: BuildingMeasurements
  set: QuantitySet
}

export interface QuantityUpdate {
  cache: QuantityCache
  /** Éléments dont les quantités ont été recalculées ; `null` : recalcul complet. */
  recomputed: Set<string> | null
  /** Niveaux dont les métrés ont été refaits. */
  recomputedLevels: Set<string>
}

type Doc = Pick<FabricsDocument, 'elements' | 'levels' | 'pascalQuantities' | 'plan'>

function fingerprintsOf(doc: Doc): { fingerprints: Map<string, string>; levelOf: Map<string, string | null> } {
  const fingerprints = new Map<string, string>()
  const levelOf = new Map<string, string | null>()
  // Le nom affiché (« Mur isolé », numéros…) dépend de tout le plan : il fait partie de l'empreinte.
  const shown = new Map(withDisplayNames(doc.elements).map((el) => [el.id, el.name]))
  for (const el of doc.elements) {
    fingerprints.set(el.id, JSON.stringify({ ...el, shownName: shown.get(el.id) }))
    levelOf.set(el.id, el.levelId ?? null)
  }
  for (const q of [...(doc.pascalQuantities?.roofs ?? []), ...(doc.pascalQuantities?.stairs ?? [])]) {
    fingerprints.set(q.id, JSON.stringify(q))
    levelOf.set(q.id, q.levelId)
  }
  return { fingerprints, levelOf }
}

function globalKeyOf(doc: Doc): string {
  return JSON.stringify([doc.levels ?? [], doc.plan?.takeoff ?? null])
}

/** Axe-aligné : boîte d'un mur (mm), élargie de son épaisseur. */
function wallBox(el: CanvasElement): [number, number, number, number] | null {
  if (el.type !== 'wall') return null
  const xs = el.points.filter((_, i) => i % 2 === 0)
  const ys = el.points.filter((_, i) => i % 2 === 1)
  const m = el.thickness
  return [Math.min(...xs) - m, Math.min(...ys) - m, Math.max(...xs) + m, Math.max(...ys) + m]
}

const touches = (a: [number, number, number, number], b: [number, number, number, number]) =>
  a[0] <= b[2] && b[0] <= a[2] && a[1] <= b[3] && b[1] <= a[3]

/** Éléments touchés : les modifiés et ceux qui en dépendent (dans l'ancien et le nouveau plan). */
export function affectedElements(changed: ReadonlySet<string>, before: readonly CanvasElement[], after: readonly CanvasElement[]): Set<string> {
  const out = new Set(changed)
  const levelsWithRooms = new Set<string | null>()
  let allRooms = false
  for (const elements of [before, after]) {
    const byId = new Map(elements.map((el) => [el.id, el]))
    for (const id of changed) {
      const el = byId.get(id)
      if (!el) continue
      if (el.type === 'wall') {
        const box = wallBox(el)!
        for (const other of elements) {
          if (other.type === 'opening' && other.wallId === id) out.add(other.id)
          const otherBox = other.levelId === el.levelId ? wallBox(other) : null
          if (otherBox && touches(box, otherBox)) out.add(other.id)
        }
        levelsWithRooms.add(el.levelId ?? null)
      } else if (el.type === 'opening') {
        out.add(el.wallId)
        levelsWithRooms.add(el.levelId ?? null)
      } else if (el.type === 'stair' || el.type === 'roof' || el.type === 'platform') {
        allRooms = true
      }
    }
  }
  // Toiture ou escalier de Pascal modifié : surface habitable et trémies des pièces.
  if ([...changed].some((id) => !before.some((el) => el.id === id) && !after.some((el) => el.id === id))) allRooms = true
  for (const el of after) {
    if (el.type === 'room' && (allRooms || levelsWithRooms.has(el.levelId ?? null))) out.add(el.id)
  }
  return out
}

/** Premier calcul : tout. */
export function initialQuantities(doc: Doc, scene: PlanScene | null): QuantityCache {
  const building = computeBuildingMeasurements(doc)
  const set = computeQuantities({ document: doc, scene, building })
  return { ...fingerprintsOf(doc), globalKey: globalKeyOf(doc), building, set }
}

/** Quantitatif après une modification, en ne recalculant que ce qui est touché. */
export function updateQuantities(previous: QuantityCache | null, doc: Doc, scene: PlanScene | null): QuantityUpdate {
  const globalKey = globalKeyOf(doc)
  if (!previous || previous.globalKey !== globalKey) {
    const cache = initialQuantities(doc, scene)
    return { cache, recomputed: null, recomputedLevels: new Set((doc.levels ?? []).map((l) => l.id)) }
  }
  const { fingerprints, levelOf } = fingerprintsOf(doc)
  const changed = new Set<string>()
  for (const [id, print] of fingerprints) if (previous.fingerprints.get(id) !== print) changed.add(id)
  for (const id of previous.fingerprints.keys()) if (!fingerprints.has(id)) changed.add(id)

  const affected = affectedElements(changed, reconstructElements(previous), doc.elements)
  const dirtyLevels = new Set<string>()
  for (const id of affected) {
    // Ancien et nouveau niveau : un élément peut changer de niveau.
    for (const level of [levelOf.get(id), previous.levelOf.get(id)]) if (level) dirtyLevels.add(level)
  }
  // Un escalier perce le niveau du dessus : celui-ci est refait aussi.
  const sorted = [...(doc.levels ?? [])].sort((a, b) => a.elevation - b.elevation)
  for (const id of affected) {
    const el = doc.elements.find((e) => e.id === id) ?? null
    if (el?.type === 'stair') {
      const index = sorted.findIndex((l) => l.id === el.levelId)
      if (index >= 0 && sorted[index + 1]) dirtyLevels.add(sorted[index + 1].id)
    }
  }

  const reuse = new Map<string, Measurements>()
  for (const entry of previous.building.levels) if (!dirtyLevels.has(entry.level.id)) reuse.set(entry.level.id, entry.measurements)
  const building = computeBuildingMeasurements(doc, reuse)
  const fresh = computeQuantities({ document: doc, scene, building, only: affected })

  const merge = (old: readonly Quantity[], next: readonly Quantity[]): Quantity[] => {
    const isFresh = (q: Quantity) => q.category === 'slab' || q.category === 'other' || affected.has(q.elementIds[0])
    const nextByElement = new Map<string, Quantity[]>()
    for (const q of next) {
      const key = q.category === 'slab' || q.category === 'other' ? `${q.category}:${q.elementIds[0]}` : q.elementIds[0]
      nextByElement.set(key, [...(nextByElement.get(key) ?? []), q])
    }
    const out: Quantity[] = []
    const placed = new Set<string>()
    for (const q of old) {
      if (!isFresh(q)) {
        out.push(q)
        continue
      }
      const key = q.category === 'slab' || q.category === 'other' ? `${q.category}:${q.elementIds[0]}` : q.elementIds[0]
      if (placed.has(key)) continue
      placed.add(key)
      out.push(...(nextByElement.get(key) ?? []))
    }
    for (const [key, list] of nextByElement) if (!placed.has(key)) out.push(...list)
    return out
  }
  const geometric = merge(previous.set.geometric, fresh.geometric)
  const takeoff = merge(previous.set.takeoff, fresh.takeoff)
  const cache: QuantityCache = {
    fingerprints,
    levelOf,
    globalKey,
    building,
    set: { geometric, takeoff, summary: quantitySummary(takeoff) },
  }
  return { cache, recomputed: affected, recomputedLevels: dirtyLevels }
}

/** Les éléments du plan précédent, relus depuis leurs empreintes (pour les dépendances d'un élément supprimé). */
function reconstructElements(previous: QuantityCache): CanvasElement[] {
  const out: CanvasElement[] = []
  for (const print of previous.fingerprints.values()) {
    const value = JSON.parse(print) as CanvasElement & { type?: string }
    if (typeof value.type === 'string') out.push(value)
  }
  return out
}

/**
 * Suiveur du quantitatif d'un plan : garde le dernier calcul et ne refait, à chaque appel, que ce
 * qui a changé. Un suiveur par écran (panneau Métrés).
 */
export function createQuantityTracker(): (doc: Doc, scene: PlanScene | null) => QuantityUpdate {
  let cache: QuantityCache | null = null
  return (doc, scene) => {
    const update = updateQuantities(cache, doc, scene)
    cache = update.cache
    return update
  }
}
