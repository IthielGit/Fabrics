/**
 * Dalles de Pascal dans les métrés (M19 B6), à part des murs (recommandation de l'utilisateur) :
 * surface (contour moins trémies), périmètre, épaisseur, altitude du dessus, volume. Lues dans la
 * scène ; fonction pure. Longueurs en mm, surfaces en mm², volumes en mm³.
 */
import { roundMm } from './migrate/geometry'
import type { PlanScene, SceneNodeData } from './sceneTypes'
import { polygonAreaM2 } from './siteMeasures'
import { mToMm } from './units'

type Pt = readonly [number, number]

export interface SlabMeasure {
  id: string
  name: string
  /** Niveau Fabrics de la dalle (identifiant du niveau Fabrics, ou du nœud de niveau de Pascal). */
  levelId: string | null
  /** Rôle de Pascal : dalle de base, estrade, dalle en creux (`null` : dalle simple). */
  role: string | null
  /** Surface : contour moins trémies, en mm². */
  area: number
  /** Surface des trémies, en mm². */
  holesArea: number
  /** Périmètre du contour, en mm. */
  perimeter: number
  /** Épaisseur, en mm (la dalle descend de son dessus). */
  thickness: number
  /** Altitude du dessus par rapport au plancher du niveau, en mm. */
  elevation: number
  /** Volume : surface × épaisseur, en mm³. */
  volume: number
}

function perimeterM(points: readonly Pt[]): number {
  let total = 0
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i]
    const [x2, y2] = points[(i + 1) % points.length]
    total += Math.hypot(x2 - x1, y2 - y1)
  }
  return total
}

function levelOf(node: SceneNodeData, nodes: Record<string, SceneNodeData>): string | null {
  let current: SceneNodeData | undefined = node
  while (current && current.type !== 'level') current = current.parentId ? nodes[current.parentId] : undefined
  if (!current) return null
  return (current.metadata?.fabrics as { id?: string } | undefined)?.id ?? current.id
}

/** Dalles de la scène, dans l'ordre de la scène. */
export function slabMeasures(scene: PlanScene): SlabMeasure[] {
  const out: SlabMeasure[] = []
  for (const node of Object.values(scene.nodes)) {
    if (node.type !== 'slab') continue
    const polygon = (node.polygon as Pt[] | undefined) ?? []
    if (polygon.length < 3) continue
    const holes = (node.holes as Pt[][] | undefined) ?? []
    const gross = polygonAreaM2(polygon)
    const holesM2 = holes.reduce((sum, hole) => sum + (hole.length >= 3 ? polygonAreaM2(hole) : 0), 0)
    const areaM2 = Math.max(0, gross - holesM2)
    const thicknessM = Math.max(0, (node.thickness as number | undefined) ?? 0.05)
    out.push({
      id: node.id,
      name: node.name ?? '',
      levelId: levelOf(node, scene.nodes),
      role: (node.plateRole as string | undefined) ?? null,
      area: areaM2 * 1e6,
      holesArea: holesM2 * 1e6,
      perimeter: roundMm(mToMm(perimeterM(polygon))),
      thickness: mToMm(thicknessM),
      elevation: mToMm((node.elevation as number | undefined) ?? 0),
      volume: areaM2 * thicknessM * 1e9,
    })
  }
  return out
}
