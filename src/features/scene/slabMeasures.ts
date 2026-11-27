/**
 * Dalles de Pascal dans les métrés (M19 B6), à part des murs (recommandation de l'utilisateur) :
 * surface (contour moins trémies), périmètre, épaisseur, altitude du dessus, volume. Lues dans la
 * scène ; fonction pure. M22 : les trémies dessinées dans Pascal (nœuds `floor-opening`, posées sur le
 * plancher) sont déduites de la dalle de leur niveau, pour la partie qui la recouvre (sans compter deux
 * fois un trou de la dalle). Limite : les trémies tracées au plafond (`drawnOn: 'ceiling'`) ne sont pas
 * encore déduites de la dalle du dessus. Longueurs en mm, surfaces en mm², volumes en mm³.
 */
import { difference, intersection, type MultiPolygon, union } from '@pascal-app/core'
import { roundMm } from './migrate/geometry'
import type { PlanScene } from './sceneTypes'
import { polygonAreaM2, polygonPerimeterM } from './siteMeasures'
import { mToMm } from './units'
import { fabricsLevelIdOf } from './sceneLevels'

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

const areaOf = (shape: MultiPolygon) =>
  shape.reduce((sum, p) => sum + polygonAreaM2(p.outer) - p.holes.reduce((h, ring) => h + polygonAreaM2(ring), 0), 0)
const ringOf = (points: readonly Pt[]): [number, number][] => points.map(([x, z]) => [x, z])

/** Dalles de la scène, dans l'ordre de la scène. */
export function slabMeasures(scene: PlanScene): SlabMeasure[] {
  const out: SlabMeasure[] = []
  // Trémies de Pascal posées sur le plancher, par nœud de niveau.
  const openingsByLevel = new Map<string, [number, number][][]>()
  for (const node of Object.values(scene.nodes)) {
    if (node.type !== 'floor-opening' || node.drawnOn === 'ceiling' || !node.parentId) continue
    const ring = (node.polygon as Pt[] | undefined) ?? []
    if (ring.length >= 3) openingsByLevel.set(node.parentId, [...(openingsByLevel.get(node.parentId) ?? []), ringOf(ring)])
  }
  for (const node of Object.values(scene.nodes)) {
    if (node.type !== 'slab') continue
    const polygon = (node.polygon as Pt[] | undefined) ?? []
    if (polygon.length < 3) continue
    const holes = (node.holes as Pt[][] | undefined) ?? []
    const gross = polygonAreaM2(polygon)
    const ownHolesM2 = holes.reduce((sum, hole) => sum + (hole.length >= 3 ? polygonAreaM2(hole) : 0), 0)
    const openings = node.parentId ? openingsByLevel.get(node.parentId) : undefined
    // Partie des trémies sur la dalle, hors des trous qu'elle a déjà.
    const openingsM2 = openings
      ? areaOf(intersection(difference(ringOf(polygon), holes.filter((h) => h.length >= 3).map(ringOf).map((outer) => ({ outer, holes: [] }))), union(openings)))
      : 0
    const holesM2 = ownHolesM2 + openingsM2
    const areaM2 = Math.max(0, gross - holesM2)
    const thicknessM = Math.max(0, (node.thickness as number | undefined) ?? 0.05)
    out.push({
      id: node.id,
      name: node.name ?? '',
      levelId: fabricsLevelIdOf(node, scene.nodes),
      role: (node.plateRole as string | undefined) ?? null,
      area: areaM2 * 1e6,
      holesArea: holesM2 * 1e6,
      perimeter: roundMm(mToMm(polygonPerimeterM(polygon))),
      thickness: mToMm(thicknessM),
      elevation: mToMm((node.elevation as number | undefined) ?? 0),
      volume: areaM2 * thicknessM * 1e9,
    })
  }
  return out
}
