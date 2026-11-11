import type { CanvasElement, FurnitureElement, OpeningElement } from '../../types/document'
import { closedWallAxisAround } from '../documents/construction'
import {
  createFurnitureElement,
  createOpeningElement,
  createRoomElement,
  createWallElement,
} from '../documents/elements'
import type { PrefabOpening, SetDef } from './catalog/sets'

/**
 * Objets à créer pour poser un ensemble : chacun est placé relativement au coin haut-gauche
 * `origin` de l'ensemble. `nameOf` donne le nom de base d'un objet ; `existing` compte les objets
 * déjà posés par identifiant, pour numéroter les noms (« Chaise 3 »).
 */
export function elementsForSet(
  set: SetDef,
  origin: { x: number; y: number },
  nameOf: (symbol: string) => string,
  existing: ReadonlyMap<string, number> = new Map(),
): FurnitureElement[] {
  const counts = new Map(existing)
  return set.members.map((member) => {
    const count = (counts.get(member.symbol) ?? 0) + 1
    counts.set(member.symbol, count)
    const element = createFurnitureElement(
      `${nameOf(member.symbol)} ${count}`,
      member.symbol,
      origin.x + member.x,
      origin.y + member.y,
      member.width,
      member.depth,
    )
    return {
      ...element,
      rotation: member.rotation,
      ...(member.mirrored ? { mirrored: true } : {}),
    }
  })
}

/**
 * Position le long de l'axe du mur fermé (en mm depuis le début du segment) du centre d'une
 * ouverture. L'axe du mur fait le tour de l'emprise dans le sens horaire (haut, droite, bas,
 * gauche) et chaque segment commence une demi-épaisseur avant l'angle de l'emprise.
 */
export function prefabOpeningPlacement(
  opening: Pick<PrefabOpening, 'side' | 'at'>,
  interior: { width: number; depth: number },
  thickness: number,
): { segmentIndex: number; offset: number } {
  const half = thickness / 2
  switch (opening.side) {
    case 'top':
      return { segmentIndex: 0, offset: half + opening.at }
    case 'right':
      return { segmentIndex: 1, offset: half + opening.at }
    case 'bottom':
      return { segmentIndex: 2, offset: half + (interior.width - opening.at) }
    case 'left':
      return { segmentIndex: 3, offset: half + (interior.depth - opening.at) }
  }
}

export interface PrefabNames {
  /** Nom d'un objet du catalogue (voir `elementsForSet`). */
  nameOf: (symbol: string) => string
  /** Objets déjà posés par identifiant. */
  existing?: ReadonlyMap<string, number>
  /** Nom de la pièce (par exemple « Chambre »). */
  roomName: string
  /** Nom du mur fermé. */
  wallName: string
  /** Nom d'une ouverture selon son type. */
  openingName: (kind: OpeningElement['kind']) => string
}

/**
 * Éléments d'une pièce préfabriquée posée avec l'angle haut-gauche de son emprise (la face
 * intérieure du mur) en `origin` : une pièce, un seul mur fermé autour, ses ouvertures (rattachées
 * à ce mur) et son mobilier. Tous ont de nouveaux identifiants et restent indépendants ensuite.
 * Sans `shell`, seul le mobilier est renvoyé (c'est un simple ensemble).
 */
export function elementsForPrefab(
  set: SetDef,
  origin: { x: number; y: number },
  wallHeight: number,
  names: PrefabNames,
): CanvasElement[] {
  const furniture = elementsForSet(set, origin, names.nameOf, names.existing)
  const shell = set.shell
  if (!shell) return furniture

  const a = origin
  const b = { x: origin.x + set.width, y: origin.y + set.depth }
  const room = createRoomElement(names.roomName, [a.x, a.y, b.x, a.y, b.x, b.y, a.x, b.y])
  const wall = createWallElement(
    names.wallName,
    closedWallAxisAround(a, b, shell.thickness),
    shell.thickness,
    wallHeight,
  )
  const openings = shell.openings.map((spec): OpeningElement => {
    const placement = prefabOpeningPlacement(spec, set, shell.thickness)
    // `left` = côté de la normale du segment : l'intérieur de la pièce (contour horaire à l'écran).
    const opening = createOpeningElement(spec.kind, names.openingName(spec.kind), {
      wallId: wall.id,
      ...placement,
      side: 'left',
    })
    return {
      ...opening,
      ...(spec.width !== undefined ? { width: spec.width } : {}),
      ...(spec.height !== undefined ? { height: spec.height } : {}),
      ...(spec.sillHeight !== undefined ? { sillHeight: spec.sillHeight } : {}),
      ...(spec.hinge !== undefined ? { hinge: spec.hinge } : {}),
    }
  })
  return [room, wall, ...openings, ...furniture]
}
