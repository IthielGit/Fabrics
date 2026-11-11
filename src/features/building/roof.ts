import type { RoofElement, RoofShape } from '../../types/document'
import { polygonArea, toPoints } from '../geometry/polygon'
import type { Point } from '../geometry/viewport'
import type { Vec3 } from './types'

/**
 * Toitures (M10 bis, lot B). Fonctions pures, unités : mm (la pente est en degrés).
 *
 * Le contour est le nu extérieur des murs (D40). La base d'une toiture est le dessus des murs de
 * son niveau (`baseY`). Formes (D33, roadmap) — L = portée, perpendiculaire au faîtage ;
 * Lg = longueur parallèle au faîtage ; α = pente ; d = débord :
 * - plat : polygone ou rectangle, hauteur 0 ;
 * - un pan : h = L × tan α, au droit du mur haut ;
 * - deux pans : h = (L ÷ 2) × tan α ; faîtage de Lg + 2d ;
 * - croupe : h = (L ÷ 2) × tan α ; faîtage de Lg − L (0 sur un carré : pavillon).
 * Le débord agrandit l'emprise de d sur chaque côté ; le versant garde sa pente, donc l'égout est
 * d × tan α sous le dessus du mur. Surface réelle = surface projetée (avec débord) ÷ cos α.
 */

/** Plus petite et plus grande pente acceptées pour un toit en pente, en degrés. */
export const MIN_PITCH = 1
export const MAX_PITCH = 75
/** Tolérance (mm) pour reconnaître un rectangle. */
const RECT_TOLERANCE = 1

export type RoofProblem = 'too-few-points' | 'not-rectangle' | 'bad-pitch'

/** Un versant : contour du dessus (3D : x, y = hauteur, z = y du plan) et sens de la pente. */
export interface RoofSlope {
  polygon: Vec3[]
  /** Direction de la pente, vers le bas, dans le plan (unitaire). `null` pour un toit plat. */
  downhill: Point | null
}

export interface RoofGeometry {
  shape: RoofShape
  /** Contour au nu extérieur des murs, dans le plan. */
  outline: Point[]
  /** Contour agrandi du débord (bord des égouts et des rives), dans le plan. */
  overhangOutline: Point[]
  /** Dessus des murs, mm (base de la toiture). */
  baseY: number
  /** Hauteur du faîtage (ou du point haut) au-dessus du dessus des murs, au droit des murs, mm. */
  ridgeHeight: number
  /** Altitude du faîtage ou du point haut (dessus des murs + `ridgeHeight`), mm. */
  ridgeY: number
  /** Altitude de l'égout, au bord du débord, mm. */
  eaveY: number
  slopes: RoofSlope[]
  /** Faîtage dans le plan (deux pans, croupe ; un point pour un pavillon), ou `null`. */
  ridge: [Point, Point] | null
  /** Arêtiers dans le plan (croupe) : de chaque coin du débord à une extrémité du faîtage. */
  hips: [Point, Point][]
  /** Pignons : triangles verticaux dans le plan du contour, de la base au versant (3D). */
  gables: Vec3[][]
  /** Mur rehaussé sous le côté haut d'un toit à un pan : rectangle vertical (3D). */
  raisedWalls: Vec3[][]
  /** Quantités (D33 ; aucun prix). */
  projectedArea: number // mm², avec débord
  realArea: number // mm², projetée ÷ cos α
  ridgeLength: number // mm
  eaveLength: number // mm
  hipLength: number // mm, total des arêtiers (longueur réelle, en pente)
  gableCount: number
}

export type RoofResult = { geometry: RoofGeometry } | { problem: RoofProblem }

/** Toit en pente : un pan, deux pans ou croupe. */
export function isPitched(shape: RoofShape): boolean {
  return shape !== 'flat'
}

/** Vrai si les 4 points forment un rectangle (à 1 mm près), de côtés non nuls. */
export function isRoofRectangle(points: readonly number[]): boolean {
  const pts = toPoints([...points])
  if (pts.length !== 4) return false
  const [p0, p1, p2, p3] = pts
  const ex = { x: p1.x - p0.x, y: p1.y - p0.y }
  const ey = { x: p3.x - p0.x, y: p3.y - p0.y }
  const w = Math.hypot(ex.x, ex.y)
  const d = Math.hypot(ey.x, ey.y)
  if (w < RECT_TOLERANCE || d < RECT_TOLERANCE) return false
  if (Math.abs(ex.x * ey.x + ex.y * ey.y) / (w * d) > 1e-3) return false
  return Math.hypot(p2.x - (p1.x + ey.x), p2.y - (p1.y + ey.y)) <= RECT_TOLERANCE
}

/** Côté du faîtage par défaut : parallèle au grand côté du rectangle (0 ou 1). */
export function defaultRidgeEdge(points: readonly number[]): number {
  const pts = toPoints([...points])
  if (pts.length < 4) return 0
  const w = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y)
  const d = Math.hypot(pts[3].x - pts[0].x, pts[3].y - pts[0].y)
  return w >= d ? 0 : 1
}

/** « Pivoter le faîtage » : côté suivant (deux pans : quart de tour ; un pan : côté haut suivant). */
export function pivotRidge(ridgeEdge: number): number {
  return (((Math.round(ridgeEdge) + 1) % 4) + 4) % 4
}

/**
 * Contour agrandi de `d` mm vers l'extérieur (chaque côté reculé parallèlement à lui-même, les
 * angles prolongés). Pour un polygone simple sans côté de longueur nulle.
 */
export function offsetPolygon(points: readonly Point[], d: number): Point[] {
  const n = points.length
  if (n < 3 || d === 0) return points.map((p) => ({ ...p }))
  // Sens du contour : la normale extérieure d'un côté a → b est (e.y, −e.x) pour une aire positive.
  let area2 = 0
  for (let i = 0; i < n; i++) {
    const p = points[i]
    const q = points[(i + 1) % n]
    area2 += p.x * q.y - q.x * p.y
  }
  const flip = area2 >= 0 ? 1 : -1
  const lines = points.map((a, i) => {
    const b = points[(i + 1) % n]
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1
    const dir = { x: (b.x - a.x) / len, y: (b.y - a.y) / len }
    const normal = { x: dir.y * flip, y: -dir.x * flip }
    return { p: { x: a.x + normal.x * d, y: a.y + normal.y * d }, dir, normal }
  })
  return points.map((_, i) => {
    const prev = lines[(i - 1 + n) % n]
    const cur = lines[i]
    const cross = prev.dir.x * cur.dir.y - prev.dir.y * cur.dir.x
    if (Math.abs(cross) < 1e-9) return { ...cur.p } // côtés alignés : le point recule simplement
    // Intersection des deux côtés reculés : prev.p + t · prev.dir = cur.p + s · cur.dir.
    const dx = cur.p.x - prev.p.x
    const dy = cur.p.y - prev.p.y
    const t = (dx * cur.dir.y - dy * cur.dir.x) / cross
    return { x: prev.p.x + prev.dir.x * t, y: prev.p.y + prev.dir.y * t }
  })
}

/** Contour du débord d'une toiture dans le plan (pour l'emprise d'export), même invalide. */
export function roofPlanOutline(roof: Pick<RoofElement, 'points' | 'overhang'>): Point[] {
  return offsetPolygon(toPoints(roof.points), Math.max(0, roof.overhang))
}

/**
 * Géométrie et quantités d'une toiture posée sur des murs dont le dessus est à `baseY` (mm).
 * Un toit en pente demande un rectangle et une pente entre `MIN_PITCH` et `MAX_PITCH` degrés.
 */
export function computeRoof(
  roof: Pick<RoofElement, 'points' | 'shape' | 'pitch' | 'overhang' | 'ridgeEdge'>,
  baseY: number,
): RoofResult {
  const outline = toPoints([...roof.points])
  if (outline.length < 3) return { problem: 'too-few-points' }
  const d = Math.max(0, roof.overhang)

  if (roof.shape === 'flat') {
    const overhangOutline = offsetPolygon(outline, d)
    const projectedArea = polygonArea(overhangOutline.flatMap((p) => [p.x, p.y]))
    return {
      geometry: {
        shape: 'flat',
        outline,
        overhangOutline,
        baseY,
        ridgeHeight: 0,
        ridgeY: baseY,
        eaveY: baseY,
        slopes: [{ polygon: overhangOutline.map((p) => ({ x: p.x, y: baseY, z: p.y })), downhill: null }],
        ridge: null,
        hips: [],
        gables: [],
        raisedWalls: [],
        projectedArea,
        realArea: projectedArea,
        ridgeLength: 0,
        eaveLength: 0,
        hipLength: 0,
        gableCount: 0,
      },
    }
  }

  if (!isRoofRectangle(roof.points)) return { problem: 'not-rectangle' }
  if (!(roof.pitch >= MIN_PITCH && roof.pitch <= MAX_PITCH)) return { problem: 'bad-pitch' }

  const [p0, p1, , p3] = outline
  const w = Math.hypot(p1.x - p0.x, p1.y - p0.y)
  const dd = Math.hypot(p3.x - p0.x, p3.y - p0.y)
  const ex = { x: (p1.x - p0.x) / w, y: (p1.y - p0.y) / w }
  const ey = { x: (p3.x - p0.x) / dd, y: (p3.y - p0.y) / dd }

  // Repère local : a le long du faîtage (longueur la), b à travers (portée span).
  let edge = ((Math.round(roof.ridgeEdge) % 4) + 4) % 4
  if (roof.shape === 'hip') edge = w >= dd ? 0 : 1 // la croupe suit toujours le grand côté
  const alongX = edge % 2 === 0
  const ua = alongX ? ex : ey
  const ub = alongX ? ey : ex
  const la = alongX ? w : dd
  const span = alongX ? dd : w

  const alpha = (roof.pitch * Math.PI) / 180
  const tan = Math.tan(alpha)
  const cos = Math.cos(alpha)
  const plan = (a: number, b: number): Point => ({
    x: p0.x + ua.x * a + ub.x * b,
    y: p0.y + ua.y * a + ub.y * b,
  })
  const at = (a: number, b: number, h: number): Vec3 => {
    const p = plan(a, b)
    return { x: p.x, y: h, z: p.y }
  }
  const neg = (v: Point): Point => ({ x: -v.x, y: -v.y })

  const a0 = -d
  const a1 = la + d
  const b0 = -d
  const b1 = span + d
  const eaveY = baseY - d * tan
  const overhangOutline = [plan(a0, b0), plan(a1, b0), plan(a1, b1), plan(a0, b1)]
  const projectedArea = (la + 2 * d) * (span + 2 * d)
  const realArea = projectedArea / cos

  if (roof.shape === 'shed') {
    // Côté haut : le côté n° `edge` du contour. Côtés 0 et 3 : b = 0 ; côtés 1 et 2 : b = portée.
    const highAtZero = edge === 0 || edge === 3
    const ridgeHeight = span * tan
    const z = (b: number) => baseY + tan * (highAtZero ? span - b : b)
    const highB = highAtZero ? 0 : span
    const lowB = highAtZero ? span : 0
    return {
      geometry: {
        shape: 'shed',
        outline,
        overhangOutline,
        baseY,
        ridgeHeight,
        ridgeY: baseY + ridgeHeight,
        eaveY,
        slopes: [
          {
            polygon: [at(a0, b0, z(b0)), at(a1, b0, z(b0)), at(a1, b1, z(b1)), at(a0, b1, z(b1))],
            downhill: highAtZero ? ub : neg(ub),
          },
        ],
        ridge: null,
        hips: [],
        gables: [0, la].map((a) => [at(a, lowB, baseY), at(a, highB, baseY), at(a, highB, baseY + ridgeHeight)]),
        raisedWalls: [
          [at(0, highB, baseY), at(la, highB, baseY), at(la, highB, baseY + ridgeHeight), at(0, highB, baseY + ridgeHeight)],
        ],
        projectedArea,
        realArea,
        ridgeLength: 0,
        eaveLength: la + 2 * d,
        hipLength: 0,
        gableCount: 2,
      },
    }
  }

  const ridgeHeight = (span / 2) * tan
  const ridgeY = baseY + ridgeHeight
  const mid = span / 2

  if (roof.shape === 'gable') {
    return {
      geometry: {
        shape: 'gable',
        outline,
        overhangOutline,
        baseY,
        ridgeHeight,
        ridgeY,
        eaveY,
        slopes: [
          { polygon: [at(a0, b0, eaveY), at(a1, b0, eaveY), at(a1, mid, ridgeY), at(a0, mid, ridgeY)], downhill: neg(ub) },
          { polygon: [at(a1, b1, eaveY), at(a0, b1, eaveY), at(a0, mid, ridgeY), at(a1, mid, ridgeY)], downhill: ub },
        ],
        ridge: [plan(a0, mid), plan(a1, mid)],
        hips: [],
        gables: [0, la].map((a) => [at(a, 0, baseY), at(a, span, baseY), at(a, mid, ridgeY)]),
        raisedWalls: [],
        projectedArea,
        realArea,
        ridgeLength: la + 2 * d,
        eaveLength: 2 * (la + 2 * d),
        hipLength: 0,
        gableCount: 2,
      },
    }
  }

  // Croupe (pavillon sur un carré) : faîtage de la − portée, centré.
  const r0 = mid
  const r1 = la - mid
  const ridge: [Point, Point] = [plan(r0, mid), plan(r1, mid)]
  const dedupe = (pts: Vec3[]) =>
    pts.filter((p, i) => {
      const q = pts[(i + pts.length - 1) % pts.length]
      return Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z) > 1e-6
    })
  const corners: [number, number][] = [
    [a0, b0],
    [a1, b0],
    [a1, b1],
    [a0, b1],
  ]
  const ends: [number, number][] = [
    [r0, mid],
    [r1, mid],
    [r1, mid],
    [r0, mid],
  ]
  // Arêtier : horizontalement (portée ÷ 2 + d) × √2, verticalement de l'égout au faîtage.
  const hipPlan = (mid + d) * Math.SQRT2
  const hipLength = 4 * Math.hypot(hipPlan, ridgeY - eaveY)
  return {
    geometry: {
      shape: 'hip',
      outline,
      overhangOutline,
      baseY,
      ridgeHeight,
      ridgeY,
      eaveY,
      slopes: [
        {
          polygon: dedupe([at(a0, b0, eaveY), at(a1, b0, eaveY), at(r1, mid, ridgeY), at(r0, mid, ridgeY)]),
          downhill: neg(ub),
        },
        {
          polygon: dedupe([at(a1, b1, eaveY), at(a0, b1, eaveY), at(r0, mid, ridgeY), at(r1, mid, ridgeY)]),
          downhill: ub,
        },
        { polygon: [at(a0, b1, eaveY), at(a0, b0, eaveY), at(r0, mid, ridgeY)], downhill: neg(ua) },
        { polygon: [at(a1, b0, eaveY), at(a1, b1, eaveY), at(r1, mid, ridgeY)], downhill: ua },
      ],
      ridge,
      hips: corners.map(([a, b], i) => [plan(a, b), plan(ends[i][0], ends[i][1])]),
      gables: [],
      raisedWalls: [],
      projectedArea,
      realArea,
      ridgeLength: Math.max(0, r1 - r0),
      eaveLength: 2 * (la + 2 * d) + 2 * (span + 2 * d),
      hipLength,
      gableCount: 0,
    },
  }
}
