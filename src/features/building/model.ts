import type {
  CanvasElement,
  FabricsDocument,
  Level,
  OpeningElement,
  PlatformElement,
  RoofElement,
  RoomElement,
  WallElement,
} from '../../types/document'
import { buildRoofParts } from './roofModel'
import { toPoints } from '../geometry/polygon'
import type { Point } from '../geometry/viewport'
import type {
  BuildOptions,
  BuildingModel,
  Bounds3,
  OpeningFill,
  OpeningMark,
  RoofPrism,
  SlabShape,
  WallMesh,
  WallPiece,
} from './types'
import { buildChimney } from './chimney'
import { buildFurniture } from './furniture'
import { collectStairVoids, pointInPolygon, voidsOfRoom, type StairVoid } from '../stairs/voids'
import { buildStairSteps } from './stairSteps'
import { buildOpeningDetails } from './openingFills'
import { buildWallMesh } from './wallMesh'
import { buildWallPieces } from './wallPieces'

/** Niveaux à afficher : tous, ou jusqu'à `upToLevelId` compris (triés par altitude). */
export function visibleLevels(levels: readonly Level[], upToLevelId?: string): Level[] {
  const sorted = [...levels].sort((a, b) => a.elevation - b.elevation)
  if (upToLevelId === undefined) return sorted
  const index = sorted.findIndex((l) => l.id === upToLevelId)
  return index < 0 ? sorted : sorted.slice(0, index + 1)
}

/** Dalle sous une pièce : dessus au niveau du sol, épaisseur du niveau vers le bas. */
export function buildRoomSlab(
  room: RoomElement,
  level: Level,
  voids: readonly StairVoid[] = [],
): SlabShape | null {
  const outline = toPoints(room.points)
  if (outline.length < 3 || level.slabThickness < 1) return null
  // Les trémies des escaliers qui arrivent sur ce niveau trouent la dalle (forme avec trous, pas de
  // calcul booléen). Une trémie qui déborde de la pièce la laisse pleine (voir `voidsOfRoom`).
  const holes = voidsOfRoom(room, voids).holes.map((hole) => hole.polygon)
  return {
    sourceId: room.id,
    levelId: level.id,
    kind: 'slab',
    outline,
    baseY: level.elevation - level.slabThickness,
    thickness: level.slabThickness,
    ...(holes.length > 0 ? { holes } : {}),
  }
}

/**
 * Toit plat au-dessus d'une pièce sans pièce au-dessus. Il est pris entre les murs : son dessus
 * est au niveau du haut des murs (altitude + hauteur d'étage), comme un toit plat avec acrotère.
 */
export function buildRoomRoof(room: RoomElement, level: Level): SlabShape | null {
  const outline = toPoints(room.points)
  if (outline.length < 3 || level.slabThickness < 1) return null
  const thickness = Math.min(level.slabThickness, level.height)
  return {
    sourceId: room.id,
    levelId: level.id,
    kind: 'roof',
    outline,
    baseY: level.elevation + level.height - thickness,
    thickness,
  }
}

/** Centre de la boîte d'un contour. */
function boxCenter(points: readonly Point[]): Point {
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  return { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 }
}

/** Plateforme : dessus à `elevation` au-dessus du plancher du niveau, volume de `thickness` sous le dessus. */
export function buildPlatform(platform: PlatformElement, level: Level): SlabShape | null {
  const outline = toPoints(platform.points)
  const top = level.elevation + platform.elevation
  // L'épaisseur ne dépasse jamais la hauteur du dessus : la plateforme ne passe pas sous le plancher.
  const thickness = Math.min(platform.thickness, platform.elevation)
  if (outline.length < 3 || thickness < 1) return null
  return {
    sourceId: platform.id,
    levelId: level.id,
    kind: 'platform',
    outline,
    baseY: top - thickness,
    thickness,
  }
}

function extendPlanBounds(points: readonly Point[], y0: number, y1: number, into: Bounds3 | null): Bounds3 {
  const bounds: Bounds3 = into ?? {
    min: { x: Infinity, y: Infinity, z: Infinity },
    max: { x: -Infinity, y: -Infinity, z: -Infinity },
  }
  for (const p of points) {
    bounds.min.x = Math.min(bounds.min.x, p.x)
    bounds.max.x = Math.max(bounds.max.x, p.x)
    bounds.min.z = Math.min(bounds.min.z, p.y)
    bounds.max.z = Math.max(bounds.max.z, p.y)
  }
  bounds.min.y = Math.min(bounds.min.y, y0)
  bounds.max.y = Math.max(bounds.max.y, y1)
  return bounds
}

/** Emprise d'un ensemble de morceaux de mur et de dalles. */
/** Agrandit l'emprise des sommets des toitures en pente (faîtage compris). */
function extendWithPrisms(bounds: Bounds3 | null, prisms: readonly RoofPrism[]): Bounds3 | null {
  let result = bounds
  for (const prism of prisms) {
    for (const p of prism.polygon) {
      const back = { x: p.x + prism.extrude.x, y: p.y + prism.extrude.y, z: p.z + prism.extrude.z }
      for (const q of [p, back]) {
        result = result
          ? {
              min: { x: Math.min(result.min.x, q.x), y: Math.min(result.min.y, q.y), z: Math.min(result.min.z, q.z) },
              max: { x: Math.max(result.max.x, q.x), y: Math.max(result.max.y, q.y), z: Math.max(result.max.z, q.z) },
            }
          : { min: { ...q }, max: { ...q } }
      }
    }
  }
  return result
}

export function modelBounds(walls: readonly WallPiece[], slabs: readonly SlabShape[]): Bounds3 | null {
  let bounds: Bounds3 | null = null
  for (const w of walls) {
    const c = Math.cos(w.rotationY)
    const s = Math.sin(w.rotationY)
    const hx = w.size.x / 2
    const hz = w.size.z / 2
    // Coins dans le plan : rotation autour de y d'un angle φ → (x, z) = (c·u + s·v, −s·u + c·v).
    const corners: Point[] = [
      [-hx, -hz],
      [hx, -hz],
      [hx, hz],
      [-hx, hz],
    ].map(([u, v]) => ({ x: w.center.x + c * u + s * v, y: w.center.z - s * u + c * v }))
    bounds = extendPlanBounds(corners, w.center.y - w.size.y / 2, w.center.y + w.size.y / 2, bounds)
  }
  for (const slab of slabs) {
    bounds = extendPlanBounds(slab.outline, slab.baseY, slab.baseY + slab.thickness, bounds)
  }
  return bounds
}

/**
 * Traduit le document en modèle 3D : murs découpés par leurs ouvertures (avec cadres, vitres et
 * portes), dalle sous chaque pièce, toit plat sur chaque pièce sans pièce d'un niveau supérieur
 * au-dessus d'elle (un rez plus large que l'étage reçoit aussi son toit), toitures dessinées
 * (versants, pignons, toit plat ; elles remplacent le toit plat automatique des pièces qu'elles
 * couvrent, D45). Toits et toitures seulement quand le dernier niveau est affiché. Un document sans
 * niveaux (Visuel) donne un modèle vide.
 */
export function buildBuildingModel(
  doc: Pick<FabricsDocument, 'elements' | 'levels'> & Partial<Pick<FabricsDocument, 'plan'>>,
  options: BuildOptions = {},
): BuildingModel {
  const allLevels = doc.levels ?? []
  const levels = visibleLevels(allLevels, options.upToLevelId)
  if (levels.length === 0) {
    return {
      walls: [],
      wallMeshes: [],
      steps: [],
      chimneys: [],
      furniture: [],
      slabs: [],
      fills: [],
      marks: [],
      roofs: [],
      bounds: null,
    }
  }

  const sortedAll = [...allLevels].sort((a, b) => a.elevation - b.elevation)
  const topLevel = sortedAll[sortedAll.length - 1]
  const showRoof = levels[levels.length - 1].id === topLevel.id
  const levelRank = new Map(sortedAll.map((l, i) => [l.id, i]))

  const byId = new Map(levels.map((l) => [l.id, l]))
  const firstLevel = sortedAll[0]
  const levelOf = (el: CanvasElement): Level | undefined =>
    byId.get(el.levelId ?? firstLevel.id)

  const openings = doc.elements.filter(
    (el): el is OpeningElement => el.type === 'opening' && !el.hidden,
  )
  // Ouvertures rangées par mur porteur : chaque mur ne parcourt que les siennes.
  const openingsByWall = new Map<string, OpeningElement[]>()
  for (const o of openings) {
    const list = openingsByWall.get(o.wallId)
    if (list) list.push(o)
    else openingsByWall.set(o.wallId, [o])
  }
  const stairVoids = collectStairVoids(doc.elements, allLevels)
  const walls: WallPiece[] = []
  const wallMeshes: WallMesh[] = []
  const steps: WallPiece[] = []
  const chimneys: WallPiece[] = []
  const furniture: WallPiece[] = []
  const slabs: SlabShape[] = []
  const fills: OpeningFill[] = []
  const marks: OpeningMark[] = []
  const roofs: RoofPrism[] = []
  const rooms = doc.elements.filter((el): el is RoomElement => el.type === 'room' && !el.hidden)
  // Toitures dessinées (visibles) et murs de chaque niveau, pour l'épaisseur des pignons.
  const roofElements = doc.elements.filter((el): el is RoofElement => el.type === 'roof' && !el.hidden)
  const wallsOfLevel = (levelId: string) =>
    doc.elements.filter(
      (el): el is WallElement =>
        el.type === 'wall' && !el.hidden && (el.levelId ?? firstLevel.id) === levelId,
    )
  // Une pièce sous une toiture dessinée de son niveau n'a pas de toit plat automatique (D45).
  const coveredByRoof = (room: RoomElement, level: Level): boolean => {
    const center = boxCenter(toPoints(room.points))
    return roofElements.some(
      (roof) =>
        (roof.levelId ?? firstLevel.id) === level.id && pointInPolygon(center, toPoints(roof.points)),
    )
  }
  // Une pièce est couverte si le centre de son contour tombe dans une pièce d'un niveau supérieur.
  const coveredByUpperRoom = (room: RoomElement, level: Level): boolean => {
    const rank = levelRank.get(level.id) ?? 0
    const center = boxCenter(toPoints(room.points))
    return rooms.some((other) => {
      const otherRank = levelRank.get(other.levelId ?? firstLevel.id) ?? 0
      return otherRank > rank && pointInPolygon(center, toPoints(other.points))
    })
  }

  for (const el of doc.elements) {
    if (el.hidden) continue
    const level = levelOf(el)
    if (!level) continue
    if (el.type === 'wall') {
      const own = openingsByWall.get(el.id) ?? []
      walls.push(...buildWallPieces(el as WallElement, own, level))
      const details = buildOpeningDetails(el as WallElement, own, level)
      fills.push(...details.fills)
      marks.push(...details.marks)
      const mesh = buildWallMesh(el as WallElement, own, level)
      if (mesh) wallMeshes.push((el as WallElement).material ? { ...mesh, material: (el as WallElement).material } : mesh)
    } else if (el.type === 'chimney') {
      const piece = buildChimney(el, level, levels)
      if (piece) chimneys.push(piece)
    } else if (el.type === 'furniture') {
      const box = buildFurniture(el, level)
      if (box) furniture.push(box)
    } else if (el.type === 'stair') {
      steps.push(...buildStairSteps(el, level, allLevels))
    } else if (el.type === 'platform') {
      const shape = buildPlatform(el, level)
      if (shape) slabs.push(shape)
    } else if (el.type === 'room') {
      const slab = buildRoomSlab(
        el,
        level,
        stairVoids.filter((v) => v.levelId === level.id),
      )
      if (slab) slabs.push(level.id === firstLevel.id ? { ...slab, onGround: true } : slab)
      if (showRoof && !coveredByUpperRoom(el, level) && !coveredByRoof(el, level)) {
        const roof = buildRoomRoof(el, level)
        if (roof) slabs.push(roof)
      }
    } else if (el.type === 'roof' && showRoof) {
      const parts = buildRoofParts(el, level, wallsOfLevel(level.id), doc.plan?.defaultWallThickness ?? 200)
      roofs.push(...parts.prisms)
      slabs.push(...parts.slabs)
    }
  }
  return {
    walls,
    wallMeshes,
    steps,
    chimneys,
    furniture,
    slabs,
    fills,
    marks,
    roofs,
    bounds: extendWithPrisms(modelBounds([...walls, ...steps, ...chimneys], slabs), roofs),
  }
}
