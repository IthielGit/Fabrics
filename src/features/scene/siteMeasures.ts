/**
 * Terrain et implantation (M19 B4), lus dans la scène Pascal : limite de propriété (`site.polygon`),
 * emprise au sol du bâtiment (union des murs du niveau du sol, placée par la position et la rotation
 * du bâtiment), recul minimal à la limite, altitudes des niveaux. Fonction pure ; longueurs en mm,
 * surfaces en mm². Le terrain, la limite et la position se règlent dans Pascal (Scène → Site,
 * Construire → Terrain).
 */
import { footprintOutline, levelFootprintLoops } from '@pascal-app/core'
import { BUILDING_ID, type PlanScene, type SceneNodeData } from './sceneTypes'
import { roundMm } from './migrate/geometry'
import { mToMm } from './units'

type Pt = readonly [number, number]

/** Limite par défaut d'un site de Pascal (carré de 30 × 30 m centré) : pas une vraie parcelle. */
const PASCAL_DEFAULT_PARCEL: Pt[] = [[-15, -15], [15, -15], [15, 15], [-15, 15]]

export interface LevelAltitude {
  id: string
  name: string
  /** Altitude du plancher, en mm (le niveau du sol est à 0). */
  elevation: number
  /** Hauteur d'étage, en mm. */
  height: number
}

export interface SiteMeasures {
  /** `false` tant que la limite de propriété est celle par défaut de Pascal. */
  parcelDefined: boolean
  parcelArea: number
  parcelPerimeter: number
  /** Emprise au sol (contour extérieur des murs du niveau du sol), en mm². */
  footprintArea: number
  /** Emprise / surface de la parcelle (coefficient d'emprise au sol), `null` sans parcelle. */
  coverageRatio: number | null
  /** Tout le contour du bâtiment est dans la parcelle. `null` sans parcelle ou sans mur. */
  insideParcel: boolean | null
  /** Plus petite distance entre le contour du bâtiment et la limite de propriété, en mm. */
  minSetback: number | null
  /** Terrain sculpté (relief) dans Pascal. */
  sculptedTerrain: boolean
  levels: LevelAltitude[]
}

export function polygonAreaM2(points: readonly Pt[]): number {
  let twice = 0
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i]
    const [x2, y2] = points[(i + 1) % points.length]
    twice += x1 * y2 - x2 * y1
  }
  return Math.abs(twice) / 2
}

/** Périmètre d'un contour fermé, dans l'unité des points (m). */
export function polygonPerimeterM(points: readonly Pt[]): number {
  let total = 0
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i]
    const [x2, y2] = points[(i + 1) % points.length]
    total += Math.hypot(x2 - x1, y2 - y1)
  }
  return total
}

function inside(p: Pt, ring: readonly Pt[]): boolean {
  let hit = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i]
    const b = ring[j]
    if (a[1] > p[1] !== b[1] > p[1] && p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]) hit = !hit
  }
  return hit
}

function distanceToSegment(p: Pt, a: Pt, b: Pt): number {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const length2 = dx * dx + dy * dy
  const t = length2 === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / length2))
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy))
}

/** Distance d'un point à un contour fermé. */
function distanceToRing(p: Pt, ring: readonly Pt[]): number {
  let best = Infinity
  for (let i = 0; i < ring.length; i++) best = Math.min(best, distanceToSegment(p, ring[i], ring[(i + 1) % ring.length]))
  return best
}

const samePolygon = (a: readonly Pt[], b: readonly Pt[]) =>
  a.length === b.length && a.every((p, i) => p[0] === b[i][0] && p[1] === b[i][1])

/** Niveaux de la scène, du plus bas au plus haut, avec leur altitude cumulée (comme la vue Fabrics). */
function levelAltitudes(nodes: Record<string, SceneNodeData>): { node: SceneNodeData; altitude: LevelAltitude }[] {
  const levels = Object.values(nodes)
    .filter((n) => n.type === 'level' && !(n.metadata?.fabrics as { synthetic?: boolean } | undefined)?.synthetic)
    .sort((a, b) => ((a.level as number | undefined) ?? 0) - ((b.level as number | undefined) ?? 0))
  let top: number | null = null
  return levels.map((node) => {
    const height = mToMm((node.height as number | undefined) ?? 2.5)
    const base = mToMm((node.baseElevation as number | undefined) ?? 0)
    const elevation = roundMm(top === null ? base : top + base)
    top = elevation + height
    const id = (node.metadata?.fabrics as { id?: string } | undefined)?.id ?? node.id
    return { node, altitude: { id, name: node.name ?? '', elevation, height } }
  })
}

export function siteMeasures(scene: PlanScene): SiteMeasures {
  const { nodes } = scene
  const site = Object.values(nodes).find((n) => n.type === 'site')
  const building = (nodes[BUILDING_ID] ?? Object.values(nodes).find((n) => n.type === 'building')) as SceneNodeData | undefined
  const parcel = ((site?.polygon as { points?: Pt[] } | undefined)?.points ?? []) as Pt[]
  const parcelDefined = parcel.length >= 3 && !samePolygon(parcel, PASCAL_DEFAULT_PARCEL)

  const levels = levelAltitudes(nodes)
  // Niveau du sol : celui que désigne le bâtiment, sinon le premier à l'altitude 0, sinon le plus bas.
  const groundId = building?.groundLevelId as string | undefined
  const ground =
    levels.find((l) => l.node.id === groundId) ?? levels.find((l) => l.altitude.elevation === 0) ?? levels[0]
  const loops = ground
    ? levelFootprintLoops(nodes as never, ground.node as never, (building ?? null) as never)
    : []
  const outline = loops.length > 0 ? footprintOutline(loops) : []
  const footprintM2 = outline.reduce((sum, ring) => sum + polygonAreaM2(ring), 0)
  const corners = outline.flat()

  const parcelM2 = parcelDefined ? polygonAreaM2(parcel) : 0
  const insideParcel = parcelDefined && corners.length > 0 ? corners.every((p) => inside(p, parcel)) : null
  const minSetback =
    parcelDefined && corners.length > 0 ? Math.min(...corners.map((p) => distanceToRing(p, parcel))) : null

  return {
    parcelDefined,
    parcelArea: parcelDefined ? parcelM2 * 1e6 : 0,
    parcelPerimeter: parcelDefined ? mToMm(polygonPerimeterM(parcel)) : 0,
    footprintArea: footprintM2 * 1e6,
    coverageRatio: parcelDefined && parcelM2 > 0 ? footprintM2 / parcelM2 : null,
    insideParcel,
    minSetback: minSetback === null ? null : roundMm(mToMm(minSetback)),
    sculptedTerrain: site?.terrain !== undefined,
    levels: levels.map((l) => l.altitude),
  }
}

/**
 * Emprise de chaque niveau (M21) : surface du contour extérieur des murs du niveau, en mm², par
 * identifiant de niveau Fabrics. Même calcul que l'emprise au sol (`levelFootprintLoops` de Pascal).
 * Un niveau sans mur a une emprise de 0.
 */
export function levelFootprintAreas(scene: PlanScene): Map<string, number> {
  const out = new Map<string, number>()
  for (const [levelId, { rings }] of levelFootprintRings(scene)) {
    out.set(levelId, rings.reduce((sum, ring) => sum + polygonAreaM2(ring), 0) * 1e6)
  }
  return out
}

/**
 * Contour extérieur des murs de chaque niveau (M22 : dalle de niveau exportée en IFC), en points de
 * plan Pascal (m), par identifiant de niveau Fabrics, avec l'identifiant du nœud de niveau.
 */
export function levelFootprintRings(scene: PlanScene): Map<string, { levelNodeId: string; rings: Pt[][] }> {
  const { nodes } = scene
  const building = (nodes[BUILDING_ID] ?? Object.values(nodes).find((n) => n.type === 'building')) as SceneNodeData | undefined
  const out = new Map<string, { levelNodeId: string; rings: Pt[][] }>()
  for (const { node, altitude } of levelAltitudes(nodes)) {
    const loops = levelFootprintLoops(nodes as never, node as never, (building ?? null) as never)
    const rings = (loops.length > 0 ? footprintOutline(loops) : []) as Pt[][]
    out.set(altitude.id, { levelNodeId: node.id, rings })
  }
  return out
}
