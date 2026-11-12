import type { FabricsDocument, OpeningElement, WallElement } from '../../types/document'
import type { DrawText, PlanOverlay } from '../building/views/drawing'
import { elementsOnLevel } from '../documents/levels'
import { openingGeometry } from '../geometry/openings'
import { toPoints } from '../geometry/polygon'
import type { Point } from '../geometry/viewport'
import { formatDecimal } from '../units/format'

// Étiquettes de cote automatiques (M11 bis, lot F) : la longueur de chaque côté de mur et la largeur
// de chaque porte, fenêtre ou baie, en mm, posées le long des murs. Calculées à partir du plan,
// jamais enregistrées (seule l'option `plan.showDimensionLabels` l'est) : elles suivent le plan.

/** Écart entre la face du mur et le texte, en hauteurs de texte. */
const GAP_EM = 0.5
/** Un côté plus court que cela (en hauteurs de texte) n'est pas étiqueté : le chiffre n'y tient pas. */
const MIN_SIDE_EM = 3

/**
 * Étiquettes de longueur des murs visibles d'un niveau (côté extérieur) et de largeur des ouvertures
 * (côté intérieur), texte aligné sur le mur et toujours lisible (jamais à l'envers). `null` si
 * l'option est désactivée ou s'il n'y a pas de mur.
 */
export function lengthLabels(
  document: Pick<FabricsDocument, 'elements' | 'plan'>,
  levelId: string,
  fontMm: number,
): PlanOverlay | null {
  if (!document.plan?.showDimensionLabels) return null
  const elements = elementsOnLevel(document.elements, levelId).filter((el) => !el.hidden)
  const walls = elements.filter((el): el is WallElement => el.type === 'wall')
  if (walls.length === 0) return null

  // Centre du bâtiment : « l'extérieur » d'un mur est le côté qui s'en éloigne.
  let sumX = 0
  let sumY = 0
  let count = 0
  for (const wall of walls) {
    for (const p of toPoints(wall.points)) {
      sumX += p.x
      sumY += p.y
      count++
    }
  }
  const center: Point = { x: sumX / count, y: sumY / count }

  const texts: DrawText[] = []
  /** Texte `value` (mm) centré en `mid`, parallèle à la direction `dir`, du côté `side` (+1 ou −1 de la normale gauche). */
  const label = (mid: Point, dir: Point, thickness: number, side: 1 | -1, value: number) => {
    const normal = { x: -dir.y * side, y: dir.x * side }
    let angle = (Math.atan2(dir.y, dir.x) * 180) / Math.PI
    if (angle > 90 || angle <= -90) angle += angle > 0 ? -180 : 180
    const rad = (angle * Math.PI) / 180
    // « Haut » du texte tourné (sens horaire à l'écran) : il doit s'éloigner du mur, sinon on le décale d'une hauteur.
    const up = { x: Math.sin(rad), y: -Math.cos(rad) }
    const distance = thickness / 2 + fontMm * GAP_EM + (up.x * normal.x + up.y * normal.y < 0 ? fontMm : 0)
    texts.push({
      x: mid.x + normal.x * distance,
      y: mid.y + normal.y * distance,
      text: formatDecimal(value, 0),
      size: fontMm,
      anchor: 'middle',
      angle: angle === 0 ? undefined : angle,
    })
  }

  for (const wall of walls) {
    const points = toPoints(wall.points)
    for (let i = 0; i + 1 < points.length; i++) {
      const a = points[i]
      const b = points[i + 1]
      const length = Math.hypot(b.x - a.x, b.y - a.y)
      if (length < MIN_SIDE_EM * fontMm) continue
      const dir = { x: (b.x - a.x) / length, y: (b.y - a.y) / length }
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      const left = { x: -dir.y, y: dir.x }
      const outside: 1 | -1 = (mid.x - center.x) * left.x + (mid.y - center.y) * left.y >= 0 ? 1 : -1
      label(mid, dir, wall.thickness, outside, length)
    }
  }

  const wallById = new Map(walls.map((wall) => [wall.id, wall]))
  for (const opening of elements) {
    if (opening.type !== 'opening') continue
    const wall = wallById.get((opening as OpeningElement).wallId)
    if (!wall) continue
    const geometry = openingGeometry(opening, wall)
    if (!geometry || opening.width < MIN_SIDE_EM * fontMm) continue
    const left = { x: -geometry.direction.y, y: geometry.direction.x }
    const outside: 1 | -1 =
      (geometry.center.x - center.x) * left.x + (geometry.center.y - center.y) * left.y >= 0 ? 1 : -1
    // Côté intérieur : l'opposé de celui de la longueur du mur.
    label(geometry.center, geometry.direction, wall.thickness, outside === 1 ? -1 : 1, opening.width)
  }

  return texts.length === 0 ? null : { lines: [], texts }
}
