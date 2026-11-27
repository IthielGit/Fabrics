import { buildPlanarGraph, EPSILON, pointInRing, signedArea, traceCycles } from './planarGraph'
import type { Point } from './viewport'
import type { Segment } from './walls'

export { pointInRing }

/** Recul (mm) du point d'essai vers l'intérieur d'un morceau, pour savoir de quel côté il est. */
const PROBE_MM = 0.05

/** Un morceau de plan découpé par les contours de deux polygones A et B. */
export interface PolygonPiece {
  /** Contour extérieur, puis les trous éventuels. */
  rings: Point[][]
  /** Surface (mm²), trous retirés. */
  area: number
  /** Longueur de tous les contours (mm). */
  perimeter: number
}

function ringLength(ring: readonly Point[]): number {
  let total = 0
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    total += Math.hypot(b.x - a.x, b.y - a.y)
  }
  return total
}

function ringSegments(ring: readonly Point[]): Segment[] {
  return ring.map((a, i) => ({ a, b: ring[(i + 1) % ring.length] }))
}

interface Cycle {
  polygon: Point[]
  area: number
  component: number
}

/**
 * Découpe le plan par les contours de `a` et de `b` (même méthode que `regions.ts` : graphe plan,
 * faces parcourues en gardant la zone à gauche) et renvoie les morceaux qui sont dans `a` mais pas
 * dans `b`, c'est-à-dire la différence A − B. Un morceau peut avoir des trous (B entièrement à
 * l'intérieur de A sans toucher son bord).
 */
export function polygonDifference(
  /** Un contour, ou un contour suivi de ses trous (un morceau déjà découpé). */
  a: readonly Point[] | readonly (readonly Point[])[],
  b: readonly Point[],
): PolygonPiece[] {
  const aRings = (a.length > 0 && Array.isArray(a[0]) ? a : [a]) as readonly (readonly Point[])[]
  if (aRings[0].length < 3) return []
  const inA = (p: Point) => pointInRing(p, aRings[0]) && !aRings.slice(1).some((hole) => pointInRing(p, hole))
  if (b.length < 3) {
    const rings = aRings.map((ring) => [...ring])
    const area = Math.abs(signedArea(rings[0])) - rings.slice(1).reduce((s, r) => s + Math.abs(signedArea(r)), 0)
    return area > EPSILON ? [{ rings, area, perimeter: rings.reduce((s, r) => s + ringLength(r), 0) }] : []
  }
  const segments = [...aRings.flatMap(ringSegments), ...ringSegments(b)]

  // 1. Graphe plan élagué ; composantes connexes.
  const graph = buildPlanarGraph(segments)
  const { nodes, adjacency } = graph
  const component = nodes.map(() => -1)
  let components = 0
  for (let start = 0; start < nodes.length; start++) {
    if (component[start] !== -1 || adjacency[start].size === 0) continue
    const stack = [start]
    component[start] = components
    while (stack.length > 0) {
      const node = stack.pop() as number
      for (const next of adjacency[node]) {
        if (component[next] === -1) {
          component[next] = components
          stack.push(next)
        }
      }
    }
    components++
  }

  // 2. Faces : cycles d'aire positive ; les cycles d'aire négative bordent chaque composante par l'extérieur.
  const faces: Cycle[] = []
  const outers: Cycle[] = []
  for (const traced of traceCycles(graph)) {
    const cycle = { polygon: traced.polygon, area: Math.abs(traced.signedArea), component: component[traced.start] }
    if (traced.signedArea > EPSILON) faces.push(cycle)
    else if (traced.signedArea < -EPSILON) outers.push(cycle)
  }

  // 3. Trous : une composante posée dans une face d'une autre composante (la plus petite qui la contient).
  const holes = new Map<Cycle, Cycle[]>()
  for (const outer of outers) {
    let best: Cycle | null = null
    for (const face of faces) {
      if (face.component === outer.component) continue
      if (best && face.area >= best.area) continue
      if (pointInRing(outer.polygon[0], face.polygon)) best = face
    }
    if (best) holes.set(best, [...(holes.get(best) ?? []), outer])
  }

  // 4. Un point juste à l'intérieur de chaque face dit si elle est dans A et hors de B.
  const pieces: PolygonPiece[] = []
  for (const face of faces) {
    const faceHoles = holes.get(face) ?? []
    const probe = interiorProbe(face.polygon, faceHoles.map((h) => h.polygon))
    if (!probe || !inA(probe) || pointInRing(probe, b)) continue
    const area = face.area - faceHoles.reduce((sum, h) => sum + h.area, 0)
    if (area <= EPSILON) continue
    const rings = [face.polygon, ...faceHoles.map((h) => h.polygon)]
    pieces.push({ rings, area, perimeter: rings.reduce((sum, ring) => sum + ringLength(ring), 0) })
  }
  return pieces
}

/** Point juste à l'intérieur d'une face (à gauche de ses côtés, les plus longs d'abord), hors de ses trous. */
function interiorProbe(polygon: readonly Point[], holes: readonly Point[][]): Point | null {
  const sides = polygon
    .map((p, i) => ({ p, q: polygon[(i + 1) % polygon.length] }))
    .map((side) => ({ ...side, length: Math.hypot(side.q.x - side.p.x, side.q.y - side.p.y) }))
    .filter((side) => side.length > EPSILON)
    .sort((s, t) => t.length - s.length)
  for (const { p, q, length } of sides) {
    const offset = Math.min(PROBE_MM, length / 4)
    const probe = {
      x: (p.x + q.x) / 2 - ((q.y - p.y) / length) * offset,
      y: (p.y + q.y) / 2 + ((q.x - p.x) / length) * offset,
    }
    if (pointInRing(probe, polygon) && !holes.some((hole) => pointInRing(probe, hole))) return probe
  }
  return null
}
