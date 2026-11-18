/**
 * Ancre enregistrée d'un commentaire posé sur un élément (M18, lot E). Projet Plan : le nœud de la
 * scène Pascal qui porte l'élément (`scene/commentAnchors.ts`), réglé par l'éditeur à l'ouverture ;
 * projet Visuel : l'élément lui-même.
 */
import { elementOfAnchor } from '../scene/commentAnchors'

let resolveAnchor: ((elementId: string) => string) | null = null

/** Règle (ou retire, avec `null`) la façon de passer d'un élément à l'ancre enregistrée. */
export function setCommentAnchorResolver(resolver: ((elementId: string) => string) | null): void {
  resolveAnchor = resolver
}

/** Ancre à enregistrer pour un commentaire posé sur `elementId`. */
export function commentAnchorOf(elementId: string): string {
  return resolveAnchor ? resolveAnchor(elementId) : elementId
}

/** Élément affiché d'une ancre enregistrée (nœud de la scène, ou élément avant M18). */
export function commentElementOf(anchor: string): string {
  return elementOfAnchor(anchor)
}
