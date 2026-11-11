import type {
  CanvasElement,
  FabricsDocument,
  Level,
  OpeningElement,
  StairElement,
  WallElement,
} from '../../types/document'
import { elementsOfLevel } from '../documents/levels'
import { polygonArea, polygonPerimeter, polylineLength } from '../geometry/polygon'
import { stairStatus } from '../stairs/stairs'
import { collectStairVoids, voidsOfRoom, type StairVoid } from '../stairs/voids'

export interface RoomMeasure {
  id: string
  name: string
  /** Surface du contour tracé, en mm². */
  area: number
  /** Périmètre du contour tracé, en mm. */
  perimeter: number
  /** Surface de trémie dans la pièce (escalier qui arrive du niveau du dessous), en mm². */
  voidArea: number
  /** Surface nette : surface au tracé moins les trémies, en mm². */
  netArea: number
  /** Vrai si une trémie déborde de la pièce (dalle laissée pleine, aucune surface retirée). */
  voidOverflow: boolean
}

export interface PlatformMeasure {
  id: string
  name: string
  /** Surface du contour, en mm². */
  area: number
  /** Hauteur du dessus par rapport au plancher du niveau, en mm. */
  elevation: number
  /** Épaisseur sous le dessus, en mm. */
  thickness: number
  /** Volume : surface × épaisseur, en mm³. */
  volume: number
}

export interface StairMeasure {
  id: string
  name: string
  shape: StairElement['shape']
  /** Emmarchement, en mm. */
  width: number
  /** Hauteur à monter, en mm (`null` sans niveau au-dessus). */
  rise: number | null
  /** Nombre de contremarches (`null` sans niveau au-dessus). */
  risers: number | null
  /** Nombre de girons. */
  treads: number | null
  /** Hauteur d'une contremarche, en mm. */
  riserHeight: number | null
  /** Giron, en mm. */
  treadDepth: number | null
  /** `ok`, `too-short` (longueur insuffisante) ou `no-level-above`. */
  status: 'ok' | 'too-short' | 'no-level-above'
  /** Longueur de volées nécessaire (mm) quand l'escalier est trop court. */
  requiredRun: number | null
}

export interface WallMeasure {
  id: string
  name: string
  /** Longueur de l'axe, en mm. */
  length: number
  thickness: number // mm
  height: number // mm
  /** Surface brute d'une face : longueur × hauteur, sans déduction d'ouvertures, en mm². */
  wallArea: number
  /** Surface des ouvertures posées sur ce mur, en mm². */
  openingsArea: number
  /** Surface nette : surface brute moins les ouvertures, en mm² (jamais négative). */
  netArea: number
}

export interface OpeningMeasure {
  id: string
  name: string
  kind: OpeningElement['kind']
  wallId: string
  wallName: string
  width: number // mm
  height: number // mm
  sillHeight: number // mm
  /** Surface dans le mur : largeur × hauteur, limitée à la hauteur du mur, en mm². */
  area: number
}

export interface Measurements {
  rooms: RoomMeasure[]
  walls: WallMeasure[]
  platforms: PlatformMeasure[]
  stairs: StairMeasure[]
  /** Ouvertures posées sur un mur existant, dans l'ordre du document. */
  openings: OpeningMeasure[]
  totals: {
    roomArea: number // mm²
    /** Surface des trémies (mm²) et surface nette des pièces (mm²). */
    voidArea: number
    roomNetArea: number
    /** Surface des plateformes (mm²) et volume (mm³ = surface × épaisseur). */
    platformArea: number
    platformVolume: number
    wallLength: number // mm
    /** Surface murale brute. */
    wallArea: number // mm²
    openingsArea: number // mm²
    /** Surface murale nette : brute moins les ouvertures. */
    wallNetArea: number // mm²
    doors: number
    windows: number
    bays: number
  }
}

/** Surface d'une ouverture dans son mur : sa hauteur est limitée à ce qui reste au-dessus de l'allège. */
function openingMeasure(opening: OpeningElement, wall: WallElement): OpeningMeasure {
  const visibleHeight = Math.max(0, Math.min(opening.height, wall.height - opening.sillHeight))
  return {
    id: opening.id,
    name: opening.name,
    kind: opening.kind,
    wallId: wall.id,
    wallName: wall.name,
    width: opening.width,
    height: opening.height,
    sillHeight: opening.sillHeight,
    area: opening.width * visibleHeight,
  }
}

/**
 * Métrés d'un plan (docs/02-ARCHITECTURE.md). Les quantités s'arrêtent aux surfaces et longueurs :
 * aucun prix. Tous les éléments sont comptés, même masqués : masquer ne change que l'affichage.
 * Résultats en mm et mm² ; la mise en forme (m, m²) est faite par `features/units`.
 */
export function computeMeasurements(
  elements: readonly CanvasElement[],
  levels?: readonly Level[],
  /** Trémies qui percent ce niveau (escaliers du niveau du dessous). */
  voids: readonly StairVoid[] = [],
): Measurements {
  const rooms: RoomMeasure[] = []
  const walls: WallMeasure[] = []
  const platforms: PlatformMeasure[] = []
  const stairs: StairMeasure[] = []
  const openings: OpeningMeasure[] = []

  // Les ouvertures d'abord : un mur a besoin de la surface des siennes.
  const wallById = new Map(
    elements.filter((el): el is WallElement => el.type === 'wall').map((wall) => [wall.id, wall]),
  )
  const openingsArea = new Map<string, number>()
  for (const element of elements) {
    if (element.type !== 'opening') continue
    const wall = wallById.get(element.wallId)
    if (!wall) continue // ouverture orpheline : rien à mesurer
    const measure = openingMeasure(element, wall)
    openings.push(measure)
    openingsArea.set(wall.id, (openingsArea.get(wall.id) ?? 0) + measure.area)
  }

  for (const element of elements) {
    if (element.type === 'room') {
      const area = polygonArea(element.points)
      const roomVoids = voidsOfRoom(element, voids)
      rooms.push({
        id: element.id,
        name: element.name,
        area,
        perimeter: polygonPerimeter(element.points),
        voidArea: roomVoids.area,
        netArea: Math.max(0, area - roomVoids.area),
        voidOverflow: roomVoids.overflowing.length > 0,
      })
    } else if (element.type === 'stair') {
      const status = stairStatus(element, levels)
      const steps = status.kind === 'no-level-above' ? null : status.steps
      stairs.push({
        id: element.id,
        name: element.name,
        shape: element.shape,
        width: element.width,
        rise: status.kind === 'no-level-above' ? null : status.rise,
        risers: steps?.risers ?? null,
        treads: steps?.treads ?? null,
        riserHeight: steps?.riserHeight ?? null,
        treadDepth: steps?.treadDepth ?? null,
        status: status.kind,
        requiredRun: status.kind === 'too-short' ? status.steps.requiredRun : null,
      })
    } else if (element.type === 'platform') {
      const area = polygonArea(element.points)
      platforms.push({
        id: element.id,
        name: element.name,
        area,
        elevation: element.elevation,
        thickness: element.thickness,
        volume: area * element.thickness,
      })
    } else if (element.type === 'wall') {
      const length = polylineLength(element.points)
      const wallArea = length * element.height
      const deducted = openingsArea.get(element.id) ?? 0
      walls.push({
        id: element.id,
        name: element.name,
        length,
        thickness: element.thickness,
        height: element.height,
        wallArea,
        openingsArea: deducted,
        netArea: Math.max(0, wallArea - deducted),
      })
    }
  }

  const count = (kind: OpeningElement['kind']) => openings.filter((o) => o.kind === kind).length

  return {
    rooms,
    walls,
    platforms,
    stairs,
    openings,
    totals: {
      roomArea: rooms.reduce((sum, room) => sum + room.area, 0),
      voidArea: rooms.reduce((sum, room) => sum + room.voidArea, 0),
      roomNetArea: rooms.reduce((sum, room) => sum + room.netArea, 0),
      platformArea: platforms.reduce((sum, platform) => sum + platform.area, 0),
      platformVolume: platforms.reduce((sum, platform) => sum + platform.volume, 0),
      wallLength: walls.reduce((sum, wall) => sum + wall.length, 0),
      wallArea: walls.reduce((sum, wall) => sum + wall.wallArea, 0),
      openingsArea: walls.reduce((sum, wall) => sum + wall.openingsArea, 0),
      wallNetArea: walls.reduce((sum, wall) => sum + wall.netArea, 0),
      doors: count('door'),
      windows: count('window'),
      bays: count('bay'),
    },
  }
}

export interface LevelMeasurements {
  level: Level
  measurements: Measurements
}

export interface BuildingMeasurements {
  /** Métrés de chaque niveau, du plus bas au plus haut. */
  levels: LevelMeasurements[]
  /** Métrés du bâtiment : les listes et les totaux de tous les niveaux réunis. */
  total: Measurements
}

/** Réunit plusieurs métrés en un seul : listes mises bout à bout, totaux additionnés. */
export function sumMeasurements(list: readonly Measurements[]): Measurements {
  const sum = (pick: (m: Measurements) => number) => list.reduce((acc, m) => acc + pick(m), 0)
  return {
    rooms: list.flatMap((m) => m.rooms),
    walls: list.flatMap((m) => m.walls),
    platforms: list.flatMap((m) => m.platforms),
    stairs: list.flatMap((m) => m.stairs),
    openings: list.flatMap((m) => m.openings),
    totals: {
      roomArea: sum((m) => m.totals.roomArea),
      voidArea: sum((m) => m.totals.voidArea),
      roomNetArea: sum((m) => m.totals.roomNetArea),
      platformArea: sum((m) => m.totals.platformArea),
      platformVolume: sum((m) => m.totals.platformVolume),
      wallLength: sum((m) => m.totals.wallLength),
      wallArea: sum((m) => m.totals.wallArea),
      openingsArea: sum((m) => m.totals.openingsArea),
      wallNetArea: sum((m) => m.totals.wallNetArea),
      doors: sum((m) => m.totals.doors),
      windows: sum((m) => m.totals.windows),
      bays: sum((m) => m.totals.bays),
    },
  }
}

/**
 * Métrés par niveau et pour tout le bâtiment. Chaque niveau ne compte que ses propres éléments
 * (ceux dont `levelId` est le sien) ; les totaux du bâtiment sont la somme des niveaux.
 */
export function computeBuildingMeasurements(
  document: Pick<FabricsDocument, 'elements' | 'levels'>,
): BuildingMeasurements {
  const voids = collectStairVoids(document.elements, document.levels)
  const levels = (document.levels ?? []).map((level) => ({
    level,
    measurements: computeMeasurements(
      elementsOfLevel(document.elements, level.id),
      document.levels,
      voids.filter((v) => v.levelId === level.id),
    ),
  }))
  return { levels, total: sumMeasurements(levels.map((l) => l.measurements)) }
}
