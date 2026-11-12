/**
 * Mémorise, par compte et sur cet appareil, que la proposition d'importer les projets locaux a été
 * traitée (acceptée ou refusée), pour ne pas la reposer à chaque connexion.
 */
const keyFor = (userId: string) => `fabrics:import-asked:${userId}`

export function wasImportAsked(userId: string): boolean {
  try {
    return localStorage.getItem(keyFor(userId)) === '1'
  } catch {
    return false
  }
}

export function markImportAsked(userId: string): void {
  try {
    localStorage.setItem(keyFor(userId), '1')
  } catch {
    // Stockage indisponible : la proposition pourra être refaite, sans conséquence.
  }
}
