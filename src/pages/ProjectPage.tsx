import { lazy, Suspense, useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { peekCreated } from '../features/persistence/justCreated'
import { fetchMyRole } from '../features/sharing/membersApi'
import type { ProjectRole } from '../features/sharing/membersLogic'
import { fr } from '../i18n/fr'
import { useAuthStore } from '../stores/authStore'
import EditorPage from './EditorPage'
import SharedProjectPage from './SharedProjectPage'

// M19 A3 : un projet Plan s'ouvre dans l'éditeur de Pascal (un Visuel y retrouve son propre éditeur).
const PascalEditorPage = lazy(() => import('./PascalEditorPage'))

/**
 * Porte d'entrée de `/p/:projectId` : cherche le rôle de la personne sur le projet, puis ouvre
 * l'éditeur (propriétaire ou éditeur invité) ou la lecture seule (lecteur invité). Depuis M19 A3,
 * l'éditeur est celui de Pascal pour un plan ; l'ancien reste à `/p/:projectId/ancien` jusqu'en A7.
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
    // Projet qu'on vient de créer : on en est le propriétaire, inutile de le demander au serveur.
    const roleRequest: Promise<ProjectRole | null> = peekCreated(projectId)
      ? Promise.resolve('owner')
      : fetchMyRole(projectId)
    roleRequest
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
  return (
    <Suspense fallback={<p className="p-8 text-slate-500">{fr.common.loading}</p>}>
      <PascalEditorPage isOwner={found.role !== 'editor'} />
    </Suspense>
  )
}
