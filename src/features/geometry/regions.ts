import { toPoints } from './polygon'
import type { Point } from './viewport'
import {
  buildPlanarGraph,
  distanceToSegment,
  EPSILON,
  ON_SEGMENT_TOLERANCE,
  pointInRing,
  traceCycles,
} from './planarGraph'
import { wallFaceSegments, type Segment, type WallGeometry } from './walls'

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

  // 2. Graphe plan et cycles ; ceux d'aire positive sont les contours de zones fermées
  // (les cycles d'aire négative entourent l'extérieur ou un îlot).
  const cycles: Cycle[] = []
  for (const traced of traceCycles(buildPlanarGraph(faces))) {
    if (traced.signedArea <= EPSILON) continue
    const { polygon } = traced
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
    cycles.push({ polygon, area: traced.signedArea, minX, minY, maxX, maxY })
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
        if (pointInRing(point, cycle.polygon)) best = cycle
      }
      return best ? simplify(best.polygon) : null
    },
  }
}

/** Raccourci pour une recherche unique ; préférer `createRegionFinder` pour plusieurs points. */
export function findEnclosedRegion(walls: readonly WallGeometry[], point: Point): Point[] | null {
  return createRegionFinder(walls).find(point)
}
