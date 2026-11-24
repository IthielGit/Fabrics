/**
 * Quantités d'un côté de mur (M22, 22.2) : dans l'IFC, un mur Fabrics à plusieurs côtés devient un
 * `IfcWall` par côté, et chacun porte ses propres quantités. Elles découpent celles du mur entier
 * (M21, D21-4) sans autre règle : longueur à l'axe du côté, ouvertures du côté (union), part des
 * raccords en T du bout qui touche ce côté. La somme des côtés redonne le mur (testé).
 * Fonctions pures ; mm, mm², mm³.
 */
import type { CanvasElement, FabricsDocument, WallElement } from '../../types/document'
import { elementsOfLevel } from '../documents/levels'
import { wallSegment, wallSegmentCount } from '../geometry/openings'
import { tJunctionAdjustments } from '../geometry/wallContacts'
import { measureOpenings, unionArea, type Rectangle } from '../measurements/measurements'

export interface WallSegmentQuantities {
  wallId: string
  segmentIndex: number
  length: number
  height: number
  thickness: number
  grossArea: number
  openingsArea: number
  netArea: number
  grossVolume: number
  netVolume: number
}

/** Quantités de chaque côté de chaque mur du document, par `wallId` puis par rang du côté. */
export function wallSegmentQuantities(
  document: Pick<FabricsDocument, 'elements' | 'levels'>,
): Map<string, WallSegmentQuantities[]> {
  const out = new Map<string, WallSegmentQuantities[]>()
  for (const level of document.levels ?? []) {
    const elements: readonly CanvasElement[] = elementsOfLevel(document.elements, level.id)
    const walls = elements.filter((el): el is WallElement => el.type === 'wall')
    const wallById = new Map(walls.map((wall) => [wall.id, wall]))
    const tJunctions = tJunctionAdjustments(walls)
    const rectangles = new Map<string, Rectangle[]>()
    for (const placed of measureOpenings(elements, wallById).rectangles) {
      const key = `${placed.wallId}\u0000${placed.segmentIndex}`
      rectangles.set(key, [...(rectangles.get(key) ?? []), placed.rectangle])
    }
    for (const wall of walls) {
      const count = wallSegmentCount(wall)
      const tJoin = tJunctions.get(wall.id)
      const atEnd = tJoin?.overlapAtEnd ?? 0
      const atStart = (tJoin?.overlapArea ?? 0) - atEnd
      const list: WallSegmentQuantities[] = []
      for (let index = 0; index < count; index++) {
        const length = wallSegment(wall, index)?.length ?? 0
        const openingsArea = unionArea(rectangles.get(`${wall.id}\u0000${index}`) ?? [])
        const grossArea = length * wall.height
        const overlap = (index === 0 ? atStart : 0) + (index === count - 1 ? atEnd : 0)
        const netVolume = length * wall.thickness * wall.height - openingsArea * wall.thickness - overlap * wall.height
        list.push({
          wallId: wall.id,
          segmentIndex: index,
          length,
          height: wall.height,
          thickness: wall.thickness,
          grossArea,
          openingsArea,
          netArea: Math.max(0, grossArea - openingsArea),
          grossVolume: Math.max(0, netVolume + openingsArea * wall.thickness),
          netVolume: Math.max(0, netVolume),
        })
      }
      out.set(wall.id, list)
    }
  }
  return out
}
