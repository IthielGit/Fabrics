/**
 * Toitures et escaliers dessinés dans Pascal (sans `metadata.fabrics`), quantifiés pour les métrés de
 * Fabrics (M19 B6). Toitures : `roofQuantities` (formules exactes) ; escaliers : règles de Pascal
 * (giron = longueur ÷ marches, hauteur de marche = hauteur ÷ marches). Fonction pure ; résultats en mm.
 */
import { getRoofSegmentDeckReach, ROOF_SHAPE_DEFAULTS } from '@pascal-app/core'
import type { NativeRoofQuantity, NativeStairQuantity, PascalQuantities } from '../../../types/document'
import { type PascalRoofKind, roofQuantities } from '../roofQuantities'
import type { PlanScene, SceneNodeData } from '../sceneTypes'
import { mToMm } from '../units'

const ROOF_KINDS = new Set<PascalRoofKind>(['flat', 'shed', 'gable', 'hip', 'gambrel', 'mansard', 'dutch', 'conical', 'barrel'])

const isNative = (node: SceneNodeData) => node.metadata?.fabrics === undefined
const num = (value: unknown, fallback: number) => (typeof value === 'number' && Number.isFinite(value) ? value : fallback)

function levelIdOf(node: SceneNodeData, nodes: Record<string, SceneNodeData>): string | null {
  let current: SceneNodeData | undefined = node
  while (current && current.type !== 'level') current = current.parentId ? nodes[current.parentId] : undefined
  if (!current) return null
  return (current.metadata?.fabrics as { id?: string } | undefined)?.id ?? current.id
}

const childrenOf = (node: SceneNodeData, nodes: Record<string, SceneNodeData>, type: string) =>
  (node.children ?? []).map((id) => nodes[id]).filter((child): child is SceneNodeData => child?.type === type)

function isTrimmed(trim: unknown): boolean {
  if (!trim || typeof trim !== 'object') return false
  return Object.values(trim as Record<string, unknown>).some((value) => typeof value === 'number' && value > 1e-6)
}

function roofQuantity(segment: SceneNodeData, roof: SceneNodeData, nodes: Record<string, SceneNodeData>): NativeRoofQuantity | null {
  const kind = segment.roofType as PascalRoofKind
  if (!ROOF_KINDS.has(kind)) return null
  const d = ROOF_SHAPE_DEFAULTS as unknown as Record<string, number>
  const width = num(segment.width, 8)
  const depth = num(segment.depth, 6)
  const pitch = num(segment.pitch, 40)
  const reach = getRoofSegmentDeckReach(segment as never)
  const sweep = segment.conicalFullCircle === true ? undefined : (segment.conicalSweepAngle as number | undefined)
  const q = roofQuantities({
    kind,
    width,
    depth,
    pitch,
    reachX: reach.x,
    reachZ: reach.z,
    gambrelLowerWidthRatio: num(segment.gambrelLowerWidthRatio, d.gambrelLowerWidthRatio),
    gambrelLowerHeightRatio: num(segment.gambrelLowerHeightRatio, d.gambrelLowerHeightRatio),
    mansardSteepWidthRatio: num(segment.mansardSteepWidthRatio, d.mansardSteepWidthRatio),
    mansardSteepHeightRatio: num(segment.mansardSteepHeightRatio, d.mansardSteepHeightRatio),
    dutchHipWidthRatio: num(segment.dutchHipWidthRatio, d.dutchHipWidthRatio),
    dutchHipHeightRatio: num(segment.dutchHipHeightRatio, d.dutchHipHeightRatio),
    dutchWaistLengthRatio: num(segment.dutchWaistLengthRatio, d.dutchWaistLengthRatio),
    dutchGabletRake: num(segment.dutchGabletRake, d.dutchGabletRake),
    barrelRise: segment.barrelRise as number | undefined,
    conicalSweep: sweep,
  })
  return {
    id: segment.id,
    name: segment.name || roof.name || '',
    levelId: levelIdOf(roof, nodes),
    kind,
    pitch: kind === 'flat' || kind === 'barrel' ? null : pitch,
    overhang: mToMm(reach.z),
    projectedArea: q.projectedArea * 1e6,
    realArea: q.realArea * 1e6,
    ridgeLength: mToMm(q.ridgeLength),
    eaveLength: mToMm(q.eaveLength),
    hipLength: mToMm(q.hipLength),
    gableCount: q.gableCount,
    trimmed: isTrimmed(segment.trim),
  }
}

function stairQuantity(stair: SceneNodeData, nodes: Record<string, SceneNodeData>): NativeStairQuantity {
  const type = (stair.stairType as string | undefined) ?? 'straight'
  const base = { id: stair.id, name: stair.name ?? '', levelId: levelIdOf(stair, nodes) }
  if (type === 'curved' || type === 'spiral') {
    // Une seule volée tournante : marches réparties sur la ligne de foulée (rayon intérieur + ½ largeur).
    const risers = Math.max(1, Math.round(num(stair.stepCount, 10)))
    const width = num(stair.width, 1)
    const rise = num(stair.totalRise, 2.5)
    const walking = (num(stair.innerRadius, 0.9) + width / 2) * Math.abs(num(stair.sweepAngle, Math.PI / 2))
    return {
      ...base,
      shape: type,
      width: mToMm(width),
      rise: mToMm(rise),
      risers,
      treads: risers - 1,
      riserHeight: mToMm(rise / risers),
      treadDepth: mToMm(walking / risers),
    }
  }
  const segments = childrenOf(stair, nodes, 'stair-segment')
  const flights = segments.filter((segment) => (segment.segmentType ?? 'stair') === 'stair')
  const risers = flights.reduce((sum, flight) => sum + Math.max(1, Math.round(num(flight.stepCount, 10))), 0)
  const rise = flights.reduce((sum, flight) => sum + num(flight.height, 0), 0)
  const turns = segments.slice(1).filter((segment) => (segment.attachmentSide ?? 'front') !== 'front').length
  const first = flights[0]
  return {
    ...base,
    shape: turns === 0 ? 'straight' : turns === 1 ? 'l' : 'u',
    width: mToMm(Math.max(0, ...flights.map((flight) => num(flight.width, 1)))),
    rise: mToMm(rise),
    risers,
    // Le dernier pas de chaque volée arrive sur le palier ou l'étage : pas un giron.
    treads: Math.max(0, risers - flights.length),
    riserHeight: risers > 0 ? mToMm(rise / risers) : 0,
    treadDepth: first ? mToMm(num(first.length, 0) / Math.max(1, Math.round(num(first.stepCount, 10)))) : 0,
  }
}

/** Toitures et escaliers natifs de la scène ; `undefined` s'il n'y en a aucun. */
export function pascalQuantitiesOf(scene: PlanScene): PascalQuantities | undefined {
  const { nodes } = scene
  const roofs: NativeRoofQuantity[] = []
  const stairs: NativeStairQuantity[] = []
  for (const node of Object.values(nodes)) {
    if (!isNative(node)) continue
    if (node.type === 'roof') {
      for (const segment of childrenOf(node, nodes, 'roof-segment')) {
        const q = roofQuantity(segment, node, nodes)
        if (q) roofs.push(q)
      }
    } else if (node.type === 'stair') {
      stairs.push(stairQuantity(node, nodes))
    }
  }
  return roofs.length > 0 || stairs.length > 0 ? { roofs, stairs } : undefined
}
