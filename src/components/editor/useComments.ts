import { useEffect } from 'react'
import { commentsAvailable, listComments } from '../../features/comments/commentsApi'
import { fetchMyRole } from '../../features/sharing/membersApi'
import { listProjectPeople } from '../../features/versions/versionsApi'
import { fr } from '../../i18n/fr'
import { useAuthStore } from '../../stores/authStore'
import { useCommentsStore } from '../../stores/commentsStore'

/** Relecture régulière en attendant la diffusion en direct (M16, lot E). */
const REFRESH_INTERVAL_MS = 30_000

/**
 * Charge les commentaires du projet ouvert (M16, lot B) : seulement avec un compte connecté et Supabase.
 * Relus toutes les 30 s ; une réponse arrivée après une plus récente, ou après la fermeture du projet,
 * est ignorée. Une lecture ratée garde la liste déjà affichée.
 */
export function useComments(projectId: string | undefined, ready: boolean) {
  const userId = useAuthStore((state) => state.user?.id ?? null)

  useEffect(() => {
    if (!projectId || !ready || !userId || !commentsAvailable()) return
    let request = 0
    let active = true

    const refresh = () => {
      const id = ++request
      Promise.all([listComments(projectId), listProjectPeople(projectId, fr.history.unknownAuthor)])
        .then(([comments, people]) => {
          if (!active || id !== request) return
          const store = useCommentsStore.getState()
          store.setPeople(new Map(people.map((person) => [person.id, person])))
          store.setComments(comments)
        })
        .catch(() => {
          // Hors connexion : on garde ce qui est affiché ; la prochaine lecture réessaiera.
        })
    }

    // Mon rôle : le propriétaire peut supprimer les commentaires des autres.
    fetchMyRole(projectId)
      .then((role) => {
        if (active) useCommentsStore.getState().setMyRole(role)
      })
      .catch(() => {})

    // Première lecture juste après l'affichage (pas d'écriture d'état pendant l'effet lui-même).
    const first = setTimeout(refresh, 0)
    const interval = setInterval(refresh, REFRESH_INTERVAL_MS)
    return () => {
      active = false
      clearTimeout(first)
      clearInterval(interval)
      useCommentsStore.getState().reset()
    }
  }, [projectId, ready, userId])
}
