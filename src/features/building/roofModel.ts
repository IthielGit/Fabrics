import type { Level, RoofElement, WallElement } from '../../types/document'
import { toPoints } from '../geometry/polygon'
import type { Point } from '../geometry/viewport'
import { computeRoof } from './roof'
import type { RoofPrism, SlabShape, Vec3 } from './types'

/** Tolérance (mm) pour reconnaître le mur posé sous un côté de la toiture. */
const WALL_MATCH_TOLERANCE = 2

/** Dessus des murs d'un niveau : base de ses toitures (D45). */
export function roofBaseY(level: Pick<Level, 'elevation' | 'height'>): number {
  return level.elevation + level.height
}

/**
 * Épaisseur du mur posé sous le côté a → b du contour (nu extérieur, D40) : un segment de mur
 * parallèle dont l'axe est à une demi-épaisseur vers l'intérieur et qui recouvre le côté. `null` si
 * aucun mur ne convient.
 */
export function wallThicknessUnder(a: Point, b: Point, walls: readonly WallElement[]): number | null {
  const length = Math.hypot(b.x - a.x, b.y - a.y)
  if (length < 1) return null
  const dir = { x: (b.x - a.x) / length, y: (b.y - a.y) / length }
  for (const wall of walls) {
    const pts = toPoints(wall.points)
    for (let i = 0; i + 1 < pts.length; i++) {
      const p = pts[i]
      const q = pts[i + 1]
      const segLength = Math.hypot(q.x - p.x, q.y - p.y)
      if (segLength < 1) continue
      const cross = ((q.x - p.x) * dir.y - (q.y - p.y) * dir.x) / segLength
      if (Math.abs(cross) > 1e-3) continue // pas parallèle
      // Distance de l'axe du mur à la ligne du côté : une demi-épaisseur.
      const distance = Math.abs((p.x - a.x) * dir.y - (p.y - a.y) * dir.x)
      if (Math.abs(distance - wall.thickness / 2) > WALL_MATCH_TOLERANCE) continue
      // Recouvrement le long du côté.
      const s0 = (p.x - a.x) * dir.x + (p.y - a.y) * dir.y
      const s1 = (q.x - a.x) * dir.x + (q.y - a.y) * dir.y
      const overlap = Math.min(length, Math.max(s0, s1)) - Math.max(0, Math.min(s0, s1))
      if (overlap > 1) return wall.thickness
    }
  }
  return null
}

/** Centre (moyenne des sommets) d'un contour dans le plan. */
function centre(points: readonly Point[]): Point {
  const n = points.length || 1
  return {
    x: points.reduce((sum, p) => sum + p.x, 0) / n,
    y: points.reduce((sum, p) => sum + p.y, 0) / n,
  }
}

/**
 * Prisme vertical d'un pignon (ou du mur rehaussé d'un toit à un pan) : le polygone est au nu
 * extérieur, poussé vers l'intérieur de la toiture de l'épaisseur du mur dessous (D43), ou de
 * `defaultThickness` sans mur.
 */
function gablePrism(
  roof: RoofElement,
  levelId: string,
  polygon: Vec3[],
  inside: Point,
  walls: readonly WallElement[],
  defaultThickness: number,
): RoofPrism | null {
  // Base du polygone : ses deux points les plus bas, dans le plan.
  const base = [...polygon].sort((p, q) => p.y - q.y).slice(0, 2)
  const a = { x: base[0].x, y: base[0].z }
  const b = { x: base[1].x, y: base[1].z }
  const length = Math.hypot(b.x - a.x, b.y - a.y)
  if (length < 1) return null
  let normal = { x: -(b.y - a.y) / length, y: (b.x - a.x) / length }
  if ((inside.x - a.x) * normal.x + (inside.y - a.y) * normal.y < 0) normal = { x: -normal.x, y: -normal.y }
  const thickness = wallThicknessUnder(a, b, walls) ?? defaultThickness
  return {
    sourceId: roof.id,
    levelId,
    kind: 'gable',
    polygon,
    extrude: { x: normal.x * thickness, y: 0, z: normal.y * thickness },
  }
}

export interface RoofParts {
  /** Versants et pignons d'un toit en pente. */
  prisms: RoofPrism[]
  /** Dalle d'un toit plat dessiné (D44). */
  slabs: SlabShape[]
}

/**
 * Volumes d'une toiture posée sur `level` : versants d'épaisseur `slabThickness` du niveau (D42,
 * mesurée à la verticale sous le dessus du versant), pignons et mur haut d'un toit à un pan (D43),
 * ou dalle d'un toit plat dessus au haut des murs (D44). Une toiture non valable ne donne rien.
 * `walls` : murs du même niveau (pour l'épaisseur des pignons).
 */
export function buildRoofParts(
  roof: RoofElement,
  level: Level,
  walls: readonly WallElement[],
  defaultWallThickness: number,
): RoofParts {
  const empty: RoofParts = { prisms: [], slabs: [] }
  const thickness = Math.max(1, level.slabThickness)
  const result = computeRoof(roof, roofBaseY(level))
  if ('problem' in result) return empty
  const g = result.geometry

  if (g.shape === 'flat') {
    return {
      prisms: [],
      slabs: [
        {
          sourceId: roof.id,
          levelId: level.id,
          kind: 'roof',
          outline: g.overhangOutline,
          baseY: g.baseY - thickness,
          thickness,
        },
      ],
    }
  }

  const prisms: RoofPrism[] = g.slopes.map((slope) => ({
    sourceId: roof.id,
    levelId: level.id,
    kind: 'roof',
    polygon: slope.polygon,
    extrude: { x: 0, y: -thickness, z: 0 },
  }))
  const inside = centre(g.outline)
  for (const polygon of [...g.gables, ...g.raisedWalls]) {
    // Le pignon monte jusqu'au dessous du versant (épaisseur retirée à la verticale), pas jusqu'à
    // son dessus : il reste caché dans la toiture au lieu d'affleurer sa surface.
    const underRoof = polygon.map((p) => (p.y > g.baseY ? { ...p, y: Math.max(g.baseY, p.y - thickness) } : p))
    const prism = gablePrism(roof, level.id, underRoof, inside, walls, defaultWallThickness)
    if (prism) prisms.push(prism)
  }
  return { prisms, slabs: [] }
}
