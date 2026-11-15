import { useEffect } from 'react'
import { commentsAvailable, listComments } from '../../features/comments/commentsApi'
import { parseCommentRow, rowToComment } from '../../features/comments/commentsLogic'
import { fetchMyRole } from '../../features/sharing/membersApi'
import { listProjectPeople } from '../../features/versions/versionsApi'
import { fr } from '../../i18n/fr'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useCommentsStore } from '../../stores/commentsStore'

/**
 * Relecture complète régulière : filet de sécurité du direct (suppressions, événements manqués). Les
 * suppressions ne sont pas diffusées en direct : Supabase n'applique pas les règles d'accès aux
 * événements de suppression, on évite donc de les écouter.
 */
const REFRESH_INTERVAL_MS = 30_000

/**
 * Charge les commentaires du projet ouvert (M16) : seulement avec un compte connecté et Supabase.
 * Lot E : nouveaux commentaires, réponses, modifications et résolutions arrivent en direct (Supabase
 * Realtime, règles d'accès de la table appliquées) ; la liste est relue en entier à chaque (re)connexion
 * du direct et toutes les 30 s. Une réponse arrivée après une plus récente, ou après la fermeture du
 * projet, est ignorée. Une lecture ratée garde la liste déjà affichée.
 */
export function useComments(projectId: string | undefined, ready: boolean) {
  const userId = useAuthStore((state) => state.user?.id ?? null)

  useEffect(() => {
    if (!projectId || !ready || !userId || !commentsAvailable() || !supabase) return
    const client = supabase
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

    // Direct : ajouts et modifications (le filtre garde les commentaires de ce projet).
    const channel = client
      .channel(`comments:${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'project_comments', filter: `project_id=eq.${projectId}` },
        (payload) => {
          if (!active || payload.eventType === 'DELETE') return
          const row = parseCommentRow(payload.new)
          if (!row || row.project_id !== projectId) return
          const store = useCommentsStore.getState()
          store.upsertComment(rowToComment(row))
          // Un auteur encore inconnu (nom, photo) : on relit les personnes.
          if (!store.people.has(row.author_id)) refresh()
        },
      )
      .subscribe((status) => {
        // À chaque (re)connexion du direct : relecture complète, pour rattraper ce qui a pu être manqué.
        if (status === 'SUBSCRIBED') refresh()
      })

    // Première lecture juste après l'affichage (et filet si le direct ne démarre pas).
    const first = setTimeout(refresh, 0)
    const interval = setInterval(refresh, REFRESH_INTERVAL_MS)
    return () => {
      active = false
      clearTimeout(first)
      clearInterval(interval)
      void client.removeChannel(channel)
      useCommentsStore.getState().reset()
    }
  }, [projectId, ready, userId])
}
