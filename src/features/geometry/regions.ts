import { toPoints } from './polygon'
import type { Point } from './viewport'
import { segmentIntersection, wallFaceSegments, type Segment, type WallGeometry } from './walls'

/** Deux points à moins de 0,01 mm l'un de l'autre sont le même point du graphe. */
const NODE_PRECISION = 0.01
/** Un point à moins de 0,01 mm d'un segment est considéré comme posé dessus. */
const ON_SEGMENT_TOLERANCE = 0.01
const EPSILON = 1e-9

/** Cherche la zone entièrement fermée par les murs autour d'un point (voir `createRegionFinder`). */
export interface RegionFinder {
  /**
   * Contour de la zone qui contient `point`, tracé sur les faces des murs tournées vers la zone
   * (donc la surface intérieure d'une pièce), ou `null` si le point est dans l'épaisseur d'un mur,
   * à l'extérieur, ou dans une zone qui n'est pas fermée.
   */
  find(point: Point): Point[] | null
}

interface Cycle {
  polygon: Point[]
  /** Aire (toujours positive). */
  area: number
  minX: number
  minY: number
  maxX: number
  maxY: number
}

interface Neighbour {
  to: number
  angle: number
}

function distanceToSegment(point: Point, segment: Segment): number {
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

/** Aire signée (formule du lacet) : positive quand le contour tourne dans le sens des angles croissants. */
function signedArea(polygon: readonly Point[]): number {
  let sum = 0
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i]
    const b = polygon[(i + 1) % polygon.length]
    sum += a.x * b.y - b.x * a.y
  }
  return sum / 2
}

function insidePolygon(point: Point, polygon: readonly Point[]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]
    const b = polygon[j]
    if (a.y > point.y !== b.y > point.y) {
      const x = ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
      if (point.x < x) inside = !inside
    }
  }
  return inside
}

/** Retire les sommets en double et les sommets alignés avec leurs voisins. */
function simplify(polygon: readonly Point[]): Point[] {
  let points = [...polygon]
  let changed = true
  while (changed && points.length > 3) {
    changed = false
    for (let i = 0; i < points.length; i++) {
      const previous = points[(i - 1 + points.length) % points.length]
      const current = points[i]
      const next = points[(i + 1) % points.length]
      const cross =
        (current.x - previous.x) * (next.y - current.y) -
        (current.y - previous.y) * (next.x - current.x)
      const scale = Math.hypot(current.x - previous.x, current.y - previous.y) || 1
      if (Math.abs(cross) / scale < ON_SEGMENT_TOLERANCE) {
        points = points.filter((_, index) => index !== i)
        changed = true
        break
      }
    }
  }
  return points
}

/**
 * Prépare la recherche de zones fermées. Les faces de tous les murs sont découpées à chaque
 * croisement (et là où des faces se recouvrent) pour former un graphe plan ; les bouts qui ne
 * ferment rien sont élagués ; chaque zone fermée est alors un cycle du graphe. Le calcul de départ
 * coûte O(n²) sur le nombre de faces : on le fait une fois et on interroge ensuite à volonté.
 */
export function createRegionFinder(walls: readonly WallGeometry[]): RegionFinder {
  // 1. Segments des faces et segments des axes (pour reconnaître un point dans l'épaisseur d'un mur).
  const faces: Segment[] = []
  const bodies: { segment: Segment; half: number }[] = []
  for (const wall of walls) {
    faces.push(...wallFaceSegments(wall))
    const axis = toPoints(wall.points)
    for (let i = 1; i < axis.length; i++) {
      bodies.push({ segment: { a: axis[i - 1], b: axis[i] }, half: wall.thickness / 2 })
    }
  }

  // 2. Graphe plan : nœuds uniques et arêtes découpées à chaque croisement.
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
  const boxes = faces.map((s) => ({
    minX: Math.min(s.a.x, s.b.x) - ON_SEGMENT_TOLERANCE,
    maxX: Math.max(s.a.x, s.b.x) + ON_SEGMENT_TOLERANCE,
    minY: Math.min(s.a.y, s.b.y) - ON_SEGMENT_TOLERANCE,
    maxY: Math.max(s.a.y, s.b.y) + ON_SEGMENT_TOLERANCE,
  }))

  faces.forEach((segment, i) => {
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

    faces.forEach((other, j) => {
      if (i === j) return
      const a = boxes[i]
      const b = boxes[j]
      if (a.maxX < b.minX || b.maxX < a.minX || a.maxY < b.minY || b.maxY < a.minY) return
      const crossing = segmentIntersection(segment, other)
      if (crossing) addCut(crossing)
      // Faces qui se recouvrent (murs partageant la même ligne) : les extrémités de l'autre
      // segment coupent celui-ci.
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

  // 3. Voisins de chaque nœud ; élagage des bouts qui n'enferment rien (nœuds de degré 1).
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

  // 4. Voisins triés par angle croissant, pour parcourir chaque face en gardant la zone à gauche.
  const sorted: Neighbour[][] = adjacency.map((neighbours, index) =>
    [...neighbours]
      .map((to) => ({
        to,
        angle: Math.atan2(nodes[to].y - nodes[index].y, nodes[to].x - nodes[index].x),
      }))
      .sort((p, q) => p.angle - q.angle),
  )
  const slot = sorted.map((list) => new Map(list.map((n, k) => [n.to, k])))

  // 5. Tous les cycles du graphe ; ceux d'aire positive sont les contours de zones fermées
  // (les cycles d'aire négative entourent l'extérieur ou un îlot).
  const visited = sorted.map((list) => list.map(() => false))
  const cycles: Cycle[] = []
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
      const area = signedArea(polygon)
      if (area <= EPSILON) continue
      let minX = Infinity
      let minY = Infinity
      let maxX = -Infinity
      let maxY = -Infinity
      for (const p of polygon) {
        minX = Math.min(minX, p.x)
        minY = Math.min(minY, p.y)
        maxX = Math.max(maxX, p.x)
        maxY = Math.max(maxY, p.y)
      }
      cycles.push({ polygon, area, minX, minY, maxX, maxY })
    }
  }

  return {
    find(point: Point): Point[] | null {
      // Dans l'épaisseur d'un mur : pas une zone.
      for (const { segment, half } of bodies) {
        if (distanceToSegment(point, segment) < half - ON_SEGMENT_TOLERANCE) return null
      }
      // Le plus petit cycle qui contient le point est la zone la plus proche.
      let best: Cycle | null = null
      for (const cycle of cycles) {
        if (best && cycle.area >= best.area) continue
        if (
          point.x < cycle.minX ||
          point.x > cycle.maxX ||
          point.y < cycle.minY ||
          point.y > cycle.maxY
        ) {
          continue
        }
        if (insidePolygon(point, cycle.polygon)) best = cycle
      }
      return best ? simplify(best.polygon) : null
    },
  }
}

/** Raccourci pour une recherche unique ; préférer `createRegionFinder` pour plusieurs points. */
export function findEnclosedRegion(walls: readonly WallGeometry[], point: Point): Point[] | null {
  return createRegionFinder(walls).find(point)
}
