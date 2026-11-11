import type { Level, OpeningElement, WallElement } from '../../types/document'
import { openingInterval, wallSegment } from '../geometry/openings'
import type { OpeningFill } from './types'

/** Sous cette taille (mm), un morceau est ignoré. */
const MIN_SIZE = 1
/** Largeur vue de face (mm) et profondeur (mm) des cadres de fenêtre et de porte. */
const FRAME_WIDTH = 60
const FRAME_DEPTH = 70
/** Épaisseur d'une vitre et d'un vantail de porte (mm). */
const GLASS_DEPTH = 24
const DOOR_DEPTH = 40

/**
 * Remplissage des ouvertures d'un mur pour la vue 3D : un cadre sur le pourtour (sans traverse
 * basse pour une porte), puis une vitre (fenêtre, baie) ou un vantail (porte), au milieu de
 * l'épaisseur du mur. Les dimensions suivent le trou découpé dans le mur (même bornage).
 */
export function buildOpeningFills(
  wall: WallElement,
  openings: readonly OpeningElement[],
  level: Pick<Level, 'id' | 'elevation'>,
): OpeningFill[] {
  const fills: OpeningFill[] = []
  const height = wall.height
  if (height < MIN_SIZE || wall.thickness < MIN_SIZE) return fills
  const depth = Math.min(FRAME_DEPTH, wall.thickness)

  for (const o of openings) {
    if (o.wallId !== wall.id) continue
    const segment = wallSegment(wall, o.segmentIndex)
    if (!segment) continue
    const interval = openingInterval(o)
    const from = Math.max(interval.from, 0)
    const to = Math.min(interval.to, segment.length)
    const sill = Math.min(Math.max(o.sillHeight, 0), height)
    const top = Math.min(sill + o.height, height)
    if (to - from < MIN_SIZE || top - sill < MIN_SIZE) continue

    const rotationY = -Math.atan2(segment.direction.y, segment.direction.x)
    const add = (kind: OpeningFill['kind'], u0: number, u1: number, y0: number, y1: number, d: number) => {
      if (u1 - u0 < MIN_SIZE || y1 - y0 < MIN_SIZE) return
      const mid = (u0 + u1) / 2
      fills.push({
        kind,
        sourceId: wall.id,
        levelId: level.id,
        center: {
          x: segment.a.x + segment.direction.x * mid,
          y: level.elevation + (y0 + y1) / 2,
          z: segment.a.y + segment.direction.y * mid,
        },
        size: { x: u1 - u0, y: y1 - y0, z: d },
        rotationY,
      })
    }

    const frame = Math.min(FRAME_WIDTH, (to - from) / 4, (top - sill) / 4)
    const isDoor = o.kind === 'door'
    add('frame', from, from + frame, sill, top, depth)
    add('frame', to - frame, to, sill, top, depth)
    add('frame', from + frame, to - frame, top - frame, top, depth)
    if (!isDoor) add('frame', from + frame, to - frame, sill, sill + frame, depth)
    const innerBottom = isDoor ? sill : sill + frame
    add(isDoor ? 'door' : 'glass', from + frame, to - frame, innerBottom, top - frame, isDoor ? DOOR_DEPTH : GLASS_DEPTH)
  }
  return fills
}
