import { Group } from 'react-konva'
import { createFurnitureElement } from '../../features/documents/elements'
import { getSymbol } from '../../features/library/catalog'
import { furniturePlacement } from '../../features/library/placement'
import type { Point } from '../../features/geometry/viewport'
import FurnitureShape from './shapes/FurnitureShape'

interface FurnitureGhostProps {
  symbolId: string
  /** Position du curseur sur le plan (mm). */
  point: Point
  /** Pas de la grille d'aimantation (mm), ou `null`. */
  grid: number | null
  /** Pixels écran par mm. */
  scale: number
}

/** Aperçu translucide, à taille réelle, de l'objet qu'on est en train de poser. */
export default function FurnitureGhost({ symbolId, point, grid, scale }: FurnitureGhostProps) {
  const def = getSymbol(symbolId)
  if (!def) return null
  const { x, y } = furniturePlacement(def, point, grid)
  const element = {
    ...createFurnitureElement('', def.id, x, y, def.width, def.depth),
    id: 'furniture-ghost',
    opacity: 0.55,
  }
  // Le groupe « ghost » est masqué pendant les exports et la capture des miniatures.
  return (
    <Group name="ghost" listening={false}>
      <FurnitureShape element={element} interactive={false} viewScale={scale} />
    </Group>
  )
}
