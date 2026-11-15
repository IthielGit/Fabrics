import type { Project } from '../../types/document'

/**
 * Passe-plat entre l'accueil et l'éditeur : le projet qu'on vient de créer est déjà en mémoire,
 * inutile de le relire depuis le serveur (ni de demander son rôle : on en est le propriétaire).
 * Un seul projet est gardé, et seulement le temps de l'ouvrir.
 */
let created: Project | null = null

export function rememberCreated(project: Project): void {
  created = project
}

/** Le projet qu'on vient de créer, s'il porte cet identifiant ; sinon `null`. */
export function peekCreated(id: string): Project | null {
  return created?.id === id ? created : null
}

/**
 * Oublie le projet une fois ouvert. Différé d'un tour : en mode strict, React relance l'effet
 * d'ouverture tout de suite, et il doit encore le trouver.
 */
export function forgetCreated(id: string): void {
  setTimeout(() => {
    if (created?.id === id) created = null
  }, 0)
}
