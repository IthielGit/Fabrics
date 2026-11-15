// Pont entre l'enregistrement automatique et la session de collaboration ouverte (M14, lot F).
// Évite que `useAutosave` dépende de la liaison Yjs : il sait seulement « noter un enregistrement ».

interface Session {
  projectId: string
  markSaved: (savedAt: string) => void
}

let current: Session | null = null

/** Appelée par `useCollaboration` à l'ouverture (session) et à la fermeture (`null`) de la salle. */
export function setCollabSession(session: Session | null): void {
  current = session
}

/** Note dans la salle l'heure d'un enregistrement réussi ; sans effet si le projet n'est pas dans la salle ouverte. */
export function markProjectSaved(projectId: string, savedAt: string): void {
  if (current && current.projectId === projectId) current.markSaved(savedAt)
}
