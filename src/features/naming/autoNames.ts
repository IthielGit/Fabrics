import type { CanvasElement, OpeningElement, RoomElement, WallElement } from '../../types/document'
import { fr } from '../../i18n/fr'
import { wallSegment, wallSegmentCount } from '../geometry/openings'
import { polygonArea, polygonCentroid, toPoints } from '../geometry/polygon'
import type { Point } from '../geometry/viewport'
import { openingCentre, readingOrder, wallCentre } from '../measurements/references'
import { pointInPolygon } from '../stairs/voids'

/**
 * Noms automatiques des murs et des ouvertures (hors jalon, D58). Le nom est tiré des pièces que
 * l'élément touche ; il est **calculé à l'affichage**, jamais enregistré, et suit donc les
 * renommages de pièces, les déplacements et le sens d'ouverture. Un nom tapé à la main reste
 * prioritaire ; un nom vide ou un ancien nom par défaut (« Mur 1 », « Porte 2 », « Mur 1 1 »…) est
 * remplacé par le nom automatique. Fonctions pures.
 *
 * Murs : « Mur Cuisine / Séjour » (pièces des deux côtés), « Mur extérieur Cuisine » (pièces d'un
 * seul côté), « Mur isolé » (aucune pièce). Au-delà de deux pièces : les deux plus grandes, dans
 * l'ordre de lecture, puis « +N ». Deux murs du même niveau au même nom sont numérotés.
 * Ouvertures : « Porte Cuisine 1 », « Fenêtre Séjour 2 », « Baie Séjour 3 » (les baies comptent
 * avec les fenêtres), numérotées par pièce dans l'ordre de lecture ; « Porte 1 » sans pièce.
 * Les pièces masquées comptent (comme pour les surfaces, D56).
 */
export interface AutoNameLabels {
  wall: string
  door: string
  window: string
  bay: string
  exteriorWall: string
  isolatedWall: string
  unnamedRoom: string
}

export const DEFAULT_AUTO_NAME_LABELS: AutoNameLabels = {
  wall: fr.elements.wall,
  door: fr.elements.door,
  window: fr.elements.window,
  bay: fr.elements.bay,
  exteriorWall: fr.naming.exteriorWall,
  isolatedWall: fr.naming.isolatedWall,
  unnamedRoom: fr.elements.room,
}

/** Distance (mm) au-delà de la face du mur où l'on cherche la pièce. */
const PROBE_BEYOND_FACE = 100
/** Écart (mm) entre deux points de recherche le long d'un côté de mur (au moins trois points). */
const PROBE_STEP = 250

type Named = WallElement | OpeningElement

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Vrai si le nom doit être remplacé par le nom automatique : vide, ou ancien nom par défaut. */
export function isAutoName(name: string, labels: AutoNameLabels = DEFAULT_AUTO_NAME_LABELS): boolean {
  const trimmed = name.trim()
  if (trimmed === '') return true
  const prefixes = [labels.wall, labels.door, labels.window, labels.bay].map(escapeRegExp).join('|')
  return new RegExp(`^(${prefixes})( \\d+)*$`).test(trimmed)
}

/** Numéro collé au nom ; un tiret le sépare d'un nom qui finit déjà par un chiffre (« Chambre 1 – 1 »). */
const numbered = (base: string, n: number) => `${base}${/\d$/.test(base) ? ' – ' : ' '}${n}`

interface RoomInfo {
  room: RoomElement
  polygon: Point[]
  label: string
  area: number
  /** Rang dans l'ordre de lecture du niveau. */
  rank: number
}

/** Pièces d'un niveau : nom affiché (« Pièce 1 » pour un nom vide), surface, ordre de lecture. */
function roomInfos(rooms: readonly RoomElement[], labels: AutoNameLabels): RoomInfo[] {
  let unnamed = 0
  const infos = rooms.map((room) => ({
    room,
    polygon: toPoints(room.points),
    label: room.name.trim() === '' ? `${labels.unnamedRoom} ${++unnamed}` : room.name.trim(),
    area: Math.abs(polygonArea(room.points)),
    rank: 0,
  }))
  const placed = infos.map((info) => {
    const centre = polygonCentroid(info.room.points) ?? info.polygon[0] ?? { x: 0, y: 0 }
    return { item: { id: info.room.id, info }, x: centre.x, y: centre.y }
  })
  readingOrder(placed).forEach((entry, rank) => {
    entry.info.rank = rank
  })
  return infos
}

/** La plus petite pièce qui contient le point (la plus précise quand des pièces se chevauchent). */
function roomAt(point: Point, rooms: readonly RoomInfo[]): RoomInfo | null {
  let best: RoomInfo | null = null
  for (const info of rooms) {
    if (info.polygon.length < 3 || !pointInPolygon(point, info.polygon)) continue
    if (!best || info.area < best.area) best = info
  }
  return best
}

/** Pièces de chaque côté d'un mur (gauche = côté de la normale de `wallSegment`). */
function wallSides(wall: WallElement, rooms: readonly RoomInfo[]): { left: Set<RoomInfo>; right: Set<RoomInfo> } {
  const left = new Set<RoomInfo>()
  const right = new Set<RoomInfo>()
  const reach = wall.thickness / 2 + PROBE_BEYOND_FACE
  for (let index = 0; index < wallSegmentCount(wall); index += 1) {
    const segment = wallSegment(wall, index)
    if (!segment) continue
    const count = Math.max(3, Math.ceil(segment.length / PROBE_STEP))
    for (let k = 0; k < count; k += 1) {
      const t = (k + 0.5) / count
      const at = { x: segment.a.x + (segment.b.x - segment.a.x) * t, y: segment.a.y + (segment.b.y - segment.a.y) * t }
      const l = roomAt({ x: at.x + segment.normal.x * reach, y: at.y + segment.normal.y * reach }, rooms)
      const r = roomAt({ x: at.x - segment.normal.x * reach, y: at.y - segment.normal.y * reach }, rooms)
      if (l) left.add(l)
      if (r) right.add(r)
    }
  }
  return { left, right }
}

/** Les deux plus grandes pièces dans l'ordre de lecture, et le nombre des autres. */
function mainRooms(rooms: readonly RoomInfo[]): { named: RoomInfo[]; others: number } {
  const named = [...rooms]
    .sort((a, b) => b.area - a.area || a.rank - b.rank)
    .slice(0, 2)
    .sort((a, b) => a.rank - b.rank)
  return { named, others: rooms.length - named.length }
}

function wallBaseName(wall: WallElement, rooms: readonly RoomInfo[], labels: AutoNameLabels): string {
  const { left, right } = wallSides(wall, rooms)
  const all = [...new Set([...left, ...right])]
  if (all.length === 0) return labels.isolatedWall
  const { named, others } = mainRooms(all)
  const more = others > 0 ? ` +${others}` : ''
  const twoSided = left.size > 0 && right.size > 0
  if (!twoSided) return `${labels.exteriorWall} ${named.map((r) => r.label).join(', ')}${more}`
  // Une seule pièce, des deux côtés : mur posé à l'intérieur de la pièce.
  if (named.length === 1) return `${labels.wall} ${named[0].label}`
  return `${labels.wall} ${named[0].label} / ${named[1].label}${more}`
}

/** Pièce à laquelle appartient une ouverture, ou `null`. */
function openingRoom(opening: OpeningElement, wall: WallElement, rooms: readonly RoomInfo[]): RoomInfo | null {
  const segment = wallSegment(wall, opening.segmentIndex)
  if (!segment) return null
  const centre = openingCentre(opening, wall)
  const reach = wall.thickness / 2 + PROBE_BEYOND_FACE
  const left = roomAt({ x: centre.x + segment.normal.x * reach, y: centre.y + segment.normal.y * reach }, rooms)
  const right = roomAt({ x: centre.x - segment.normal.x * reach, y: centre.y - segment.normal.y * reach }, rooms)
  const [toward, away] = opening.side === 'left' ? [left, right] : [right, left]
  // Porte : la pièce vers laquelle elle s'ouvre. Fenêtre, baie : la pièce côté intérieur ; entre deux
  // pièces, celle du côté choisi pour l'ouverture.
  if (opening.kind === 'door') return toward ?? away
  if (left && right) return toward
  return left ?? right
}

/**
 * Nom automatique de chaque mur et de chaque ouverture (sur son mur), qu'il soit affiché ou non.
 * Identifiant → nom. Une ouverture dont le mur n'existe pas n'en reçoit pas.
 */
export function computeAutoNames(
  elements: readonly CanvasElement[],
  labels: AutoNameLabels = DEFAULT_AUTO_NAME_LABELS,
): Map<string, string> {
  const names = new Map<string, string>()
  const walls = elements.filter((el): el is WallElement => el.type === 'wall')
  const wallById = new Map(walls.map((wall) => [wall.id, wall]))
  const levelIds = new Set(walls.map((wall) => wall.levelId))

  for (const levelId of levelIds) {
    const rooms = roomInfos(
      elements.filter((el): el is RoomElement => el.type === 'room' && el.levelId === levelId),
      labels,
    )
    const levelWalls = walls.filter((wall) => wall.levelId === levelId)

    // Murs : nom tiré des pièces ; un nom porté par plusieurs murs est numéroté dans l'ordre de lecture.
    const wallBase = new Map(levelWalls.map((wall) => [wall.id, wallBaseName(wall, rooms, labels)]))
    const baseCount = new Map<string, number>()
    for (const base of wallBase.values()) baseCount.set(base, (baseCount.get(base) ?? 0) + 1)
    const seen = new Map<string, number>()
    for (const wall of readingOrder(levelWalls.map((item) => ({ item, ...wallCentre(item) })))) {
      const base = wallBase.get(wall.id) ?? labels.isolatedWall
      if ((baseCount.get(base) ?? 0) < 2) {
        names.set(wall.id, base)
        continue
      }
      const n = (seen.get(base) ?? 0) + 1
      seen.set(base, n)
      names.set(wall.id, numbered(base, n))
    }

    // Ouvertures : type + pièce + numéro, numéro repris à 1 dans chaque pièce.
    const openings: { item: OpeningElement; x: number; y: number }[] = []
    for (const el of elements) {
      if (el.type !== 'opening') continue
      const wall = wallById.get(el.wallId)
      if (!wall || wall.levelId !== levelId) continue
      openings.push({ item: el, ...openingCentre(el, wall) })
    }
    const counters = new Map<string, number>()
    for (const opening of readingOrder(openings)) {
      const wall = wallById.get(opening.wallId)
      if (!wall) continue
      const room = openingRoom(opening, wall, rooms)
      // Les baies comptent avec les fenêtres (comme les repères F01).
      const family = opening.kind === 'door' ? 'door' : 'window'
      const key = `${family}|${room?.room.id ?? ''}`
      const n = (counters.get(key) ?? 0) + 1
      counters.set(key, n)
      const type = labels[opening.kind]
      names.set(opening.id, room ? numbered(`${type} ${room.label}`, n) : `${type} ${n}`)
    }
  }
  return names
}

/** Nom affiché de chaque élément nommé automatiquement (identifiant → nom) : nom tapé, sinon automatique. */
export function displayNames(
  elements: readonly CanvasElement[],
  labels: AutoNameLabels = DEFAULT_AUTO_NAME_LABELS,
  /** Noms automatiques déjà calculés (`computeAutoNames`), pour ne pas refaire le calcul. */
  auto: Map<string, string> = computeAutoNames(elements, labels),
): Map<string, string> {
  const result = new Map<string, string>()
  for (const el of elements) {
    if (el.type !== 'wall' && el.type !== 'opening') continue
    const automatic = auto.get(el.id)
    result.set(el.id, automatic !== undefined && isAutoName(el.name, labels) ? automatic : el.name)
  }
  return result
}

/**
 * Les mêmes éléments, murs et ouvertures portant leur nom affiché. Un élément inchangé garde le même
 * objet. Sert aux métrés et aux exports : ils montrent les mêmes noms que les calques.
 */
export function withDisplayNames(
  elements: readonly CanvasElement[],
  labels: AutoNameLabels = DEFAULT_AUTO_NAME_LABELS,
): CanvasElement[] {
  const names = displayNames(elements, labels)
  return elements.map((el) => {
    const name = names.get(el.id)
    return name === undefined || name === el.name ? el : ({ ...el, name } as Named)
  })
}
