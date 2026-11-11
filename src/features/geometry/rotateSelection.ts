import type { CanvasElement } from '../../types/document'
import { elementBounds } from '../export/bounds'
import { unionBoxes } from './box'
import { rotateQuarterTurn } from './transform'
import type { Point } from './viewport'

const toRadians = (degrees: number) => (degrees * Math.PI) / 180

/** Centre d'un élément défini par `x, y` et ses dimensions (avant et après rotation autour de `x, y`). */
function ownCenter(element: CanvasElement): Point | null {
  switch (element.type) {
    case 'ellipse':
      return { x: element.x, y: element.y }
    case 'furniture':
    case 'rect':
    case 'image': {
      const w = element.width
      const h = element.type === 'furniture' ? element.depth : element.height
      const angle = toRadians(element.rotation)
      return {
        x: element.x + (w * Math.cos(angle) - h * Math.sin(angle)) / 2,
        y: element.y + (w * Math.sin(angle) + h * Math.cos(angle)) / 2,
      }
    }
    default:
      return null
  }
}

/** Quart de tour (+90°, sens horaire à l'écran) d'un point autour de `center`, en mm entiers. */
function turnPoint(x: number, y: number, center: Point): Point {
  return {
    x: Math.round(center.x - (y - center.y)),
    y: Math.round(center.y + (x - center.x)),
  }
}

/** Éléments qui tournent avec la sélection (les ouvertures suivent leur mur, les axes ne tournent pas). */
function turns(element: CanvasElement): boolean {
  return element.type !== 'opening' && element.type !== 'axis' && !element.locked
}

/**
 * Quart de tour (+90°, sens horaire) de toute une sélection autour du centre de son emprise
 * commune : les éléments gardent leurs positions relatives. Murs, pièces et cotes tournent par
 * leurs points ; mobilier, rectangles, images et ellipses par leur rotation et leur position.
 * Les ouvertures ne changent pas (leur place est relative à leur mur), les axes non plus, ni les
 * éléments verrouillés, textes et lignes.
 *
 * Renvoie les seuls éléments modifiés (à remplacer par identifiant).
 */
export function rotateSelectionQuarterTurn(selection: readonly CanvasElement[]): CanvasElement[] {
  const moving = selection.filter(turns)
  const bounds = unionBoxes(
    moving.flatMap((element) => {
      const box = elementBounds(element)
      return box ? [box] : []
    }),
  )
  if (!bounds) return []
  const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }

  return moving.flatMap((element): CanvasElement[] => {
    switch (element.type) {
      case 'wall':
      case 'room':
      case 'platform': {
        const points: number[] = []
        for (let i = 0; i < element.points.length; i += 2) {
          const p = turnPoint(element.points[i], element.points[i + 1], center)
          points.push(p.x, p.y)
        }
        return [{ ...element, points }]
      }
      case 'dimension': {
        const [ax, ay, bx, by] = element.points
        const a = turnPoint(ax, ay, center)
        const b = turnPoint(bx, by, center)
        return [{ ...element, points: [a.x, a.y, b.x, b.y] }]
      }
      default: {
        const before = ownCenter(element)
        if (!before) return []
        const turned = rotateQuarterTurn(element)
        // Après son propre quart de tour, l'élément est resté sur place : on le déplace là où
        // son centre doit aller dans la sélection.
        const target = turnPoint(before.x, before.y, center)
        return [{ ...turned, x: Math.round(turned.x + target.x - before.x), y: Math.round(turned.y + target.y - before.y) }]
      }
    }
  })
}
