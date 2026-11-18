/**
 * Quantités exactes d'un pan de toiture de Pascal (M19 B6), comme `building/roof.ts` de Fabrics :
 * surface au sol, surface réelle des versants, faîtage, égouts, arêtiers, pignons. Fonction pure, en
 * mètres (le passage en mm se fait à la lecture).
 *
 * Méthode (types à versants plans : plat, un pan, deux pans, croupe, comble brisé, mansarde,
 * hollandaise) : la toiture est le **minimum de plans** au-dessus du rectangle du débord (une toiture
 * convexe). Le pan d'un plan est la partie du rectangle où ce plan est le plus bas : un polygone convexe,
 * obtenu exactement par découpes successives. Surface réelle d'un pan = surface en plan × √(1 + pente²).
 * Faîtages, arêtiers et égouts sont les côtés de ces pans. Cône et voûte : formules fermées.
 *
 * Repère du pan (celui de Pascal) : x le long de la largeur `width`, z le long de la profondeur
 * `depth`, centré ; les versants principaux descendent vers ±z (faîtage parallèle à x).
 */

export type PascalRoofKind = 'flat' | 'shed' | 'gable' | 'hip' | 'gambrel' | 'mansard' | 'dutch' | 'conical' | 'barrel'

export interface RoofSegmentSpec {
  kind: PascalRoofKind
  /** Emprise sur l'axe des murs (m). */
  width: number
  depth: number
  /** Débord en plan au-delà de l'axe des murs (m) : le long de x (bouts) et de z (égouts). */
  reachX: number
  reachZ: number
  /** Pente du versant principal (degrés). */
  pitch: number
  gambrelLowerWidthRatio: number
  gambrelLowerHeightRatio: number
  mansardSteepWidthRatio: number
  mansardSteepHeightRatio: number
  dutchHipWidthRatio: number
  dutchHipHeightRatio: number
  dutchWaistLengthRatio: number
  dutchGabletRake: number
  /** Voûte : flèche (m) ; absente = demi-portée ÷ 2 (règle de Pascal). */
  barrelRise?: number
  /** Cône : angle balayé (radians) ; absent = cône entier. */
  conicalSweep?: number
}

export interface RoofQuantities {
  /** Surface au sol, débord compris (m²). */
  projectedArea: number
  /** Surface réelle des versants (m²). */
  realArea: number
  /** Longueurs (m) : faîtage(s), égouts (côtés bas), arêtiers (en pente). */
  ridgeLength: number
  eaveLength: number
  hipLength: number
  /** Pignons (murs triangulaires en bout de toit). */
  gableCount: number
  /** Hauteur du faîtage au-dessus de l'égout sur l'axe des murs (m). */
  ridgeHeight: number
}

/** Plan h = c + gx·x + gz·z (hauteur au-dessus de l'égout sur l'axe des murs). */
interface Plane {
  c: number
  gx: number
  gz: number
}
type Pt = [number, number]

const EPS = 1e-9
const height = (p: Plane, [x, z]: Pt) => p.c + p.gx * x + p.gz * z

/** Garde la partie du polygone convexe où a·x + b·z + c ≤ 0 (Sutherland–Hodgman, un demi-plan). */
function clip(poly: Pt[], a: number, b: number, c: number): Pt[] {
  const out: Pt[] = []
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]
    const q = poly[(i + 1) % poly.length]
    const fp = a * p[0] + b * p[1] + c
    const fq = a * q[0] + b * q[1] + c
    if (fp <= EPS) out.push(p)
    if ((fp < -EPS && fq > EPS) || (fp > EPS && fq < -EPS)) {
      const t = fp / (fp - fq)
      out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])])
    }
  }
  return out
}

function area(poly: readonly Pt[]): number {
  let twice = 0
  for (let i = 0; i < poly.length; i++) {
    const [x1, z1] = poly[i]
    const [x2, z2] = poly[(i + 1) % poly.length]
    twice += x1 * z2 - x2 * z1
  }
  return Math.abs(twice) / 2
}

interface Faces {
  planes: Plane[]
  /** Plafond : au-dessus, ce n'est plus ce versant (hollandaise : la ceinture sous le pignon). */
  cap?: number
}

/** Pans, débord compris, avec leurs longueurs de faîtage, d'égout et d'arêtier. */
function facesQuantities(halfX: number, halfZ: number, { planes, cap }: Faces) {
  const deck: Pt[] = [[-halfX, -halfZ], [halfX, -halfZ], [halfX, halfZ], [-halfX, halfZ]]
  let plan = 0
  let real = 0
  let ridge = 0
  let eave = 0
  let hip = 0
  planes.forEach((plane, i) => {
    let region = deck
    planes.forEach((other, j) => {
      if (j !== i) region = clip(region, plane.gx - other.gx, plane.gz - other.gz, plane.c - other.c)
    })
    if (cap !== undefined) region = clip(region, plane.gx, plane.gz, plane.c - cap)
    const regionArea = region.length >= 3 ? area(region) : 0
    if (regionArea <= EPS) return
    plan += regionArea
    real += regionArea * Math.hypot(1, plane.gx, plane.gz)
    for (let k = 0; k < region.length; k++) {
      const p = region[k]
      const q = region[(k + 1) % region.length]
      const length = Math.hypot(q[0] - p[0], q[1] - p[1])
      if (length <= 1e-7) continue
      const mid: Pt = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]
      const onX = Math.abs(Math.abs(p[0]) - halfX) < 1e-7 && Math.abs(p[0] - q[0]) < 1e-7
      const onZ = Math.abs(Math.abs(p[1]) - halfZ) < 1e-7 && Math.abs(p[1] - q[1]) < 1e-7
      if (onX || onZ) {
        // Bord du débord : égout si le versant descend vers l'extérieur.
        const outward = onX ? [Math.sign(p[0]), 0] : [0, Math.sign(p[1])]
        if (plane.gx * outward[0] + plane.gz * outward[1] < -EPS) eave += length
        continue
      }
      const j = planes.findIndex(
        (other, n) => n !== i && Math.abs(height(other, p) - height(plane, p)) < 1e-7 && Math.abs(height(other, q) - height(plane, q)) < 1e-7,
      )
      if (j < 0 || j < i) continue // limite du plafond, ou côté déjà compté par l'autre pan
      const other = planes[j]
      const rise = height(plane, q) - height(plane, p)
      if (Math.abs(rise) < 1e-7) {
        // Arête horizontale : faîtage si les deux versants descendent de part et d'autre.
        if (plane.gx * other.gx + plane.gz * other.gz < -EPS) ridge += length
      } else {
        hip += Math.hypot(length, rise)
      }
      void mid
    }
  })
  return { plan, real, ridge, eave, hip }
}

/** Plans d'une croupe sur le rectangle ±a × ±b, de pente t, posée à la hauteur h0. */
function hipPlanes(a: number, b: number, t: number, h0 = 0): Plane[] {
  return [
    { c: h0 + b * t, gx: 0, gz: -t },
    { c: h0 + b * t, gx: 0, gz: t },
    { c: h0 + a * t, gx: -t, gz: 0 },
    { c: h0 + a * t, gx: t, gz: 0 },
  ]
}

export function roofQuantities(spec: RoofSegmentSpec): RoofQuantities {
  const a = spec.width / 2
  const b = spec.depth / 2
  const halfX = a + spec.reachX
  const halfZ = b + spec.reachZ
  const deckArea = 4 * halfX * halfZ
  const t = spec.kind === 'flat' ? 0 : Math.tan((spec.pitch * Math.PI) / 180)
  const result = (q: { plan: number; real: number; ridge: number; eave: number; hip: number }, gables: number, ridgeHeight: number, extra = { real: 0, ridge: 0 }): RoofQuantities => ({
    projectedArea: q.plan,
    realArea: q.real + extra.real,
    ridgeLength: q.ridge + extra.ridge,
    eaveLength: q.eave,
    hipLength: q.hip,
    gableCount: gables,
    ridgeHeight,
  })

  switch (spec.kind) {
    case 'flat':
      return { projectedArea: deckArea, realArea: deckArea, ridgeLength: 0, eaveLength: 0, hipLength: 0, gableCount: 0, ridgeHeight: 0 }
    case 'shed':
      // Run = toute la profondeur : bas en z = +b, haut en z = −b.
      return result(facesQuantities(halfX, halfZ, { planes: [{ c: b * t, gx: 0, gz: -t }] }), 2, 2 * b * t)
    case 'gable':
      return result(facesQuantities(halfX, halfZ, { planes: hipPlanes(a, b, t).slice(0, 2) }), 2, b * t)
    case 'hip':
      return result(facesQuantities(halfX, halfZ, { planes: hipPlanes(a, b, t) }), 0, Math.min(a, b) * t)
    case 'gambrel': {
      const r1 = b * spec.gambrelLowerWidthRatio
      const h1 = r1 * t
      const total = h1 / spec.gambrelLowerHeightRatio
      const r2 = b - r1
      const t2 = r2 > 0 ? (total - h1) / r2 : 0
      const lower = hipPlanes(a, b, t).slice(0, 2)
      const upper = hipPlanes(a, r2, t2, h1).slice(0, 2)
      return result(facesQuantities(halfX, halfZ, { planes: [...lower, ...upper] }), 2, total)
    }
    case 'mansard': {
      const s = Math.min(spec.width, spec.depth) * spec.mansardSteepWidthRatio
      const h1 = s * t
      const total = h1 / spec.mansardSteepHeightRatio
      const ai = a - s
      const bi = b - s
      const t2 = Math.min(ai, bi) > 0 ? (total - h1) / Math.min(ai, bi) : 0
      return result(facesQuantities(halfX, halfZ, { planes: [...hipPlanes(a, b, t), ...hipPlanes(ai, bi, t2, h1)] }), 0, total)
    }
    case 'dutch': {
      // Repère tourné pour que le pignon soit en bout de la grande longueur (axe x).
      const long = Math.max(a, b)
      const short = Math.min(a, b)
      const [reachLong, reachShort] = a >= b ? [spec.reachX, spec.reachZ] : [spec.reachZ, spec.reachX]
      const inset = 2 * short * spec.dutchHipWidthRatio
      const waistLong = Math.max(0, (long - inset) * spec.dutchWaistLengthRatio)
      const waistShort = Math.max(0, short - inset)
      const h1 = inset * t
      const total = h1 / spec.dutchHipHeightRatio
      const h2 = total - h1
      const endRun = long - waistLong
      const tEnd = endRun > 0 ? h1 / endRun : 0
      const planes: Plane[] = [
        { c: short * t, gx: 0, gz: -t },
        { c: short * t, gx: 0, gz: t },
        { c: long * tEnd, gx: -tEnd, gz: 0 },
        { c: long * tEnd, gx: tEnd, gz: 0 },
      ]
      const lower = facesQuantities(long + reachLong, short + reachShort, { planes, cap: h1 })
      // Pignon : deux versants de la ceinture (h1) au faîtage (total), sur la longueur du pignon et de sa saillie.
      const rake = Math.min(Math.max(0, spec.dutchGabletRake), Math.max(0, long - waistLong) * 0.98)
      const upperLength = 2 * (waistLong + rake)
      const upperReal = 2 * upperLength * Math.hypot(waistShort, h2)
      const q = { ...lower, plan: deckArea }
      return result(q, 2, total, { real: upperReal, ridge: upperLength })
    }
    case 'conical': {
      // Rayon : demi-largeur ; égal partout : surface réelle = surface en plan ÷ cos α.
      const radius = a + spec.reachZ
      const fraction = spec.conicalSweep === undefined ? 1 : Math.min(1, Math.abs(spec.conicalSweep) / (2 * Math.PI))
      const plan = Math.PI * radius * radius * fraction
      return {
        projectedArea: plan,
        realArea: plan * Math.hypot(1, t),
        ridgeLength: 0,
        eaveLength: 2 * Math.PI * radius * fraction,
        hipLength: 0,
        gableCount: 0,
        ridgeHeight: a * t,
      }
    }
    case 'barrel': {
      // Arc de cercle de corde = profondeur et de flèche `rise` ; bouts à plat (débord le long de x).
      const run = Math.max(0.005, b)
      const rise = Math.min(run, spec.barrelRise ?? run / 2)
      const radius = (run * run + rise * rise) / (2 * rise)
      const arc = 2 * radius * Math.asin(Math.min(1, run / radius))
      const length = 2 * halfX
      return {
        projectedArea: 2 * run * length,
        realArea: arc * length,
        ridgeLength: length,
        eaveLength: 2 * length,
        hipLength: 0,
        gableCount: 2,
        ridgeHeight: rise,
      }
    }
  }
}

/** Hauteur de la toiture au point (x, z) sur l'emprise, pour comparer au modèle de Pascal (tests). */
export function roofSurfaceHeight(spec: RoofSegmentSpec, x: number, z: number): number {
  const a = spec.width / 2
  const b = spec.depth / 2
  const t = spec.kind === 'flat' ? 0 : Math.tan((spec.pitch * Math.PI) / 180)
  const min = (planes: Plane[]) => Math.min(...planes.map((p) => height(p, [x, z])))
  switch (spec.kind) {
    case 'shed':
      return b * t - t * z
    case 'gable':
      return min(hipPlanes(a, b, t).slice(0, 2))
    case 'hip':
      return min(hipPlanes(a, b, t))
    case 'gambrel': {
      const r1 = b * spec.gambrelLowerWidthRatio
      const h1 = r1 * t
      const r2 = b - r1
      const t2 = (h1 / spec.gambrelLowerHeightRatio - h1) / r2
      return min([...hipPlanes(a, b, t).slice(0, 2), ...hipPlanes(a, r2, t2, h1).slice(0, 2)])
    }
    case 'mansard': {
      const s = Math.min(spec.width, spec.depth) * spec.mansardSteepWidthRatio
      const h1 = s * t
      const ai = a - s
      const bi = b - s
      const t2 = (h1 / spec.mansardSteepHeightRatio - h1) / Math.min(ai, bi)
      return min([...hipPlanes(a, b, t), ...hipPlanes(ai, bi, t2, h1)])
    }
    default:
      return 0
  }
}
