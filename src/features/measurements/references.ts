import type { CanvasElement, FabricsDocument, OpeningElement, WallElement } from '../../types/document'

/**
 * Repères des murs, portes et fenêtres (M10 ter) : `M01…`, `P01…`, `F01…` (les baies comptent avec
 * les fenêtres). Calcul pur, partagé par les métrés et les cotes : le même repère désigne le même
 * élément partout. Numérotation continue dans tout le bâtiment, niveau par niveau (du plus bas au
 * plus haut), puis de haut en bas et de gauche à droite dans le plan.
 */
export interface References {
  /** Identifiant du mur → `M01`. */
  walls: Map<string, string>
  /** Identifiant de l'ouverture → `P01` (porte) ou `F01` (fenêtre, baie). */
  openings: Map<string, string>
}

/** Deux éléments consécutifs (triés par hauteur) à moins de cet écart (mm) sont sur la « même ligne ». */
const ROW_BAND = 500

const pad = (prefix: string, n: number) => `${prefix}${String(n).padStart(2, '0')}`

interface Placed<T> {
  item: T
  x: number
  y: number
}

/** Milieu du tracé d'un mur (centre de son rectangle englobant). */
function wallCentre(wall: WallElement): { x: number; y: number } {
  const xs: number[] = []
  const ys: number[] = []
  for (let i = 0; i + 1 < wall.points.length; i += 2) {
    xs.push(wall.points[i])
    ys.push(wall.points[i + 1])
  }
  if (xs.length === 0) return { x: 0, y: 0 }
  return { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 }
}

/** Centre d'une ouverture sur l'axe de son mur. */
function openingCentre(opening: OpeningElement, wall: WallElement): { x: number; y: number } {
  const i = opening.segmentIndex * 2
  const ax = wall.points[i]
  const ay = wall.points[i + 1]
  const bx = wall.points[i + 2]
  const by = wall.points[i + 3]
  if (bx === undefined || by === undefined) return wallCentre(wall)
  const length = Math.hypot(bx - ax, by - ay)
  if (length === 0) return { x: ax, y: ay }
  // Une ouverture posée hors de son segment est classée comme si elle était au bout du segment.
  const t = Math.min(1, Math.max(0, opening.offset / length))
  return { x: ax + (bx - ax) * t, y: ay + (by - ay) * t }
}

/**
 * Haut en bas, puis gauche à droite. On trie par hauteur ; une nouvelle ligne commence quand l'écart
 * avec l'élément précédent dépasse `ROW_BAND` (pas de bandes fixes : deux murs à y = 749 et y = 751
 * sont sur la même ligne). L'identifiant départage deux égalités.
 */
function readingOrder<T extends { id: string }>(list: Placed<T>[]): T[] {
  const byHeight = [...list].sort((a, b) => a.y - b.y || a.x - b.x || a.item.id.localeCompare(b.item.id))
  const rows: Placed<T>[][] = []
  let previousY = -Infinity
  for (const entry of byHeight) {
    if (rows.length === 0 || entry.y - previousY > ROW_BAND) rows.push([])
    rows[rows.length - 1].push(entry)
    previousY = entry.y
  }
  return rows.flatMap((row) =>
    row.sort((a, b) => a.x - b.x || a.y - b.y || a.item.id.localeCompare(b.item.id)).map((entry) => entry.item),
  )
}

export function buildReferences(document: Pick<FabricsDocument, 'elements' | 'levels'>): References {
  const walls = new Map<string, string>()
  const openings = new Map<string, string>()
  const byId = new Map(
    document.elements.filter((el): el is WallElement => el.type === 'wall').map((wall) => [wall.id, wall]),
  )
  const levels = [...(document.levels ?? [])].sort((a, b) => a.elevation - b.elevation)
  let wallN = 0
  let doorN = 0
  let windowN = 0
  for (const level of levels) {
    const onLevel = (el: CanvasElement) => el.levelId === level.id
    const levelWalls = document.elements.filter((el): el is WallElement => el.type === 'wall' && onLevel(el))
    for (const wall of readingOrder(levelWalls.map((item) => ({ item, ...wallCentre(item) })))) {
      walls.set(wall.id, pad('M', ++wallN))
    }
    const levelOpenings: Placed<OpeningElement>[] = []
    for (const el of document.elements) {
      if (el.type !== 'opening') continue
      const wall = byId.get(el.wallId)
      if (!wall || !onLevel(wall)) continue
      levelOpenings.push({ item: el, ...openingCentre(el, wall) })
    }
    for (const opening of readingOrder(levelOpenings)) {
      openings.set(opening.id, opening.kind === 'door' ? pad('P', ++doorN) : pad('F', ++windowN))
    }
  }
  return { walls, openings }
}
