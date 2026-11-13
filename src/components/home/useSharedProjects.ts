import { useCallback, useEffect, useState } from 'react'
import { listSharedWithMe } from '../../features/sharing/membersApi'
import type { SharedProjectSummary } from '../../features/sharing/membersLogic'

/**
 * Projets partagés avec la personne connectée (rubrique « Partagés avec moi »).
 * Relus quand `userId` change ; vide sans compte. Un échec n'empêche pas d'utiliser le reste de l'accueil.
 */
export function useSharedProjects(userId: string | null) {
  const [projects, setProjects] = useState<SharedProjectSummary[]>([])
  const [failed, setFailed] = useState(false)

  const reload = useCallback(async () => {
    if (!userId) {
      setProjects([])
      setFailed(false)
      return
    }
    try {
      setProjects(await listSharedWithMe())
      setFailed(false)
    } catch {
      setFailed(true)
    }
  }, [userId])

  useEffect(() => {
    let cancelled = false
    if (!userId) return
    listSharedWithMe()
      .then((list) => {
        if (cancelled) return
        setProjects(list)
        setFailed(false)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  return { projects: userId ? projects : [], failed, reload }
}
