/**
 * Sol intérieur des pièces de la scène (modèle de pièces de Pascal, choix de l'utilisateur du
 * 2026-11-18). Une pièce fermée par des murs a pour contour l'axe de ses murs (`zone.polygon`) ;
 * son sol est ce contour moins l'emprise des murs, calculé par Pascal (`roomClearPolygon`). Les
 * métrés de Fabrics mesurent ce sol, comme avant quand la pièce était tracée sur les faces.
 *
 * Correspondance pièce → contour détecté : même règle que Pascal (`room-counts.ts`,
 * `room-selection.ts`) : mêmes murs de bord, sinon le point de départ de la pièce (`seed`) dedans.
 */
import {
  area,
  containsPoint,
  createRoomTopologyIndex,
  roomClearPolygon,
  type MultiPolygon,
  type TopologyRoom,
} from '@pascal-app/core'
import type { SceneNodeData } from '../sceneTypes'

type Vec2 = [number, number]

interface RoomZone {
  id: string
  parentId: string | null
  spaceRole?: string
  autoFromWalls?: boolean
  boundaryWallIds?: string[]
  boundarySeparatorIds?: string[]
  seed?: Vec2
}

/** Contour extérieur du sol intérieur (m) de chaque pièce fermée par des murs, par id de zone.
 * Une pièce dont le sol est en plusieurs morceaux garde le plus grand (comme l'éditeur de Pascal). */
export function roomClearOutlines(nodes: Readonly<Record<string, SceneNodeData>>): Map<string, Vec2[]> {
  const out = new Map<string, Vec2[]>()
  const zones = Object.values(nodes).filter(
    (n): n is SceneNodeData & RoomZone => n.type === 'zone' && n.spaceRole === 'room' && n.autoFromWalls === true,
  )
  const byLevel = new Map<string, (SceneNodeData & RoomZone)[]>()
  for (const zone of zones) {
    if (!zone.parentId) continue
    byLevel.set(zone.parentId, [...(byLevel.get(zone.parentId) ?? []), zone])
  }
  for (const [levelId, levelZones] of byLevel) {
    const index = createRoomTopologyIndex()
    // Pascal lit des nœuds validés ; la scène de Fabrics l'est (`fabricsToScene`, `setScene`).
    index.rebuildLevel(levelId, nodes as never)
    const remaining = [...(index.getLevelTopology(levelId)?.rooms ?? [])] as TopologyRoom[]
    const take = (room: TopologyRoom | undefined) => {
      if (room) remaining.splice(remaining.indexOf(room), 1)
      return room
    }
    for (const zone of levelZones) {
      const key = [...(zone.boundaryWallIds ?? []), ...(zone.boundarySeparatorIds ?? [])].sort().join('|')
      const room =
        take(remaining.find((r) => [...new Set(r.spans.map((s) => s.boundaryId))].sort().join('|') === key)) ??
        take(remaining.find((r) => zone.seed !== undefined && containsPoint([{ outer: r.polygon, holes: r.holes }], zone.seed)))
      if (!room) continue
      const clear: MultiPolygon = roomClearPolygon(room)
      const largest = [...clear].sort((a, b) => area([b]) - area([a]))[0]
      if (largest) out.set(zone.id, largest.outer.map(([x, z]) => [x, z] as Vec2))
    }
  }
  return out
}
