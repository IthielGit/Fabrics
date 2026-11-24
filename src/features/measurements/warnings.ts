import type { CanvasElement, FabricsDocument, OpeningElement, RoomElement, WallElement } from '../../types/document'
import { elementsOfLevel, isLevelIndependent } from '../documents/levels'
import { overlappingRoomIds } from '../geometry/roomOverlap'
import { isOpeningOutside, openingInterval, OPENING_TOLERANCE } from '../geometry/openings'
import { wallIssues, type WallFix } from '../geometry/wallContacts'
import type { Point } from '../geometry/viewport'
import { computeBuildingMeasurements, type BuildingMeasurements } from './measurements'
import { qualityChecks, type QualityWarning } from './qualityChecks'
import { createCoverageChecker } from './roomCoverage'
import { withDisplayNames } from '../naming/autoNames'

/** Éléments mesurés dans les métrés : sans niveau, ils n'y apparaissent pas. */
const MEASURED_TYPES: readonly CanvasElement['type'][] = ['room', 'wall', 'opening', 'platform', 'stair', 'chimney', 'roof']

/**
 * Point à vérifier avant d'exporter les métrés (rien n'est bloqué ni corrigé). Les textes sont
 * composés par l'interface (`fr.ts`) ; ici, seulement les faits.
 */
export type MetresWarning =
  | { kind: 'roomOverlap'; levelId: string; roomIds: string[]; roomNames: string[] }
  | { kind: 'voidOverflow'; levelId: string; roomId: string; roomName: string }
  | { kind: 'hiddenRoom'; levelId: string; roomId: string; roomName: string }
  | {
      kind: 'coverageGap' | 'coverageOverflow'
      levelId: string
      roomId: string
      roomName: string
      /** mm² */
      area: number
      /** Repère du mur le plus proche (`M04`), ou `null`. */
      wallRef: string | null
      /** Zone à surligner sur le plan : contour puis trous. */
      rings: Point[][]
    }
  | { kind: 'noLevel'; elementId: string; elementName: string; elementType: CanvasElement['type'] }
  | { kind: 'openingOutside'; levelId: string; openingId: string; openingRef: string; wallRef: string }
  | { kind: 'wallZeroHeight'; levelId: string; wallId: string; wallRef: string }
  // M19 B5 : mur sans épaisseur (ou épaisseur invalide) et mur réduit à un point.
  | { kind: 'wallInvalidThickness'; levelId: string; wallId: string; wallRef: string }
  | { kind: 'wallZeroLength'; levelId: string; wallId: string; wallRef: string }
  | { kind: 'openingOverlap'; levelId: string; openingIds: [string, string]; openingRefs: [string, string] }
  | {
      kind: 'wallGap'
      levelId: string
      wallId: string
      wallRef: string
      otherWallRef: string
      /** mm */
      gap: number
      /** Correction proposée : joindre le bout du mur à l'autre mur. */
      fix: WallFix
    }
  | {
      kind: 'wallOverlap'
      levelId: string
      wallIds: [string, string]
      wallRefs: [string, string]
      /** mm */
      length: number
      /** Correction proposée, ou `null` quand le choix revient à l'utilisateur. */
      fix: WallFix | null
    }
  // M21 21.7 : contrôles qualité (géométrie incohérente, propriétés manquantes, unités douteuses).
  | QualityWarning

/** Nom affiché d'une pièce (le nom vide reste reconnaissable). */
const roomLabel = (room: RoomElement, index: number) => room.name.trim() || `#${index + 1}`

/** Un mur plus court que 1 mm est un point : il ne compte rien et fausse les raccords. */
const MIN_WALL_LENGTH = 1

function wallAxisLength(points: readonly number[]): number {
  let total = 0
  for (let i = 0; i + 3 < points.length; i += 2) total += Math.hypot(points[i + 2] - points[i], points[i + 3] - points[i + 1])
  return total
}

function openingChecks(
  levelId: string,
  elements: readonly CanvasElement[],
  building: BuildingMeasurements,
): MetresWarning[] {
  const warnings: MetresWarning[] = []
  const walls = new Map(
    elements.filter((el): el is WallElement => el.type === 'wall').map((wall) => [wall.id, wall]),
  )
  const openings = elements.filter((el): el is OpeningElement => el.type === 'opening' && walls.has(el.wallId))
  const ref = (id: string, fallback: string) =>
    building.refs.openings.get(id) ?? building.refs.walls.get(id) ?? fallback

  for (const opening of openings) {
    const wall = walls.get(opening.wallId) as WallElement
    if (isOpeningOutside(opening, wall)) {
      warnings.push({
        kind: 'openingOutside',
        levelId,
        openingId: opening.id,
        openingRef: ref(opening.id, opening.name),
        wallRef: ref(wall.id, wall.name),
      })
    }
  }
  for (const wall of walls.values()) {
    if (wall.height <= 0) {
      warnings.push({ kind: 'wallZeroHeight', levelId, wallId: wall.id, wallRef: ref(wall.id, wall.name) })
    }
    if (!(Number.isFinite(wall.thickness) && wall.thickness > 0)) {
      warnings.push({ kind: 'wallInvalidThickness', levelId, wallId: wall.id, wallRef: ref(wall.id, wall.name) })
    }
    if (wallAxisLength(wall.points) < MIN_WALL_LENGTH) {
      warnings.push({ kind: 'wallZeroLength', levelId, wallId: wall.id, wallRef: ref(wall.id, wall.name) })
    }
  }
  for (let i = 0; i < openings.length; i++) {
    for (let j = i + 1; j < openings.length; j++) {
      const a = openings[i]
      const b = openings[j]
      if (a.wallId !== b.wallId || a.segmentIndex !== b.segmentIndex) continue
      const p = openingInterval(a)
      const q = openingInterval(b)
      if (Math.min(p.to, q.to) - Math.max(p.from, q.from) > OPENING_TOLERANCE) {
        warnings.push({
          kind: 'openingOverlap',
          levelId,
          openingIds: [a.id, b.id],
          openingRefs: [ref(a.id, a.name), ref(b.id, b.name)],
        })
      }
    }
  }
  return warnings
}

/** Écarts entre murs et murs superposés d'un niveau, avec leur correction (voir `wallIssues`). */
function wallChecks(
  levelId: string,
  elements: readonly CanvasElement[],
  building: BuildingMeasurements,
): MetresWarning[] {
  const walls = elements.filter((el): el is WallElement => el.type === 'wall')
  const ref = (wall: WallElement | undefined) => (wall && (building.refs.walls.get(wall.id) ?? wall.name)) || ''
  const byId = new Map(walls.map((wall) => [wall.id, wall]))
  return wallIssues(walls).map((issue): MetresWarning => {
    if (issue.kind === 'wallGap') {
      return {
        kind: 'wallGap',
        levelId,
        wallId: issue.wallId,
        wallRef: ref(byId.get(issue.wallId)),
        otherWallRef: ref(byId.get(issue.otherWallId)),
        gap: issue.gap,
        fix: issue.fix,
      }
    }
    return {
      kind: 'wallOverlap',
      levelId,
      wallIds: issue.wallIds,
      wallRefs: [ref(byId.get(issue.wallIds[0])), ref(byId.get(issue.wallIds[1]))],
      length: issue.length,
      fix: issue.fix,
    }
  })
}

/**
 * Contrôle avant export des métrés : pièces superposées, trémies qui débordent, pièces masquées
 * (comptées, D21), pièces qui ne remplissent pas l'espace entre leurs murs ou qui en débordent,
 * éléments sans niveau (absents des métrés), ouvertures hors de leur segment ou qui se chevauchent.
 * Avec `levelId`, seulement ce niveau (les éléments sans niveau sont toujours signalés).
 */
export function metresWarnings(
  document: Pick<FabricsDocument, 'elements' | 'levels'>,
  building: BuildingMeasurements,
  levelId?: string | null,
): MetresWarning[] {
  const warnings: MetresWarning[] = []
  for (const { level, measurements } of building.levels) {
    if (levelId && level.id !== levelId) continue
    const elements = elementsOfLevel(document.elements, level.id)
    const rooms = elements.filter((el): el is RoomElement => el.type === 'room')
    const names = new Map(rooms.map((room, i) => [room.id, roomLabel(room, i)]))

    const overlap = overlappingRoomIds(rooms)
    if (overlap.size > 0) {
      const ids = rooms.filter((room) => overlap.has(room.id)).map((room) => room.id)
      warnings.push({ kind: 'roomOverlap', levelId: level.id, roomIds: ids, roomNames: ids.map((id) => names.get(id) ?? '') })
    }
    for (const measure of measurements.rooms) {
      if (measure.voidOverflow) {
        warnings.push({ kind: 'voidOverflow', levelId: level.id, roomId: measure.id, roomName: names.get(measure.id) ?? measure.name })
      }
    }
    for (const room of rooms) {
      if (room.hidden) {
        warnings.push({ kind: 'hiddenRoom', levelId: level.id, roomId: room.id, roomName: names.get(room.id) ?? room.name })
      }
    }
    const checker = createCoverageChecker(elements.filter((el): el is WallElement => el.type === 'wall'))
    for (const room of rooms) {
      for (const piece of checker.check(room, rooms)) {
        warnings.push({
          kind: piece.kind === 'gap' ? 'coverageGap' : 'coverageOverflow',
          levelId: level.id,
          roomId: room.id,
          roomName: names.get(room.id) ?? room.name,
          area: piece.area,
          wallRef: piece.wallId ? (building.refs.walls.get(piece.wallId) ?? null) : null,
          rings: piece.rings,
        })
      }
    }
    warnings.push(...openingChecks(level.id, elements, building))
    warnings.push(...wallChecks(level.id, elements, building))
    warnings.push(...qualityChecks(level, elements, measurements, building))
  }

  // Sans niveau, un élément mesurable n'est compté nulle part (les axes et les coupes n'ont jamais de niveau).
  if ((document.levels ?? []).length > 0) {
    for (const element of withDisplayNames(document.elements)) {
      if (element.levelId !== undefined || isLevelIndependent(element) || !MEASURED_TYPES.includes(element.type)) continue
      warnings.push({ kind: 'noLevel', elementId: element.id, elementName: element.name, elementType: element.type })
    }
  }
  return warnings
}

/**
 * Manque ou débord d'une pièce : **bloque l'export des métrés** (décision de l'utilisateur, D55) ;
 * l'utilisateur doit corriger le tracé avant d'exporter.
 */
export function isBlockingWarning(warning: MetresWarning): boolean {
  return warning.kind === 'coverageGap' || warning.kind === 'coverageOverflow'
}

/**
 * Manques et débords qui bloquent tout export d'un plan (métrés, image, PDF du plan, PDF des vues),
 * pour un niveau ou, sans `levelId`, pour tout le bâtiment (D55).
 */
export function blockingSurfaceWarnings(
  document: Pick<FabricsDocument, 'elements' | 'levels'>,
  levelId?: string | null,
): MetresWarning[] {
  return metresWarnings(document, computeBuildingMeasurements(document), levelId).filter(isBlockingWarning)
}

/** Avertissements qui touchent directement les surfaces affichées au client (panneau Métrés). */
export function isSurfaceWarning(warning: MetresWarning): boolean {
  return (
    warning.kind === 'roomOverlap' ||
    warning.kind === 'voidOverflow' ||
    warning.kind === 'coverageGap' ||
    warning.kind === 'coverageOverflow' ||
    warning.kind === 'wallGap' ||
    warning.kind === 'wallOverlap'
  )
}
