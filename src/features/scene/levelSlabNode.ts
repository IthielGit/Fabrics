/**
 * Nœud de dalle de niveau pour l'export IFC (M22, 22.2) : la dalle implicite d'un niveau Fabrics (M21),
 * sous forme de dalle de Pascal, dessus au plancher du niveau, épaisseur vers le bas. Jamais écrit dans
 * la scène : seulement dans la copie donnée à l'exportateur. Points en m (plan Pascal).
 */
import { calculateLevelMiters, difference, getWallPlanFootprint, type MultiPolygon, SlabNode, union, type WallNode } from '@pascal-app/core'
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
    // Contour pris tel quel (déjà découpé autour des murs) : Pascal ne le recale pas sur les faces des murs.
    boundary: 'auto',
    metadata: { fabrics: { id: input.levelId, levelSlab: true } },
  }) as unknown as SceneNodeData
}

/**
 * Marge (m) laissée entre la dalle et les murs qu'elle contourne. Pascal arrête sous une dalle tout
 * mur de la hauteur de l'étage dont une face touche la dalle, même par son bord ; ses découpes
 * arrondissent au 0,1 mm. 0,2 mm suffit : la surface du solide est alors un peu plus petite que la
 * quantité de M21 (environ 0,02 %), écart documenté (M22-report).
 */
const WALL_CUT_MARGIN = 2e-4

/** Contour décalé vers l'extérieur de `WALL_CUT_MARGIN` sur chaque côté (sommets en onglet). */
function grow(ring: [number, number][]): [number, number][] {
  const n = ring.length
  if (n < 3) return ring
  let twice = 0
  for (let i = 0; i < n; i++) twice += ring[i][0] * ring[(i + 1) % n][1] - ring[(i + 1) % n][0] * ring[i][1]
  const side = twice > 0 ? 1 : -1 // sens du contour : la normale extérieure est à droite d'un contour direct
  const offsetLine = (i: number) => {
    const [ax, az] = ring[i]
    const [bx, bz] = ring[(i + 1) % n]
    const length = Math.hypot(bx - ax, bz - az) || 1
    const nx = (side * (bz - az)) / length
    const nz = (side * -(bx - ax)) / length
    return { ax: ax + nx * WALL_CUT_MARGIN, az: az + nz * WALL_CUT_MARGIN, dx: bx - ax, dz: bz - az }
  }
  return ring.map((_point, i) => {
    const prev = offsetLine((i - 1 + n) % n)
    const next = offsetLine(i)
    const denom = prev.dx * next.dz - prev.dz * next.dx
    // Côtés alignés : simple décalage du point.
    if (Math.abs(denom) < 1e-12) return [next.ax, next.az]
    const t = ((next.ax - prev.ax) * next.dz - (next.az - prev.az) * next.dx) / denom
    return [prev.ax + prev.dx * t, prev.az + prev.dz * t]
  })
}

/** Morceau de dalle de niveau : contour extérieur et trous, en m (plan Pascal). */
export interface SlabPiece {
  outer: [number, number][]
  holes: [number, number][][]
}

/**
 * Géométrie de la dalle de niveau (règle des fixtures, décision du 2026-11-18, M21 `levelSlabs.ts`) :
 * emprise du niveau moins l'emprise des murs du niveau du dessous qui la traversent, moins les trémies.
 * Les murs priment : la dalle est découpée autour d'eux (sinon Pascal arrête ces murs sous la dalle).
 */
export function levelSlabPieces(input: {
  rings: readonly (readonly [number, number])[][]
  wallsBelow: readonly SceneNodeData[]
  voids: readonly (readonly [number, number])[][]
}): SlabPiece[] {
  const walls = input.wallsBelow as unknown as WallNode[]
  const miters = calculateLevelMiters(walls)
  const cutters: [number, number][][] = [
    ...walls.map((wall) => grow(getWallPlanFootprint(wall, miters).map((p): [number, number] => [p.x, p.y]))),
    ...input.voids.map((ring) => ring.map(([x, z]): [number, number] => [x, z])),
  ].filter((ring) => ring.length >= 3)
  const outline: MultiPolygon = input.rings.map((ring) => ({ outer: ring.map(([x, z]): [number, number] => [x, z]), holes: [] }))
  const pieces = cutters.length > 0 ? difference(outline, union(cutters)) : outline
  return pieces.map((piece) => ({ outer: piece.outer, holes: piece.holes }))
}
