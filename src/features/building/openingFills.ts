import type { Level, OpeningElement, WallElement } from '../../types/document'
import { openingInterval, wallSegment } from '../geometry/openings'
import { openingStyle } from '../openings/styles'
import type { OpeningFill, OpeningMark, Vec3 } from './types'

/** Sous cette taille (mm), un morceau est ignoré. */
const MIN_SIZE = 1
/** Largeur vue de face (mm) et profondeur (mm) des cadres de fenêtre et de porte. */
const FRAME_WIDTH = 60
const FRAME_DEPTH = 70
/** Épaisseur d'une vitre et d'un vantail de porte (mm). */
const GLASS_DEPTH = 24
const DOOR_DEPTH = 40
/** Jour entre deux vantaux ou deux panneaux voisins (mm). */
const GAP = 4
/** Recouvrement de deux vitrages coulissants, en fraction de la largeur libre. */
const SLIDING_OVERLAP = 0.04
/** Hauteur approchée d'un panneau de porte sectionnelle (mm). */
const GARAGE_PANEL = 500

export interface OpeningDetails {
  fills: OpeningFill[]
  marks: OpeningMark[]
}

/**
 * Remplissage et marques des ouvertures d'un mur, selon leur style (M10 bis). Les mêmes boîtes
 * servent à la vue 3D, aux façades et aux coupes : une fenêtre à deux vantaux a deux vitres séparées
 * par un montant, une porte de garage sectionnelle est faite de panneaux superposés, etc.
 *
 * `fills` : cadre sur le pourtour (sans traverse basse pour une porte), puis vitres, vantaux ou
 * panneaux. `marks` : traits de façade (triangle d'ouverture vers les gonds, flèche d'un
 * coulissant, marque de l'oscillo-battant), qui ne sont pas des volumes.
 * Les dimensions suivent le trou découpé dans le mur (même bornage).
 */
export function buildOpeningDetails(
  wall: WallElement,
  openings: readonly OpeningElement[],
  level: Pick<Level, 'id' | 'elevation'>,
): OpeningDetails {
  const fills: OpeningFill[] = []
  const marks: OpeningMark[] = []
  const height = wall.height
  if (height < MIN_SIZE || wall.thickness < MIN_SIZE) return { fills, marks }
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

    const style = openingStyle(o)
    // Une ouverture libre n'a ni cadre ni remplissage.
    if (style === 'free') continue

    const rotationY = -Math.atan2(segment.direction.y, segment.direction.x)
    const normal = { x: -segment.direction.y, y: segment.direction.x } // « gauche » du mur
    /** Boîte du remplissage : `dz` la décale dans l'épaisseur du mur (vers la gauche si positif). */
    const add = (
      kind: OpeningFill['kind'],
      u0: number,
      u1: number,
      y0: number,
      y1: number,
      d: number,
      dz = 0,
    ) => {
      if (u1 - u0 < MIN_SIZE || y1 - y0 < MIN_SIZE) return
      const mid = (u0 + u1) / 2
      fills.push({
        kind,
        sourceId: wall.id,
        levelId: level.id,
        center: {
          x: segment.a.x + segment.direction.x * mid + normal.x * dz,
          y: level.elevation + (y0 + y1) / 2,
          z: segment.a.y + segment.direction.y * mid + normal.y * dz,
        },
        size: { x: u1 - u0, y: y1 - y0, z: d },
        rotationY,
      })
    }
    /** Point du plan de la baie (u le long du mur, y hauteur au-dessus du plancher du niveau). */
    const at = (u: number, y: number): Vec3 => ({
      x: segment.a.x + segment.direction.x * u,
      y: level.elevation + y,
      z: segment.a.y + segment.direction.y * u,
    })
    const mark = (points: [number, number][], dashed: boolean) => {
      marks.push({
        sourceId: wall.id,
        levelId: level.id,
        points: points.map(([u, y]) => at(u, y)),
        dashed,
      })
    }

    const frame = Math.min(FRAME_WIDTH, (to - from) / 4, (top - sill) / 4)
    const isDoor = o.kind === 'door'
    add('frame', from, from + frame, sill, top, depth)
    add('frame', to - frame, to, sill, top, depth)
    add('frame', from + frame, to - frame, top - frame, top, depth)
    if (!isDoor) add('frame', from + frame, to - frame, sill, sill + frame, depth)

    // Zone libre à garnir (vitrage ou vantaux).
    const iu0 = from + frame
    const iu1 = to - frame
    const iy0 = isDoor ? sill : sill + frame
    const iy1 = top - frame
    const mid = (iu0 + iu1) / 2
    const pane = (u0: number, u1: number, dz = 0) => add('glass', u0, u1, iy0, iy1, GLASS_DEPTH, dz)
    const leaf = (u0: number, u1: number, y0 = iy0, y1 = iy1, dz = 0) =>
      add('door', u0, u1, y0, y1, DOOR_DEPTH, dz)
    /** Panneau d'une porte de garage : métal peint, d'un autre aspect qu'une porte en bois. */
    const garagePanel = (u0: number, u1: number, y0: number, y1: number) =>
      add('garage', u0, u1, y0, y1, DOOR_DEPTH)

    /** Triangle d'ouverture : la pointe est du côté des gonds. */
    const sideTriangle = (u0: number, u1: number, hinge: 'start' | 'end') => {
      const apex = hinge === 'start' ? u0 : u1
      const far = hinge === 'start' ? u1 : u0
      mark(
        [
          [far, iy1],
          [apex, (iy0 + iy1) / 2],
          [far, iy0],
        ],
        true,
      )
    }
    /** Triangle d'un vantail basculant autour de son bas (soufflet, oscillo-battant). */
    const tiltTriangle = (u0: number, u1: number) => {
      mark(
        [
          [u0, iy1],
          [(u0 + u1) / 2, iy0],
          [u1, iy1],
        ],
        true,
      )
    }
    /** Flèche de coulissement vers le côté des gonds, à mi-hauteur. */
    const slideArrow = (u0: number, u1: number) => {
      const y = (iy0 + iy1) / 2
      const length = (u1 - u0) / 2
      const direction = o.hinge === 'start' ? -1 : 1
      const tip = (u0 + u1) / 2 + direction * length
      const head = Math.min(120, length / 3)
      mark(
        [
          [(u0 + u1) / 2, y],
          [tip, y],
        ],
        false,
      )
      mark(
        [
          [tip - direction * head, y + head / 2],
          [tip, y],
          [tip - direction * head, y - head / 2],
        ],
        false,
      )
    }
    /** Deux vitrages qui se croisent sur deux rails (fenêtre ou baie coulissante). */
    const slidingPanes = () => {
      const overlap = Math.max(MIN_SIZE, (iu1 - iu0) * SLIDING_OVERLAP)
      const offset = GLASS_DEPTH * 0.6
      pane(iu0, mid + overlap, offset)
      pane(mid - overlap, iu1, -offset)
      slideArrow(iu0, iu1)
    }

    switch (style) {
      // --- Portes ---
      case 'swing':
        leaf(iu0, iu1)
        sideTriangle(iu0, iu1, o.hinge)
        break
      case 'double':
        leaf(iu0, mid - GAP / 2)
        leaf(mid + GAP / 2, iu1)
        sideTriangle(iu0, mid - GAP / 2, 'start')
        sideTriangle(mid + GAP / 2, iu1, 'end')
        break
      case 'swingBoth': {
        // Va-et-vient : un petit vitrage dans le tiers haut du vantail.
        leaf(iu0, iu1)
        const w = iu1 - iu0
        const h = iy1 - iy0
        add('glass', iu0 + w * 0.25, iu1 - w * 0.25, iy0 + h * 0.6, iy0 + h * 0.85, DOOR_DEPTH + GAP)
        sideTriangle(iu0, iu1, o.hinge)
        break
      }
      case 'slidingSurface': {
        // Vantail posé contre la face du mur, du côté où la porte s'ouvre.
        const shift = (o.side === 'left' ? 1 : -1) * (wall.thickness / 2 + DOOR_DEPTH / 2)
        leaf(iu0, iu1, iy0, iy1, shift)
        slideArrow(iu0, iu1)
        break
      }
      case 'slidingPocket':
        leaf(iu0, iu1)
        slideArrow(iu0, iu1)
        break
      case 'folding': {
        const count = 4
        const panelWidth = (iu1 - iu0) / count
        for (let i = 0; i < count; i++) {
          leaf(
            iu0 + panelWidth * i + (i > 0 ? GAP / 2 : 0),
            iu0 + panelWidth * (i + 1) - (i < count - 1 ? GAP / 2 : 0),
            iy0,
            iy1,
            i % 2 === 0 ? 12 : -12,
          )
        }
        break
      }
      case 'garageSectional': {
        const count = Math.max(2, Math.round((iy1 - iy0) / GARAGE_PANEL))
        const panelHeight = (iy1 - iy0) / count
        for (let i = 0; i < count; i++) {
          garagePanel(
            iu0,
            iu1,
            iy0 + panelHeight * i + (i > 0 ? GAP / 2 : 0),
            iy0 + panelHeight * (i + 1) - (i < count - 1 ? GAP / 2 : 0),
          )
        }
        break
      }
      case 'garageTilt':
        garagePanel(iu0, iu1, iy0, iy1)
        break

      // --- Fenêtres ---
      case 'casement2':
        // Deux vantaux séparés par un montant central.
        add('frame', mid - frame / 2, mid + frame / 2, iy0, iy1, depth)
        pane(iu0, mid - frame / 2)
        pane(mid + frame / 2, iu1)
        sideTriangle(iu0, mid - frame / 2, 'start')
        sideTriangle(mid + frame / 2, iu1, 'end')
        if (o.tiltTurn) {
          tiltTriangle(iu0, mid - frame / 2)
          tiltTriangle(mid + frame / 2, iu1)
        }
        break
      case 'casement1':
        pane(iu0, iu1)
        sideTriangle(iu0, iu1, o.hinge)
        if (o.tiltTurn) tiltTriangle(iu0, iu1)
        break
      case 'fixed':
      case 'bay-fixed':
        pane(iu0, iu1)
        break
      case 'tilt':
        pane(iu0, iu1)
        tiltTriangle(iu0, iu1)
        break
      case 'sliding':
      case 'bay-sliding':
        slidingPanes()
        break
    }
  }
  return { fills, marks }
}

/** Remplissage seul des ouvertures d'un mur (voir `buildOpeningDetails`). */
export function buildOpeningFills(
  wall: WallElement,
  openings: readonly OpeningElement[],
  level: Pick<Level, 'id' | 'elevation'>,
): OpeningFill[] {
  return buildOpeningDetails(wall, openings, level).fills
}
