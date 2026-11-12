import { withDisplayNames } from '../naming/autoNames'
import type {
  CanvasElement,
  ChimneyElement,
  FabricsDocument,
  Level,
  OpeningElement,
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
import { wallFaces } from '../geometry/walls'
import { buildReferences, type References } from './references'
import { levelAboveOf, stairStatus } from '../stairs/stairs'
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
  /** Largeur × profondeur (mm) d'une pièce rectangulaire aux côtés horizontaux et verticaux ; sinon `null`. */
  dimensions: [number, number] | null
  /** Vrai si une trémie déborde de la pièce (dalle laissée pleine, aucune surface retirée). */
  voidOverflow: boolean
  /** Hauteur sous plafond (mm), voir `ceilingHeight` ; `null` si la pièce n'a pas de niveau connu. */
  ceilingHeight: number | null
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
  shape: RoofShape
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
  problem: RoofProblem | null
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
  /** Longueur des deux faces, mesurées sur les faces (onglets compris), en mm. */
  facesLength: number
  /** Surface brute des deux faces : longueur des faces × hauteur, en mm². */
  facesArea: number
  /** Surface nette des deux faces : brute moins les ouvertures, comptées sur chaque face, en mm². */
  facesNetArea: number
  /** Volume du mur sur l'axe, ouvertures déduites : longueur × épaisseur × hauteur, en mm³. */
  volume: number
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
function openingMeasure(opening: OpeningElement, wall: WallElement): OpeningMeasure {
  const visibleHeight = Math.max(0, Math.min(opening.height, wall.height - opening.sillHeight))
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
      const roomLevel = levels?.find((level) => level.id === element.levelId)
      rooms.push({
        id: element.id,
        name: element.name,
        area,
        perimeter: polygonPerimeter(element.points),
        voidArea: roomVoids.area,
        netArea: Math.max(0, area - roomVoids.area),
        dimensions: axisAlignedRectangle(element.points),
        voidOverflow: roomVoids.overflowing.length > 0,
        ceilingHeight: roomLevel ? ceilingHeight(roomLevel, levelAboveOf(levels, roomLevel.id)) : null,
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
      const facesLength = pathLength(faces.left) + pathLength(faces.right)
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
        volume: Math.max(0, length * element.thickness * element.height - deducted * element.thickness),
      })
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
export function computeBuildingMeasurements(
  document: Pick<FabricsDocument, 'elements' | 'levels'>,
): BuildingMeasurements {
  const voids = collectStairVoids(document.elements, document.levels)
  // Murs et ouvertures sous leur nom affiché (automatique ou tapé) : les mêmes que dans les calques.
  const elements = withDisplayNames(document.elements)
  const levels = (document.levels ?? []).map((level) => ({
    level,
    measurements: computeMeasurements(
      elementsOfLevel(elements, level.id),
      document.levels,
      voids.filter((v) => v.levelId === level.id),
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
