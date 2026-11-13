import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { fetchMyRole } from '../features/sharing/membersApi'
import type { ProjectRole } from '../features/sharing/membersLogic'
import { fr } from '../i18n/fr'
import { useAuthStore } from '../stores/authStore'
import EditorPage from './EditorPage'
import SharedProjectPage from './SharedProjectPage'

/**
 * Porte d'entrée de `/p/:projectId` : cherche le rôle de la personne sur le projet, puis ouvre
 * l'éditeur (propriétaire ou éditeur invité) ou la lecture seule (lecteur invité).
 *
 * Si le rôle est inconnu (projet pas encore envoyé au compte, réseau coupé), on ouvre l'éditeur :
 * c'est le cas d'un projet créé hors connexion, qui n'existe encore que dans la file d'attente
 * locale. La base reste le vrai garde-fou : elle refuse les écritures d'un lecteur.
 */
export default function ProjectPage() {
  const { projectId } = useParams()
  const authStatus = useAuthStore((state) => state.status)
  const userId = useAuthStore((state) => state.user?.id ?? null)
  const authReady = authStatus !== 'loading'

  // Résultat associé au projet et au compte demandés : sinon, on est en « chargement ».
  const [found, setFound] = useState<{ key: string; role: ProjectRole | null } | null>(null)
  const key = `${projectId ?? ''}|${userId ?? ''}`

  useEffect(() => {
    if (!projectId || !authReady) return
    let cancelled = false
    fetchMyRole(projectId)
      .then((role) => {
        if (!cancelled) setFound({ key, role })
      })
      .catch(() => {
        if (!cancelled) setFound({ key, role: null })
      })
    return () => {
      cancelled = true
    }
  }, [projectId, authReady, key])

  if (!projectId) return <EditorPage />
  if (!authReady || found?.key !== key) {
    return <p className="p-8 text-slate-500">{fr.common.loading}</p>
  }
  if (found.role === 'viewer') return <SharedProjectPage projectId={projectId} />
  return <EditorPage isOwner={found.role !== 'editor'} />
}
