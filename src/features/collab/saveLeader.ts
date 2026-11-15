// Qui enregistre dans Supabase les modifications venues d'autres personnes (M14, lot F). Fonctions pures.
//
// Ses propres modifications, chacun les enregistre lui-même. Une modification reçue d'une autre
// connexion n'est enregistrée que par un seul participant : celui qui a le plus petit numéro de
// connexion Yjs parmi les connexions présentes. Cela évite que chaque geste soit écrit autant de
// fois qu'il y a de personnes dans la salle.

/** Numéro de connexion de l'enregistreur désigné, `null` si personne n'est présent. */
export function saveLeaderId(clientIds: Iterable<number>): number | null {
  let leader: number | null = null
  for (const id of clientIds) if (leader === null || id < leader) leader = id
  return leader
}

/** Vrai si cette connexion est l'enregistreur désigné (seule dans la salle : toujours vrai). */
export function isSaveLeader(selfClientId: number, presentClientIds: Iterable<number>): boolean {
  const leader = saveLeaderId(presentClientIds)
  return leader === null || leader === selfClientId
}
