/**
 * Statut de chaque quantité (M21, 21.4) : validé, provisoire, non pris en charge, données manquantes.
 * Un quantitatif dont une quantité n'est pas « validée » est incomplet et n'est jamais présenté
 * comme fiable (`quantitySummary`).
 *
 * - `missing_data` : la valeur ne peut pas être calculée (mur de hauteur nulle, ouverture hors de son
 *   mur — rejetée, EDGE-01 —, escalier sans niveau au-dessus, toiture invalide) ;
 * - `provisional` : valeur calculée mais à vérifier (ouverture qui dépasse en hauteur — seule la partie
 *   dans le mur est déduite —, mur qui porte une ouverture rejetée, escalier trop court, pan de
 *   toiture découpé ou recouvert, trémie qui déborde de la pièce) ;
 * - `unsupported` : élément de la scène que le métré ne sait pas quantifier (D21-5) ;
 * - `validated` : tout le reste.
 * Fonctions pures.
 */
import type { CanvasElement, OpeningElement, WallElement } from '../../../types/document'
import { isOpeningOutside } from '../../geometry/openings'
import type { PlanScene } from '../../scene/sceneTypes'
import type { BuildingMeasurements } from '../measurements'
import { ruleOf } from './rules'
import type { TracedQuantity } from './trace'
import { quantityKey, type QuantityFamily } from './types'

export type QuantityStatus = 'validated' | 'provisional' | 'unsupported' | 'missing_data'

export type StatusReason =
  | 'zeroHeight'
  | 'openingOutside'
  | 'openingOverflow'
  | 'wallWithRejectedOpening'
  | 'noLevelAbove'
  | 'stairTooShort'
  | 'roofInvalid'
  | 'roofTrimmed'
  | 'roofToCheck'
  | 'voidOverflow'
  | 'unsupportedElement'

export type Quantity = TracedQuantity & { status: QuantityStatus; statusReason: StatusReason | null }

/**
 * Types de nœuds de la scène pris en compte par le métré, ou qui ne sont pas des ouvrages (repères,
 * annotations, réglages). Tout autre type est « non pris en charge ».
 */
const HANDLED_NODE_TYPES = new Set([
  'site',
  'building',
  'level',
  'wall',
  'door',
  'window',
  'zone',
  'slab',
  'roof',
  'roof-segment',
  'stair',
  'stair-segment',
  'item', // mobilier : compté à part (tableau du mobilier)
  'guide',
  'measurement',
  'construction-dimension',
  'structural-grid',
  'scan',
  'spawn',
])

/** Nœuds de la scène que le métré ne quantifie pas : nouvelles quantités « non pris en charge ». */
export function unsupportedQuantities(scene: PlanScene | null | undefined, family: QuantityFamily): Quantity[] {
  if (!scene) return []
  return Object.values(scene.nodes)
    .filter((node) => !HANDLED_NODE_TYPES.has(node.type) && !node.type.startsWith('fabrics:'))
    .map((node) => {
      let current = node
      while (current && current.type !== 'level') current = current.parentId ? scene.nodes[current.parentId] : (undefined as never)
      const levelId = current ? ((current.metadata?.fabrics as { id?: string } | undefined)?.id ?? current.id) : null
      return {
        key: quantityKey(family, 'other.count', node.id, null),
        family,
        category: 'other' as const,
        code: 'other.count' as const,
        dimension: 'count' as const,
        value: 1,
        elementIds: [node.id],
        partId: null,
        levelId,
        rule: ruleOf(family, 'other.count'),
        trace: { sources: [{ id: node.id, name: node.name || node.type }], inputs: [], deductions: [], union: false },
        status: 'unsupported' as const,
        statusReason: 'unsupportedElement' as const,
      }
    })
}

export interface StatusContext {
  building: BuildingMeasurements
  elements: readonly CanvasElement[]
}

/** Ajoute à chaque quantité son statut et sa raison. */
export function withStatus(list: readonly TracedQuantity[], context: StatusContext): Quantity[] {
  const all = context.building.levels.map((entry) => entry.measurements)
  const walls = new Map(context.elements.filter((el): el is WallElement => el.type === 'wall').map((w) => [w.id, w]))
  const openings = context.elements.filter((el): el is OpeningElement => el.type === 'opening' && walls.has(el.wallId))
  const outside = new Set(openings.filter((o) => isOpeningOutside(o, walls.get(o.wallId)!)).map((o) => o.id))
  const overflow = new Set(
    openings.filter((o) => !outside.has(o.id) && o.sillHeight + o.height > walls.get(o.wallId)!.height).map((o) => o.id),
  )
  const wallsWithRejected = new Set(openings.filter((o) => outside.has(o.id)).map((o) => o.wallId))
  const wallsWithOverflow = new Set(openings.filter((o) => overflow.has(o.id)).map((o) => o.wallId))
  const stairs = new Map(all.flatMap((m) => m.stairs).map((s) => [s.id, s]))
  const roofs = new Map(all.flatMap((m) => m.roofs).map((r) => [r.id, r]))
  const rooms = new Map(all.flatMap((m) => m.rooms).map((r) => [r.id, r]))
  const deductionCodes = new Set(['wall.openingsArea', 'wall.netArea', 'wall.netVolume', 'wall.facesNetArea', 'wall.plasterArea', 'wall.paintArea'])

  const statusOf = (q: TracedQuantity): [QuantityStatus, StatusReason | null] => {
    const [id] = q.elementIds
    switch (q.category) {
      case 'wall':
      case 'wallLayer': {
        const wall = walls.get(id)
        if (wall && wall.height <= 0) return ['missing_data', 'zeroHeight']
        if (deductionCodes.has(q.code) || q.category === 'wallLayer') {
          if (wallsWithRejected.has(id)) return ['provisional', 'wallWithRejectedOpening']
          if (wallsWithOverflow.has(id)) return ['provisional', 'openingOverflow']
        }
        return ['validated', null]
      }
      case 'opening':
        if (outside.has(id)) return ['missing_data', 'openingOutside']
        if (overflow.has(id)) return ['provisional', 'openingOverflow']
        return ['validated', null]
      case 'stair': {
        const stair = stairs.get(id)
        if (!stair || q.code === 'stair.count') return ['validated', null]
        if (stair.status === 'no-level-above') return ['missing_data', 'noLevelAbove']
        if (stair.status === 'too-short') return ['provisional', 'stairTooShort']
        return ['validated', null]
      }
      case 'roof': {
        const problem = roofs.get(id)?.problem ?? null
        if (problem === 'trimmed') return ['provisional', 'roofTrimmed']
        if (problem === 'overlapCheck') return ['provisional', 'roofToCheck']
        if (problem !== null) return ['missing_data', 'roofInvalid']
        return ['validated', null]
      }
      case 'room':
        return rooms.get(id)?.voidOverflow && q.code !== 'room.area' && q.code !== 'room.perimeter'
          ? ['provisional', 'voidOverflow']
          : ['validated', null]
      default:
        return ['validated', null]
    }
  }

  return list.map((q) => {
    const [status, statusReason] = statusOf(q)
    return { ...q, status, statusReason }
  })
}

export interface QuantitySummary {
  total: number
  counts: Record<QuantityStatus, number>
  /** Vrai seulement si toutes les quantités sont validées. */
  complete: boolean
}

export function quantitySummary(list: readonly Quantity[]): QuantitySummary {
  const counts: Record<QuantityStatus, number> = { validated: 0, provisional: 0, unsupported: 0, missing_data: 0 }
  for (const q of list) counts[q.status]++
  return { total: list.length, counts, complete: list.length > 0 && counts.validated === list.length }
}
