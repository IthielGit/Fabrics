import type { Level, RoofElement } from '../../types/document'
import { computeRoof, type RoofSlope } from '../building/roof'
import { roofBaseY } from '../building/roofModel'
import { areaOf, clipToConvex, clipToHalfPlane } from '../geometry/polygonClip'
import { toPoints } from '../geometry/polygon'
import type { Point } from '../geometry/viewport'

/**
 * Hauteur sous plafond minimale (mm) pour qu'une partie de pièce compte dans la surface habitable.
 * Décidée avec l'utilisateur le 2026-11-13 : 1800 mm, valeur unique (pas de réglage par projet).
 */
export const MIN_HABITABLE_HEIGHT = 1800

/**
 * Plan du dessous d'un versant : hauteur sous toiture (mm, au-dessus du sol du niveau) au point
 * (x, y) du plan = `a·x + b·y + c`. `null` si le versant est dégénéré (sommets alignés).
 */
function undersidePlane(
  slope: RoofSlope,
  floorY: number,
  thickness: number,
): { a: number; b: number; c: number } | null {
  const v = slope.polygon
  if (v.length < 3) return null
  // Trois sommets non alignés dans le plan (x, z) : le plus éloigné du côté v0 → v1.
  let best = -1
  let bestCross = 1e-9
  for (let i = 2; i < v.length; i++) {
    const cross = Math.abs((v[1].x - v[0].x) * (v[i].z - v[0].z) - (v[1].z - v[0].z) * (v[i].x - v[0].x))
    if (cross > bestCross) {
      bestCross = cross
      best = i
    }
  }
  if (best < 0) return null
  const [p0, p1, p2] = [v[0], v[1], v[best]]
  // y = a·x + b·z + c passant par les trois sommets (règle de Cramer).
  const det = (p1.x - p0.x) * (p2.z - p0.z) - (p2.x - p0.x) * (p1.z - p0.z)
  const a = ((p1.y - p0.y) * (p2.z - p0.z) - (p2.y - p0.y) * (p1.z - p0.z)) / det
  const b = ((p2.y - p0.y) * (p1.x - p0.x) - (p1.y - p0.y) * (p2.x - p0.x)) / det
  const c = p0.y - a * p0.x - b * p0.z
  // Dessous = dessus du versant moins l'épaisseur (à la verticale), puis hauteur depuis le sol du niveau.
  return { a, b, c: c - thickness - floorY }
}

/**
 * Surface habitable d'une pièce (mm²) : sa surface nette moins la partie dont la hauteur sous plafond
 * est inférieure à `minHeight`.
 *
 * - Sous une ou des toitures du niveau : pour chaque versant, on retire la part de la pièce où le
 *   dessous du versant (dessus moins l'épaisseur de dalle, comme en 3D) est plus bas que `minHeight`.
 *   Une partie de pièce hors de toute toiture compte entière.
 * - Sans toiture sur le niveau : toute la pièce, sauf si la hauteur sous plafond plate
 *   (`flatCeilingHeight`, null si inconnue) est elle-même inférieure à `minHeight` : alors 0.
 *
 * Limite : une trémie qui tombe dans la partie basse est retirée deux fois (surface nette, puis
 * partie basse) ; le résultat reste borné à 0.
 */
export function habitableArea(
  roomPoints: readonly number[],
  netArea: number,
  level: Pick<Level, 'elevation' | 'height' | 'slabThickness'> | undefined,
  roofsOfLevel: readonly Pick<RoofElement, 'points' | 'shape' | 'pitch' | 'overhang' | 'ridgeEdge'>[],
  flatCeilingHeight: number | null,
  minHeight: number = MIN_HABITABLE_HEIGHT,
): number {
  if (!level) return netArea
  if (roofsOfLevel.length === 0) {
    return flatCeilingHeight !== null && flatCeilingHeight < minHeight ? 0 : netArea
  }

  const room: Point[] = toPoints(roomPoints)
  const thickness = Math.max(1, level.slabThickness)
  let low = 0
  for (const roof of roofsOfLevel) {
    const result = computeRoof(roof, roofBaseY(level))
    if ('problem' in result) continue
    for (const slope of result.geometry.slopes) {
      const plane = undersidePlane(slope, level.elevation, thickness)
      if (!plane) continue
      const footprint: Point[] = slope.polygon.map((p) => ({ x: p.x, y: p.z }))
      // Hauteur sous le versant < minHeight : a·x + b·y + (c − minHeight) < 0.
      const lowPart = clipToHalfPlane(footprint, plane.a, plane.b, plane.c - minHeight)
      if (lowPart.length < 3) continue
      low += areaOf(clipToConvex(room, lowPart))
    }
  }
  return Math.max(0, netArea - low)
}
