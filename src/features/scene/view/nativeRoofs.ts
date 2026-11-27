/**
 * Toitures de Pascal en toitures de Fabrics **dérivées** (M20 20.1c), pour que les façades et coupes
 * de Fabrics les dessinent : un élément par pan (rectangle sur l'axe des murs, débord, forme, pente).
 * Seulement pour les toitures que `roofFromPascal` ne sait pas reprendre (plusieurs pans, pente sous
 * 1°…). Jamais enregistrées ni comptées dans les métrés.
 */
import { getRoofSegmentDeckReach } from '@pascal-app/core'
import type { RoofElement } from '../../../types/document'
import { roofFromPascal } from '../migrate/roofStairNodes'
import type { SceneNodeData } from '../sceneTypes'
import { fabricsLevelIdOf } from '../sceneLevels'

const SHAPES = new Set(['flat', 'shed', 'gable', 'hip'])

/** Même rotation que Pascal : x' = c·x + s·z, z' = −s·x + c·z. */
function turn(x: number, z: number, yaw: number): [number, number] {
  const c = Math.cos(yaw)
  const s = Math.sin(yaw)
  return [c * x + s * z, -s * x + c * z]
}

export function nativeRoofElements(nodes: Readonly<Record<string, SceneNodeData>>): RoofElement[] {
  const out: RoofElement[] = []
  for (const roof of Object.values(nodes)) {
    if (roof.type !== 'roof' || roof.visible === false) continue
    if (roofFromPascal(roof, nodes)) continue // toiture que Fabrics reprend déjà comme élément
    const levelId = fabricsLevelIdOf(roof, nodes)
    const roofPos = (roof.position as [number, number, number] | undefined) ?? [0, 0, 0]
    const roofYaw = (roof.rotation as number | undefined) ?? 0
    for (const id of roof.children ?? []) {
      const seg = nodes[id]
      if (seg?.type !== 'roof-segment' || !SHAPES.has(seg.roofType as string)) continue
      const width = seg.width as number
      const depth = seg.depth as number
      if (!(width > 0 && depth > 0)) continue
      const reach = getRoofSegmentDeckReach(seg as never)
      const segPos = (seg.position as [number, number, number] | undefined) ?? [0, 0, 0]
      const segYaw = (seg.rotation as number | undefined) ?? 0
      // Coins sur l'axe des murs, dans l'ordre (−x,−z), (+x,−z), (+x,+z), (−x,+z) : le côté 0 est le côté
      // haut d'un pan de Pascal (il descend vers +z) et le faîtage d'un deux-pans lui est parallèle.
      const points = ([[-1, -1], [1, -1], [1, 1], [-1, 1]] as const).flatMap(([sx, sz]) => {
        const [rx, rz] = turn((sx * width) / 2, (sz * depth) / 2, segYaw)
        const [wx, wz] = turn(segPos[0] + rx, segPos[2] + rz, roofYaw)
        return [Math.round((roofPos[0] + wx) * 1e6) / 1e3, Math.round((roofPos[2] + wz) * 1e6) / 1e3]
      })
      out.push({
        id: `native_${seg.id}`,
        name: roof.name ?? '',
        type: 'roof',
        x: 0,
        y: 0,
        rotation: 0,
        opacity: 1,
        locked: true,
        hidden: false,
        ...(levelId ? { levelId } : {}),
        points,
        shape: seg.roofType as RoofElement['shape'],
        pitch: (seg.pitch as number | undefined) ?? 0,
        overhang: Math.round(reach.z * 1e6) / 1e3,
        ridgeEdge: 0,
      } as RoofElement)
    }
  }
  return out
}
