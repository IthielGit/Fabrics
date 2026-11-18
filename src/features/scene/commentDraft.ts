/**
 * Brouillon de commentaire depuis l'éditeur de Pascal (M19 A2c). Dans l'ancien éditeur, on cliquait
 * un point du plan ; dans Pascal, le commentaire se pose sur l'objet sélectionné, ou au milieu du
 * plan si rien n'est sélectionné. Fonction pure, sans React.
 */
import type { CanvasElement, FabricsDocument } from '../../types/document'
import { elementOfAnchor } from './commentAnchors'

export interface CommentDraftTarget {
  elementId: string | null
  levelId: string | null
  /** Point du plan (mm) où l'épingle s'affiche dans l'ancien éditeur et les vues. */
  x: number
  y: number
}

/** Milieu d'un élément (mm) : moyenne de ses sommets, ou sa position. `null` si inconnu. */
export function elementMiddle(element: CanvasElement): { x: number; y: number } | null {
  const points = (element as { points?: unknown }).points
  if (Array.isArray(points) && points.length >= 2 && points.every((value) => typeof value === 'number')) {
    let sumX = 0
    let sumY = 0
    const count = Math.floor(points.length / 2)
    for (let i = 0; i < count; i++) {
      sumX += points[2 * i]
      sumY += points[2 * i + 1]
    }
    return { x: Math.round(sumX / count), y: Math.round(sumY / count) }
  }
  const { x, y } = element as { x?: unknown; y?: unknown }
  return typeof x === 'number' && typeof y === 'number' ? { x: Math.round(x), y: Math.round(y) } : null
}

/**
 * Cible d'un nouveau commentaire. `selectedNodeId` : premier nœud sélectionné dans Pascal (ou `null`).
 * Un nœud venu d'un plan Fabrics redevient son élément (`elementOfAnchor`) ; un nœud créé dans Pascal
 * garde son propre identifiant.
 */
export function commentDraftTarget(
  document: FabricsDocument,
  selectedNodeId: string | null,
  activeLevelId: string | null,
): CommentDraftTarget {
  const elementId = selectedNodeId ? elementOfAnchor(selectedNodeId) : null
  const element = elementId ? document.elements.find((el) => el.id === elementId) : undefined
  const middle = element ? elementMiddle(element) : null
  const levelId = (element as { levelId?: string | null } | undefined)?.levelId ?? activeLevelId
  if (middle) return { elementId, levelId, ...middle }
  return {
    elementId,
    levelId,
    x: Math.round(document.page.width / 2),
    y: Math.round(document.page.height / 2),
  }
}
