/**
 * Données du plan de toiture d'un niveau (M20 20.1b, D20-13), lues dans les toitures natives de Pascal :
 * contour de la toiture (réunion des pans, débords compris) et une flèche de pente par sens de
 * descente. Tout en mm, dans le repère du plan. La pente n'est jamais saisie : elle vient du `pitch`
 * des pans.
 */
import { getRoofSegmentDeckReach, union } from '@pascal-app/core'
import type { SceneNodeData } from '../sceneTypes'
import { levelNodeIdOf } from './levelPlanSymbols'

type Pt = [number, number]

export interface RoofSlopeArrow {
  /** Centre de la flèche (mm). */
  x: number
  y: number
  /** Sens de la descente (vecteur unitaire du plan, y vers le bas de la feuille). */
  dx: number
  dy: number
  /** Pente en % (tan de l'angle × 100). */
  percent: number
}

export interface RoofPlanData {
  /** Contours de la toiture (mm) : anneaux extérieurs et leurs trous. */
  outlines: { outer: Pt[]; holes: Pt[][] }[]
  slopes: RoofSlopeArrow[]
}

/** Même rotation que Pascal (`roofFromPascal`) : x' = c·x + s·z, z' = −s·x + c·z. */
function turn(x: number, z: number, yaw: number): Pt {
  const c = Math.cos(yaw)
  const s = Math.sin(yaw)
  return [c * x + s * z, -s * x + c * z]
}

interface SegmentPlan {
  corners: Pt[]
  center: Pt
  area: number
  downhill: Pt
  percent: number
}

function segmentPlan(roof: SceneNodeData, seg: SceneNodeData): SegmentPlan | null {
  const width = seg.width as number | undefined
  const depth = seg.depth as number | undefined
  if (!width || !depth) return null
  const reach = getRoofSegmentDeckReach(seg as never)
  const hx = width / 2 + reach.x
  const hz = depth / 2 + reach.z
  const roofPos = (roof.position as [number, number, number] | undefined) ?? [0, 0, 0]
  const roofYaw = (roof.rotation as number | undefined) ?? 0
  const segPos = (seg.position as [number, number, number] | undefined) ?? [0, 0, 0]
  const segYaw = (seg.rotation as number | undefined) ?? 0
  const world = ([lx, lz]: Pt): Pt => {
    const [rx, rz] = turn(lx, lz, segYaw)
    const [wx, wz] = turn(segPos[0] + rx, segPos[2] + rz, roofYaw)
    return [(roofPos[0] + wx) * 1000, (roofPos[2] + wz) * 1000]
  }
  const corners = ([[-hx, -hz], [hx, -hz], [hx, hz], [-hx, hz]] as Pt[]).map(world)
  const kind = seg.roofType as string
  const pitch = kind === 'flat' ? 0 : ((seg.pitch as number | undefined) ?? 0)
  // Un pan « un pan » de Pascal descend vers son +z local.
  const down = turn(0, 1, segYaw + roofYaw)
  return {
    corners,
    center: world([0, 0]),
    area: 4 * hx * hz,
    downhill: down,
    percent: Math.tan((pitch * Math.PI) / 180) * 100,
  }
}

/** Plan de toiture d'un niveau Fabrics ; `null` si le niveau n'a pas de toiture de Pascal. */
export function pascalRoofPlan(nodes: Readonly<Record<string, SceneNodeData>>, fabricsLevelId: string): RoofPlanData | null {
  const levelId = levelNodeIdOf(nodes, fabricsLevelId)
  if (!levelId) return null
  const plans: SegmentPlan[] = []
  const sheds: SegmentPlan[] = []
  for (const roof of Object.values(nodes)) {
    if (roof.type !== 'roof' || roof.parentId !== levelId || roof.visible === false) continue
    for (const id of roof.children ?? []) {
      const seg = nodes[id]
      if (seg?.type !== 'roof-segment') continue
      const plan = segmentPlan(roof, seg)
      if (!plan) continue
      plans.push(plan)
      // Flèche de pente : seulement pour un pan à une seule pente (les autres types : plus tard).
      if (seg.roofType === 'shed' && plan.percent > 0) sheds.push(plan)
    }
  }
  if (plans.length === 0) return null
  const merged = union(plans.map((p) => p.corners))
  const outlines = merged.map((poly) => ({ outer: poly.outer as Pt[], holes: poly.holes as Pt[][] }))
  // Une flèche par sens de descente et par pente, au centre du plus grand pan de ce groupe.
  const groups = new Map<string, SegmentPlan>()
  for (const s of sheds) {
    const key = `${s.downhill[0].toFixed(3)}|${s.downhill[1].toFixed(3)}|${s.percent.toFixed(3)}`
    const best = groups.get(key)
    if (!best || s.area > best.area) groups.set(key, s)
  }
  const slopes = [...groups.values()].map((s) => ({ x: s.center[0], y: s.center[1], dx: s.downhill[0], dy: s.downhill[1], percent: s.percent }))
  return { outlines, slopes }
}
