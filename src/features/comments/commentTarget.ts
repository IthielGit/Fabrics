// Où un clic de l'outil « Commenter » (M16, lot B) pose son commentaire : sur l'élément visé, sinon sur un
// point libre. Fonctions pures, testées.

import type { CanvasElement } from '../../types/document'
import { elementBounds } from '../export/bounds'

export interface CommentTarget {
  /** Identifiant de l'élément visé ; `null` : point libre. */
  elementId: string | null
  /** Point du document (mm) : le clic. */
  x: number
  y: number
}

/** Distance d'un point à un segment. */
function distanceToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax
  const dy = by - ay
  const lengthSquared = dx * dx + dy * dy
  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

/** Vrai si le clic vise un mur : proche de son axe (demi-épaisseur + marge). Plus précis que sa boîte (murs en diagonale). */
function hitsWall(wall: Extract<CanvasElement, { type: 'wall' }>, x: number, y: number, tolerance: number): boolean {
  const reach = wall.thickness / 2 + tolerance
  for (let i = 0; i + 3 < wall.points.length; i += 2) {
    if (distanceToSegment(x, y, wall.points[i], wall.points[i + 1], wall.points[i + 2], wall.points[i + 3]) <= reach) {
      return true
    }
  }
  return false
}

/**
 * Élément visé par un clic au point `(x, y)` parmi les éléments visibles du niveau affiché : le plus petit
 * dont l'emprise contient le point (un mur dans une pièce l'emporte sur la pièce ; en cas d'égalité, celui
 * dessiné au-dessus). `tolerance` (mm) agrandit un peu les éléments fins (cote, axe, mur). Les ouvertures
 * n'ont pas d'emprise propre : on vise leur mur. Aucun élément : `elementId` nul (point libre).
 */
export function commentTargetAt(
  elements: readonly CanvasElement[],
  x: number,
  y: number,
  tolerance: number,
): CommentTarget {
  let best: { id: string; area: number } | null = null
  for (const element of elements) {
    if (element.hidden) continue
    let hit = false
    let area = 0
    if (element.type === 'wall') {
      hit = hitsWall(element, x, y, tolerance)
      area = 0 // un mur gagne sur tout ce qui l'entoure (pièce, plateforme…)
    } else {
      const box = elementBounds(element)
      if (!box) continue
      hit =
        x >= box.x - tolerance &&
        x <= box.x + box.width + tolerance &&
        y >= box.y - tolerance &&
        y <= box.y + box.height + tolerance
      area = box.width * box.height
    }
    // `<=` : à surface égale, l'élément le plus tard dans la liste (dessiné au-dessus) gagne.
    if (hit && (best === null || area <= best.area)) best = { id: element.id, area }
  }
  return { elementId: best?.id ?? null, x, y }
}
