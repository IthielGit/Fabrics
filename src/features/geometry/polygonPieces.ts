import type { Point } from './viewport'
import { segmentIntersection, type Segment } from './walls'

/** Deux points à moins de 0,01 mm l'un de l'autre sont le même point (même règle que `regions.ts`). */
const NODE_PRECISION = 0.01
const ON_SEGMENT_TOLERANCE = 0.01
const EPSILON = 1e-9
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

function signedArea(polygon: readonly Point[]): number {
  let sum = 0
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i]
    const b = polygon[(i + 1) % polygon.length]
    sum += a.x * b.y - b.x * a.y
  }
  return sum / 2
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

export function pointInRing(point: Point, ring: readonly Point[]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i]
    const b = ring[j]
    if (a.y > point.y !== b.y > point.y) {
      const x = ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
      if (point.x < x) inside = !inside
    }
  }
  return inside
}

function distanceToSegment(point: Point, segment: Segment): number {
  const dx = segment.b.x - segment.a.x
  const dy = segment.b.y - segment.a.y
  const lengthSquared = dx * dx + dy * dy
  if (lengthSquared === 0) return Math.hypot(point.x - segment.a.x, point.y - segment.a.y)
  const t = Math.max(0, Math.min(1, ((point.x - segment.a.x) * dx + (point.y - segment.a.y) * dy) / lengthSquared))
  return Math.hypot(point.x - (segment.a.x + t * dx), point.y - (segment.a.y + t * dy))
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

  // 1. Graphe plan : nœuds uniques, segments découpés à chaque croisement.
  const nodes: Point[] = []
  const nodeIndex = new Map<string, number>()
  const nodeOf = (p: Point): number => {
    const key = `${Math.round(p.x / NODE_PRECISION)},${Math.round(p.y / NODE_PRECISION)}`
    let index = nodeIndex.get(key)
    if (index === undefined) {
      index = nodes.length
      nodes.push({ x: p.x, y: p.y })
      nodeIndex.set(key, index)
    }
    return index
  }
  const edges = new Set<string>()
  segments.forEach((segment, i) => {
    const dx = segment.b.x - segment.a.x
    const dy = segment.b.y - segment.a.y
    const lengthSquared = dx * dx + dy * dy
    if (lengthSquared === 0) return
    const cuts: { t: number; point: Point }[] = [
      { t: 0, point: segment.a },
      { t: 1, point: segment.b },
    ]
    const addCut = (point: Point) => {
      const t = ((point.x - segment.a.x) * dx + (point.y - segment.a.y) * dy) / lengthSquared
      cuts.push({ t: Math.max(0, Math.min(1, t)), point })
    }
    segments.forEach((other, j) => {
      if (i === j) return
      const crossing = segmentIntersection(segment, other)
      if (crossing) addCut(crossing)
      for (const end of [other.a, other.b]) {
        if (distanceToSegment(end, segment) <= ON_SEGMENT_TOLERANCE) addCut(end)
      }
    })
    cuts.sort((p, q) => p.t - q.t)
    for (let k = 1; k < cuts.length; k++) {
      const from = nodeOf(cuts[k - 1].point)
      const to = nodeOf(cuts[k].point)
      if (from !== to) edges.add(from < to ? `${from}:${to}` : `${to}:${from}`)
    }
  })

  // 2. Voisins ; élagage des bouts qui n'enferment rien ; composantes connexes.
  const adjacency: Set<number>[] = nodes.map(() => new Set<number>())
  for (const edge of edges) {
    const [from, to] = edge.split(':').map(Number)
    adjacency[from].add(to)
    adjacency[to].add(from)
  }
  const dangling: number[] = []
  adjacency.forEach((neighbours, index) => {
    if (neighbours.size < 2) dangling.push(index)
  })
  while (dangling.length > 0) {
    const index = dangling.pop() as number
    for (const other of adjacency[index]) {
      adjacency[other].delete(index)
      if (adjacency[other].size < 2) dangling.push(other)
    }
    adjacency[index].clear()
  }
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

  // 3. Faces : cycles d'aire positive ; les cycles d'aire négative bordent chaque composante par l'extérieur.
  const sorted = adjacency.map((neighbours, index) =>
    [...neighbours]
      .map((to) => ({ to, angle: Math.atan2(nodes[to].y - nodes[index].y, nodes[to].x - nodes[index].x) }))
      .sort((p, q) => p.angle - q.angle),
  )
  const slot = sorted.map((list) => new Map(list.map((n, k) => [n.to, k])))
  const visited = sorted.map((list) => list.map(() => false))
  const faces: Cycle[] = []
  const outers: Cycle[] = []
  let guard = 0
  for (let start = 0; start < sorted.length; start++) {
    for (let k = 0; k < sorted[start].length; k++) {
      if (visited[start][k]) continue
      const polygon: Point[] = []
      let from = start
      let index = k
      while (!visited[from][index] && guard++ < 1_000_000) {
        visited[from][index] = true
        polygon.push(nodes[from])
        const to = sorted[from][index].to
        const back = slot[to].get(from) as number
        index = (back - 1 + sorted[to].length) % sorted[to].length
        from = to
      }
      const area = signedArea(polygon)
      const cycle = { polygon, area: Math.abs(area), component: component[start] }
      if (area > EPSILON) faces.push(cycle)
      else if (area < -EPSILON) outers.push(cycle)
    }
  }

  // 4. Trous : une composante posée dans une face d'une autre composante (la plus petite qui la contient).
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

  // 5. Un point juste à l'intérieur de chaque face dit si elle est dans A et hors de B.
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
