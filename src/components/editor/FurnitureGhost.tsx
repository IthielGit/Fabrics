import { Group, Line } from 'react-konva'
import { closedWallAxisAround } from '../../features/documents/construction'
import { createFurnitureElement } from '../../features/documents/elements'
import type { Point } from '../../features/geometry/viewport'
import { getSymbol } from '../../features/library/catalog'
import { getPlaceable } from '../../features/library/catalog/prefabs'
import type { PlacementSnap } from '../../features/geometry/snapLines'
import { furniturePlacement, setPlacement, type WallPose } from '../../features/library/placement'
import FurnitureShape from './shapes/FurnitureShape'

interface FurnitureGhostProps {
  /** Objet ou ensemble en cours de pose. */
  symbolId: string
  /** Position du curseur sur le plan (mm). */
  point: Point
  /** Aimantation (murs et éléments voisins, grille). */
  snap: PlacementSnap
  /** Pixels écran par mm. */
  scale: number
  /** Murs contre lesquels un objet mural se colle (aperçu tourné comme à la pose). */
  wall?: WallPose
}

/** Aperçu translucide, à taille réelle, de l'objet (ou de tous les objets de l'ensemble) qu'on est en train de poser. */
export default function FurnitureGhost({ symbolId, point, snap, scale, wall }: FurnitureGhostProps) {
  const set = getPlaceable(symbolId)
  if (set) {
    const origin = setPlacement(set, point, snap)
    const shell = set.shell
    return (
      <Group name="ghost" listening={false}>
        {shell && (
          <Line
            points={closedWallAxisAround(
              origin,
              { x: origin.x + set.width, y: origin.y + set.depth },
              shell.thickness,
            )}
            stroke="#475569"
            strokeWidth={shell.thickness}
            opacity={0.35}
            lineJoin="miter"
            listening={false}
          />
        )}
        {set.members.map((member, index) => (
          <FurnitureShape
            key={index}
            element={{
              ...createFurnitureElement('', member.symbol, origin.x + member.x, origin.y + member.y, member.width, member.depth),
              id: `furniture-ghost-${index}`,
              rotation: member.rotation,
              mirrored: member.mirrored,
              opacity: 0.55,
            }}
            interactive={false}
            viewScale={scale}
          />
        ))}
      </Group>
    )
  }
  const def = getSymbol(symbolId)
  if (!def) return null
  const { x, y, rotation } = furniturePlacement(def, point, snap, wall)
  const element = {
    ...createFurnitureElement('', def.id, x, y, def.width, def.depth),
    id: 'furniture-ghost',
    rotation: rotation ?? 0,
    opacity: 0.55,
  }
  // Le groupe « ghost » est masqué pendant les exports et la capture des miniatures.
  return (
    <Group name="ghost" listening={false}>
      <FurnitureShape element={element} interactive={false} viewScale={scale} />
    </Group>
  )
}
