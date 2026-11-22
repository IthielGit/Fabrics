import { withDisplayNames } from '../naming/autoNames'
import type {
  CanvasElement,
  ChimneyElement,
  FabricsDocument,
  Level,
  NativeRoofQuantity,
  NativeStairQuantity,
  OpeningElement,
  PascalQuantities,
  OpeningStyle,
  RoofElement,
  RoofShape,
  StairElement,
  WallElement,
} from '../../types/document'
import { computeRoof, isPitched, type RoofProblem } from '../building/roof'
import { elementsOfLevel } from '../documents/levels'
import { openingStyle } from '../openings/styles'
import { polygonArea, polygonPerimeter, polylineLength } from '../geometry/polygon'
import { tJunctionAdjustments } from '../geometry/wallContacts'
import { isOpeningOutside, openingInterval } from '../geometry/openings'
import { wallFaces } from '../geometry/walls'
import { habitableArea } from './habitableArea'
import { buildReferences, type References } from './references'
import { levelAboveOf, stairStatus } from '../stairs/stairs'
import { collectStairVoids, voidsOfRoom, type StairVoid } from '../stairs/voids'
import { type WallLayerMeasure, wallLayerMeasures } from './wallLayers'

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
  /** Largeur × profondeur (mm) d'une pièce rectangulaire aux côtés horizontaux et verticaux ; sinon `null`. */
  dimensions: [number, number] | null
  /** Vrai si une trémie déborde de la pièce (dalle laissée pleine, aucune surface retirée). */
  voidOverflow: boolean
  /** Hauteur sous plafond (mm), voir `ceilingHeight` ; `null` si la pièce n'a pas de niveau connu. */
  ceilingHeight: number | null
  /** Vrai si la pièce a un faux plafond (option de la pièce). */
  falseCeiling: boolean
  /**
   * Surface habitable (mm²) : surface nette moins la partie sous une hauteur de 1800 mm (toiture en
   * pente), voir `habitableArea`. Égale à `netArea` quand rien n'est trop bas.
   */
  habitableArea: number
}

/**
 * Hauteur sous plafond d'un niveau (mm) : du dessus de son sol au-dessous de la dalle du niveau du
 * dessus (dont le dessus est à l'altitude de ce niveau, épaisseur vers le bas, comme en 3D). Sans
 * niveau au-dessus : hauteur d'étage moins l'épaisseur du toit plat posé entre les murs.
 * Limite : sous un toit en pente, la hauteur varie ; c'est celle du toit plat qui est donnée.
 */
export function ceilingHeight(level: Level, levelAbove: Level | undefined): number {
  const underside = levelAbove
    ? levelAbove.elevation - levelAbove.slabThickness
    : level.elevation + level.height - Math.min(level.slabThickness, level.height)
  return Math.max(0, Math.round(underside - level.elevation))
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

/** Toiture (M10 bis) : quantités seulement, aucun prix (D33). */
export interface RoofMeasure {
  id: string
  name: string
  /** Forme de Fabrics, ou type d'un pan dessiné dans Pascal (M19 B6). */
  shape: RoofShape | NativeRoofQuantity['kind']
  /** Pente en degrés ; `null` pour un toit plat. */
  pitch: number | null
  /** Débord, en mm. */
  overhang: number
  /** Surface au sol, débord compris, en mm². */
  projectedArea: number
  /** Surface réelle des versants (projetée ÷ cos α), en mm². */
  realArea: number
  ridgeLength: number // mm
  eaveLength: number // mm
  /** Longueur réelle (en pente) des arêtiers, en mm. */
  hipLength: number
  gableCount: number
  /** Toiture non valable (quantités à 0) : pourquoi. */
  /** `trimmed` (M19 B6) : pan découpé dans Pascal, quantités du pan entier. */
  problem: RoofProblem | 'trimmed' | 'overlapCheck' | null
}

export interface StairMeasure {
  id: string
  name: string
  shape: StairElement['shape'] | NativeStairQuantity['shape']
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
  /** Longueur des deux faces, mesurées sur les faces (onglets compris), sans la part cachée par un mur en T, en mm. */
  facesLength: number
  /** Surface brute des deux faces : longueur des faces × hauteur, en mm². */
  facesArea: number
  /** Surface nette des deux faces : brute moins les ouvertures, comptées sur chaque face, en mm². */
  facesNetArea: number
  /** Volume du mur sur l'axe, ouvertures déduites : longueur × épaisseur × hauteur, moins la part comptée dans un autre mur à un raccord en T, en mm³. */
  volume: number
  /** Quantités par couche (M19 B3), si le mur a une composition. */
  layers?: WallLayerMeasure[]
}

export interface ChimneyMeasure {
  id: string
  name: string
  width: number // mm
  depth: number // mm
  /** Emprise : largeur × profondeur, en mm². */
  area: number
  /** Dépassement au-dessus du dernier niveau, en mm. */
  heightAboveTop: number
}

export interface OpeningMeasure {
  id: string
  name: string
  kind: OpeningElement['kind']
  /** Style effectif (le style par défaut du type si l'ouverture n'en a pas). */
  style: OpeningStyle
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
  chimneys: ChimneyMeasure[]
  roofs: RoofMeasure[]
  /** Ouvertures posées sur un mur existant, dans l'ordre du document. */
  openings: OpeningMeasure[]
  totals: {
    /** Toitures : surfaces (mm²), longueurs (mm), nombre de pignons. */
    roofProjectedArea: number
    roofRealArea: number
    roofRidgeLength: number
    roofEaveLength: number
    roofHipLength: number
    roofGables: number
    roomArea: number // mm²
    /** Surface des trémies (mm²) et surface nette des pièces (mm²). */
    voidArea: number
    roomNetArea: number
    /** Total des surfaces habitables des pièces, en mm² (voir `RoomMeasure.habitableArea`). */
    roomHabitableArea: number
    /** Surface des plateformes (mm²) et volume (mm³ = surface × épaisseur). */
    platformArea: number
    platformVolume: number
    wallLength: number // mm
    /** Surface murale brute. */
    wallArea: number // mm²
    openingsArea: number // mm²
    /** Surface murale nette : brute moins les ouvertures. */
    wallNetArea: number // mm²
    /** Murs sur les deux faces : surface brute et nette (mm²), volume (mm³). */
    wallFacesArea: number
    wallFacesNetArea: number
    wallVolume: number
    chimneys: number
    doors: number
    windows: number
    bays: number
  }
}

function pathLength(points: readonly { x: number; y: number }[]): number {
  let total = 0
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y)
  }
  return total
}

/** Quantités d'une toiture (la base n'influe pas sur les surfaces ni les longueurs). */
function roofMeasure(roof: RoofElement): RoofMeasure {
  const result = computeRoof(roof, 0)
  const base = {
    id: roof.id,
    name: roof.name,
    shape: roof.shape,
    pitch: isPitched(roof.shape) ? roof.pitch : null,
    overhang: roof.overhang,
  }
  if ('problem' in result) {
    return {
      ...base,
      projectedArea: 0,
      realArea: 0,
      ridgeLength: 0,
      eaveLength: 0,
      hipLength: 0,
      gableCount: 0,
      problem: result.problem,
    }
  }
  const g = result.geometry
  return {
    ...base,
    projectedArea: g.projectedArea,
    realArea: g.realArea,
    ridgeLength: g.ridgeLength,
    eaveLength: g.eaveLength,
    hipLength: g.hipLength,
    gableCount: g.gableCount,
    problem: null,
  }
}

function chimneyMeasure(chimney: ChimneyElement): ChimneyMeasure {
  return {
    id: chimney.id,
    name: chimney.name,
    width: chimney.width,
    depth: chimney.depth,
    area: chimney.width * chimney.depth,
    heightAboveTop: chimney.heightAboveTop,
  }
}

/** Largeur et profondeur d'un contour qui est un rectangle aux côtés horizontaux et verticaux (4 points). */
export function axisAlignedRectangle(points: readonly number[]): [number, number] | null {
  if (points.length !== 8) return null
  const xs = [points[0], points[2], points[4], points[6]]
  const ys = [points[1], points[3], points[5], points[7]]
  const x0 = Math.min(...xs)
  const x1 = Math.max(...xs)
  const y0 = Math.min(...ys)
  const y1 = Math.max(...ys)
  if (x1 <= x0 || y1 <= y0) return null
  // Les quatre sommets doivent être les quatre coins du rectangle englobant, chacun une fois.
  const seen = new Set(xs.map((x, i) => `${x === x0 ? 'l' : x === x1 ? 'r' : '?'}${ys[i] === y0 ? 't' : ys[i] === y1 ? 'b' : '?'}`))
  return seen.size === 4 && ![...seen].some((c) => c.includes('?')) ? [x1 - x0, y1 - y0] : null
}

/** Surface d'une ouverture dans son mur : sa hauteur est limitée à ce qui reste au-dessus de l'allège. */
function openingMeasure(opening: OpeningElement, wall: WallElement, outside = false): OpeningMeasure {
  const visibleHeight = outside ? 0 : Math.max(0, Math.min(opening.height, wall.height - opening.sillHeight))
  return {
    id: opening.id,
    name: opening.name,
    kind: opening.kind,
    style: openingStyle(opening),
    wallId: wall.id,
    wallName: wall.name,
    width: opening.width,
    height: opening.height,
    sillHeight: opening.sillHeight,
    area: opening.width * visibleHeight,
  }
}

/** Rectangle d'une ouverture dans l'élévation du mur : de `from` à `to` en long, de `bottom` à `top` en hauteur. */
interface Rectangle {
  from: number
  to: number
  bottom: number
  top: number
}

/** Surface de l'union de rectangles (mm²) : on découpe en bandes verticales aux abscisses des bords. */
function unionArea(rectangles: readonly Rectangle[]): number {
  const xs = [...new Set(rectangles.flatMap((r) => [r.from, r.to]))].sort((a, b) => a - b)
  let area = 0
  for (let i = 0; i + 1 < xs.length; i++) {
    const [x0, x1] = [xs[i], xs[i + 1]]
    const spans = rectangles
      .filter((r) => r.from <= x0 && r.to >= x1)
      .map((r) => [r.bottom, r.top] as const)
      .sort((a, b) => a[0] - b[0])
    let covered = 0
    let end = -Infinity
    for (const [bottom, top] of spans) {
      const start = Math.max(bottom, end)
      if (top > start) covered += top - start
      end = Math.max(end, top)
    }
    area += covered * (x1 - x0)
  }
  return area
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
  const chimneys: ChimneyMeasure[] = []
  const roofs: RoofMeasure[] = []
  const openings: OpeningMeasure[] = []

  // Les ouvertures d'abord : un mur a besoin de la surface des siennes.
  const wallById = new Map(
    elements.filter((el): el is WallElement => el.type === 'wall').map((wall) => [wall.id, wall]),
  )
  const tJunctions = tJunctionAdjustments([...wallById.values()])
  const openingsArea = new Map<string, number>()
  const rectanglesBySegment = new Map<string, { wallId: string; rectangles: Rectangle[] }>()
  for (const element of elements) {
    if (element.type !== 'opening') continue
    const wall = wallById.get(element.wallId)
    if (!wall) continue // ouverture orpheline : rien à mesurer
    // EDGE-01 (M18) : une ouverture hors de son mur n'est pas déduite (elle est signalée par ailleurs).
    const measure = openingMeasure(element, wall, isOpeningOutside(element, wall))
    openings.push(measure)
    if (measure.area > 0) {
      const key = `${wall.id} ${element.segmentIndex}`
      const list = rectanglesBySegment.get(key) ?? { wallId: wall.id, rectangles: [] }
      list.rectangles.push({ ...openingInterval(element), bottom: element.sillHeight, top: element.sillHeight + measure.area / element.width })
      rectanglesBySegment.set(key, list)
    }
  }
  // Deux ouvertures qui se chevauchent ne sont déduites qu'une fois : surface de leur union.
  for (const { wallId, rectangles } of rectanglesBySegment.values()) {
    openingsArea.set(wallId, (openingsArea.get(wallId) ?? 0) + unionArea(rectangles))
  }

  const roofElements = elements.filter((el): el is RoofElement => el.type === 'roof')

  for (const element of elements) {
    if (element.type === 'room') {
      const area = polygonArea(element.points)
      const roomVoids = voidsOfRoom(element, voids)
      const roomLevel = levels?.find((level) => level.id === element.levelId)
      const roomCeilingHeight = roomLevel ? ceilingHeight(roomLevel, levelAboveOf(levels, roomLevel.id)) : null
      const netArea = Math.max(0, area - roomVoids.area)
      rooms.push({
        id: element.id,
        name: element.name,
        area,
        perimeter: polygonPerimeter(element.points),
        voidArea: roomVoids.area,
        netArea,
        dimensions: axisAlignedRectangle(element.points),
        voidOverflow: roomVoids.overflowing.length > 0,
        ceilingHeight: roomCeilingHeight,
        falseCeiling: element.falseCeiling === true,
        habitableArea: habitableArea(element.points, netArea, roomLevel, roofElements, roomCeilingHeight),
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
    } else if (element.type === 'chimney') {
      chimneys.push(chimneyMeasure(element))
    } else if (element.type === 'roof') {
      roofs.push(roofMeasure(element))
    } else if (element.type === 'wall') {
      const length = polylineLength(element.points)
      const wallArea = length * element.height
      const deducted = openingsArea.get(element.id) ?? 0
      const faces = wallFaces(element.points, element.thickness)
      // Raccords en T : la part de ce mur qui entre dans un autre n'est ni du volume en plus ni une
      // face visible, et une face recouverte par un mur qui s'y raccorde n'est plus visible.
      const tJoin = tJunctions.get(element.id)
      const facesLength = Math.max(
        0,
        pathLength(faces.left) + pathLength(faces.right) - (tJoin ? tJoin.hiddenFaces + tJoin.coveredFace : 0),
      )
      const facesArea = facesLength * element.height
      walls.push({
        id: element.id,
        name: element.name,
        length,
        thickness: element.thickness,
        height: element.height,
        wallArea,
        openingsArea: deducted,
        netArea: Math.max(0, wallArea - deducted),
        facesLength,
        facesArea,
        // Une ouverture traverse le mur : elle est déduite sur chacune des deux faces.
        facesNetArea: Math.max(0, facesArea - 2 * deducted),
        volume: Math.max(
          0,
          length * element.thickness * element.height -
            deducted * element.thickness -
            (tJoin ? tJoin.overlapArea * element.height : 0),
        ),
      })
      const measure = walls[walls.length - 1]
      if (element.layers?.length) measure.layers = wallLayerMeasures(element.layers, measure)
    }
  }

  const count = (kind: OpeningElement['kind']) => openings.filter((o) => o.kind === kind).length

  return {
    rooms,
    walls,
    platforms,
    stairs,
    chimneys,
    roofs,
    openings,
    totals: {
      roofProjectedArea: roofs.reduce((sum, roof) => sum + roof.projectedArea, 0),
      roofRealArea: roofs.reduce((sum, roof) => sum + roof.realArea, 0),
      roofRidgeLength: roofs.reduce((sum, roof) => sum + roof.ridgeLength, 0),
      roofEaveLength: roofs.reduce((sum, roof) => sum + roof.eaveLength, 0),
      roofHipLength: roofs.reduce((sum, roof) => sum + roof.hipLength, 0),
      roofGables: roofs.reduce((sum, roof) => sum + roof.gableCount, 0),
      roomArea: rooms.reduce((sum, room) => sum + room.area, 0),
      voidArea: rooms.reduce((sum, room) => sum + room.voidArea, 0),
      roomNetArea: rooms.reduce((sum, room) => sum + room.netArea, 0),
      roomHabitableArea: rooms.reduce((sum, room) => sum + room.habitableArea, 0),
      platformArea: platforms.reduce((sum, platform) => sum + platform.area, 0),
      platformVolume: platforms.reduce((sum, platform) => sum + platform.volume, 0),
      wallLength: walls.reduce((sum, wall) => sum + wall.length, 0),
      wallArea: walls.reduce((sum, wall) => sum + wall.wallArea, 0),
      openingsArea: walls.reduce((sum, wall) => sum + wall.openingsArea, 0),
      wallNetArea: walls.reduce((sum, wall) => sum + wall.netArea, 0),
      wallFacesArea: walls.reduce((sum, wall) => sum + wall.facesArea, 0),
      wallFacesNetArea: walls.reduce((sum, wall) => sum + wall.facesNetArea, 0),
      wallVolume: walls.reduce((sum, wall) => sum + wall.volume, 0),
      chimneys: chimneys.length,
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
  /** Repères M01, P01, F01… (calculés sur le document, partagés avec les cotes). */
  refs: References
}

/** Réunit plusieurs métrés en un seul : listes mises bout à bout, totaux additionnés. */
export function sumMeasurements(list: readonly Measurements[]): Measurements {
  const sum = (pick: (m: Measurements) => number) => list.reduce((acc, m) => acc + pick(m), 0)
  return {
    rooms: list.flatMap((m) => m.rooms),
    walls: list.flatMap((m) => m.walls),
    platforms: list.flatMap((m) => m.platforms),
    stairs: list.flatMap((m) => m.stairs),
    chimneys: list.flatMap((m) => m.chimneys),
    roofs: list.flatMap((m) => m.roofs),
    openings: list.flatMap((m) => m.openings),
    totals: {
      roofProjectedArea: sum((m) => m.totals.roofProjectedArea),
      roofRealArea: sum((m) => m.totals.roofRealArea),
      roofRidgeLength: sum((m) => m.totals.roofRidgeLength),
      roofEaveLength: sum((m) => m.totals.roofEaveLength),
      roofHipLength: sum((m) => m.totals.roofHipLength),
      roofGables: sum((m) => m.totals.roofGables),
      roomArea: sum((m) => m.totals.roomArea),
      voidArea: sum((m) => m.totals.voidArea),
      roomNetArea: sum((m) => m.totals.roomNetArea),
      roomHabitableArea: sum((m) => m.totals.roomHabitableArea),
      platformArea: sum((m) => m.totals.platformArea),
      platformVolume: sum((m) => m.totals.platformVolume),
      wallLength: sum((m) => m.totals.wallLength),
      wallArea: sum((m) => m.totals.wallArea),
      openingsArea: sum((m) => m.totals.openingsArea),
      wallNetArea: sum((m) => m.totals.wallNetArea),
      wallFacesArea: sum((m) => m.totals.wallFacesArea),
      wallFacesNetArea: sum((m) => m.totals.wallFacesNetArea),
      wallVolume: sum((m) => m.totals.wallVolume),
      chimneys: sum((m) => m.totals.chimneys),
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
/** Toitures et escaliers de Pascal d'un niveau ajoutés à ses métrés (listes et totaux, M19 B6). */
function withPascalQuantities(measurements: Measurements, quantities: PascalQuantities | undefined, levelId: string): Measurements {
  const roofs = quantities?.roofs.filter((roof) => roof.levelId === levelId) ?? []
  const stairs = quantities?.stairs.filter((stair) => stair.levelId === levelId) ?? []
  if (roofs.length === 0 && stairs.length === 0) return measurements
  const roofMeasures: RoofMeasure[] = roofs.map((roof) => ({
    id: roof.id,
    name: roof.name,
    shape: roof.kind,
    pitch: roof.pitch,
    overhang: roof.overhang,
    projectedArea: roof.projectedArea,
    realArea: roof.realArea,
    ridgeLength: roof.ridgeLength,
    eaveLength: roof.eaveLength,
    hipLength: roof.hipLength,
    gableCount: roof.gableCount,
    problem: roof.trimmed ? 'trimmed' : roof.toCheck ? 'overlapCheck' : null,
  }))
  const stairMeasures: StairMeasure[] = stairs.map((stair) => ({
    id: stair.id,
    name: stair.name,
    shape: stair.shape,
    width: stair.width,
    rise: stair.rise,
    risers: stair.risers,
    treads: stair.treads,
    riserHeight: stair.riserHeight,
    treadDepth: stair.treadDepth,
    status: 'ok',
    requiredRun: null,
  }))
  const add = (key: keyof Pick<RoofMeasure, 'projectedArea' | 'realArea' | 'ridgeLength' | 'eaveLength' | 'hipLength' | 'gableCount'>) =>
    roofMeasures.reduce((sum, roof) => sum + roof[key], 0)
  const t = measurements.totals
  return {
    ...measurements,
    roofs: [...measurements.roofs, ...roofMeasures],
    stairs: [...measurements.stairs, ...stairMeasures],
    totals: {
      ...t,
      roofProjectedArea: t.roofProjectedArea + add('projectedArea'),
      roofRealArea: t.roofRealArea + add('realArea'),
      roofRidgeLength: t.roofRidgeLength + add('ridgeLength'),
      roofEaveLength: t.roofEaveLength + add('eaveLength'),
      roofHipLength: t.roofHipLength + add('hipLength'),
      roofGables: t.roofGables + add('gableCount'),
    },
  }
}

export function computeBuildingMeasurements(
  document: Pick<FabricsDocument, 'elements' | 'levels' | 'pascalQuantities'>,
): BuildingMeasurements {
  const voids = collectStairVoids(document.elements, document.levels)
  // Murs et ouvertures sous leur nom affiché (automatique ou tapé) : les mêmes que dans les calques.
  const elements = withDisplayNames(document.elements)
  const levels = (document.levels ?? []).map((level) => ({
    level,
    measurements: withPascalQuantities(
      computeMeasurements(elementsOfLevel(elements, level.id), document.levels, voids.filter((v) => v.levelId === level.id)),
      document.pascalQuantities,
      level.id,
    ),
  }))
  return { levels, total: sumMeasurements(levels.map((l) => l.measurements)), refs: buildReferences(document) }
}

/** Le même bâtiment réduit à un seul niveau (ses métrés et ses totaux) ; inchangé si le niveau n'existe pas. */
export function restrictToLevel(building: BuildingMeasurements, levelId: string): BuildingMeasurements | null {
  const kept = building.levels.filter((entry) => entry.level.id === levelId)
  // Niveau introuvable : pas de repli silencieux sur tout le bâtiment, l'appelant le signale.
  if (kept.length === 0) return null
  return { ...building, levels: kept, total: sumMeasurements(kept.map((entry) => entry.measurements)) }
}
