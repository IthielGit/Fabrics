import { useState } from 'react'

/**
 * Exécute une action (créer, activer, supprimer un lien…) puis relit les listes, même en cas
 * d'échec ; `actionFailed` dit si la dernière action a échoué (un message s'affiche alors).
 */
export function useRunThenReload(reload: () => Promise<void>) {
  const [actionFailed, setActionFailed] = useState(false)

  const run = async (action: () => Promise<void>) => {
    setActionFailed(false)
    try {
      await action()
    } catch {
      setActionFailed(true)
    }
    await reload()
  }

  return { run, actionFailed }
}
