/**
 * Événement « modèle changé » (`ModelChanged`, roadmap M18) : émis chaque fois que la scène d'un
 * projet Plan change (geste de l'éditeur, autre personne, annuler / rétablir). Métrés, vues et,
 * plus tard, nomenclatures et DQE s'y abonnent au lieu de surveiller l'éditeur.
 */
import type { PlanScene } from './sceneTypes'

export interface ModelChanged {
  /** Scène après le changement. */
  scene: PlanScene
  /** Scène avant (`null` à l'ouverture). */
  previous: PlanScene | null
  /** Nœuds touchés quand ils sont connus (changement reçu), sinon `null` (à comparer). */
  changedNodeIds: ReadonlySet<string> | null
}

type Listener = (event: ModelChanged) => void
const listeners = new Set<Listener>()

/** S'abonne ; renvoie la fonction de désabonnement. */
export function onModelChanged(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function emitModelChanged(event: ModelChanged): void {
  for (const listener of [...listeners]) listener(event)
}
