/**
 * Nœud de dalle de niveau pour l'export IFC (M22, 22.2) : la dalle implicite d'un niveau Fabrics (M21),
 * sous forme de dalle de Pascal, dessus au plancher du niveau, épaisseur vers le bas. Jamais écrit dans
 * la scène : seulement dans la copie donnée à l'exportateur. Points en m (plan Pascal).
 */
import { SlabNode } from '@pascal-app/core'
import type { SceneNodeData } from './sceneTypes'

export function levelSlabNode(input: {
  id: string
  levelNodeId: string
  name: string
  polygon: readonly (readonly [number, number])[]
  holes: readonly (readonly [number, number])[][]
  /** Épaisseur, en m. */
  thickness: number
  /** Identifiant du niveau Fabrics. */
  levelId: string
}): SceneNodeData {
  return SlabNode.parse({
    id: input.id,
    parentId: input.levelNodeId,
    name: input.name,
    polygon: input.polygon.map(([x, z]) => [x, z]),
    holes: input.holes.map((hole) => hole.map(([x, z]) => [x, z])),
    elevation: 0,
    thickness: input.thickness,
    metadata: { fabrics: { id: input.levelId, levelSlab: true } },
  }) as unknown as SceneNodeData
}
