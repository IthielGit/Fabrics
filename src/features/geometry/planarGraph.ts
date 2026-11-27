import type { Point } from './viewport'
import { segmentIntersection, type Segment } from './walls'

// Graphe plan partagé par `regions.ts` (zones fermées par les murs) et `polygonPieces.ts`
// (différence de polygones) : segments découpés à chaque croisement, bouts élagués, faces
// parcourues en gardant la zone à gauche.

/** Deux points à moins de 0,01 mm l'un de l'autre sont le même point du graphe. */
const NODE_PRECISION = 0.01
/** Un point à moins de 0,01 mm d'un segment est considéré comme posé dessus. */
export const ON_SEGMENT_TOLERANCE = 0.01
export const EPSILON = 1e-9

/** Aire signée (formule du lacet) : positive quand le contour tourne dans le sens des angles croissants. */
export function signedArea(polygon: readonly Point[]): number {
  let sum = 0
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i]
    const b = polygon[(i + 1) % polygon.length]
    sum += a.x * b.y - b.x * a.y
  }
  return sum / 2
}

/** Le point est-il à l'intérieur du contour (règle pair-impair) ? */
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

export function distanceToSegment(point: Point, segment: Segment): number {
  const dx = segment.b.x - segment.a.x
  const dy = segment.b.y - segment.a.y
  const lengthSquared = dx * dx + dy * dy
  if (lengthSquared === 0) return Math.hypot(point.x - segment.a.x, point.y - segment.a.y)
  const t = Math.max(
    0,
    Math.min(1, ((point.x - segment.a.x) * dx + (point.y - segment.a.y) * dy) / lengthSquared),
  )
  return Math.hypot(point.x - (segment.a.x + t * dx), point.y - (segment.a.y + t * dy))
}

/** Graphe plan élagué : nœuds et, pour chacun, ses voisins (les bouts qui ne ferment rien sont retirés). */
export interface PlanarGraph {
  nodes: Point[]
  adjacency: Set<number>[]
}

/**
 * Découpe les segments à chaque croisement (et là où ils se recouvrent), fusionne les points
 * confondus, puis élague les nœuds de degré 1. Coût O(n²) sur le nombre de segments ; une boîte
 * englobante écarte d'abord les paires qui ne peuvent pas se toucher.
 */
export function buildPlanarGraph(segments: readonly Segment[]): PlanarGraph {
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
  const boxes = segments.map((s) => ({
    minX: Math.min(s.a.x, s.b.x) - ON_SEGMENT_TOLERANCE,
    maxX: Math.max(s.a.x, s.b.x) + ON_SEGMENT_TOLERANCE,
    minY: Math.min(s.a.y, s.b.y) - ON_SEGMENT_TOLERANCE,
    maxY: Math.max(s.a.y, s.b.y) + ON_SEGMENT_TOLERANCE,
  }))

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
      const a = boxes[i]
      const b = boxes[j]
      if (a.maxX < b.minX || b.maxX < a.minX || a.maxY < b.minY || b.maxY < a.minY) return
      const crossing = segmentIntersection(segment, other)
      if (crossing) addCut(crossing)
      // Segments qui se recouvrent (murs sur la même ligne) : les extrémités de l'autre coupent celui-ci.
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
  return { nodes, adjacency }
}

/** Un cycle du graphe : contour, aire signée et nœud de départ. */
export interface TracedCycle {
  polygon: Point[]
  /** Positive pour une zone fermée, négative pour le bord extérieur d'un groupe de segments. */
  signedArea: number
  start: number
}

/**
 * Parcourt tous les cycles du graphe en gardant la zone à gauche. Les cycles d'aire positive sont
 * les zones fermées ; ceux d'aire négative entourent chaque groupe connexe par l'extérieur.
 */
export function traceCycles({ nodes, adjacency }: PlanarGraph): TracedCycle[] {
  const sorted = adjacency.map((neighbours, index) =>
    [...neighbours]
      .map((to) => ({
        to,
        angle: Math.atan2(nodes[to].y - nodes[index].y, nodes[to].x - nodes[index].x),
      }))
      .sort((p, q) => p.angle - q.angle),
  )
  const slot = sorted.map((list) => new Map(list.map((n, k) => [n.to, k])))
  const visited = sorted.map((list) => list.map(() => false))
  const cycles: TracedCycle[] = []
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
        // À l'arrivée, on repart par l'arête qui précède celle d'où l'on vient (sens horaire).
        const back = slot[to].get(from) as number
        index = (back - 1 + sorted[to].length) % sorted[to].length
        from = to
      }
      cycles.push({ polygon, signedArea: signedArea(polygon), start })
    }
  }
  return cycles
}
