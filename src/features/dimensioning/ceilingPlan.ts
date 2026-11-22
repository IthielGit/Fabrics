import type { PlanOverlay } from '../building/views/drawing'
import type { FabricsDocument, RoomElement } from '../../types/document'
import type { Measurements } from '../measurements/measurements'
import { formatDecimal } from '../units/format'
import { annotationGraphics } from './annotationGraphics'

/**
 * Plan de plafond d'un niveau (M20 20.3) : par pièce, son nom, la hauteur sous plafond (« HSP 2880 »,
 * mm) et « Faux plafond » s'il y en a un, lus dans les métrés, au centre de la pièce. Dessiné sur le
 * plan du niveau sans mobilier ni escalier.
 */
export interface CeilingLabels {
  height: (mm: string) => string
  falseCeiling: string
}

export function ceilingPlanOverlay(
  document: Pick<FabricsDocument, 'elements'>,
  levelId: string,
  measurements: Measurements,
  labels: CeilingLabels,
  fontMm: number,
): PlanOverlay | null {
  const rooms = document.elements.filter((el): el is RoomElement => el.type === 'room' && !el.hidden && el.levelId === levelId)
  const byId = new Map(measurements.rooms.map((r) => [r.id, r]))
  const autoLabels = rooms.flatMap((room) => {
    const m = byId.get(room.id)
    if (!m) return []
    const xs = room.points.filter((_, i) => i % 2 === 0)
    const ys = room.points.filter((_, i) => i % 2 === 1)
    const bounds = { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) }
    const lines = [m.name, ...(m.ceilingHeight !== null ? [labels.height(formatDecimal(m.ceilingHeight, 0))] : []), ...(m.falseCeiling ? [labels.falseCeiling] : [])]
    return [{ id: `ceiling-${room.id}`, x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2, lines, bounds }]
  })
  if (autoLabels.length === 0) return null
  return annotationGraphics({ dimensions: [], labels: autoLabels }, fontMm)
}
