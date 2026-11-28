import { useEffect, useState } from 'react'
import { duplicateIds } from '../../features/measurements/controls'
import { forgetCreated, peekCreated } from '../../features/persistence/justCreated'
import { DuplicateElementIdError } from '../../features/scene/migrate/fromFabrics'
import { repository } from '../../features/persistence/repository'
import { useAuthStore } from '../../stores/authStore'
import { useEditorStore } from '../../stores/editorStore'

/** `duplicate-ids` : plan refusé, deux éléments portent le même identifiant (EDGE-01, M24 24.2). */
export type ProjectLoadState = 'loading' | 'ready' | 'not-found' | 'not-plan' | 'duplicate-ids' | 'error'

interface ProjectLoaderOptions {
  /**
   * Attendre que la session soit connue (local ou compte) avant de lire, et relire si le compte
   * change. Faux pour une page qui ne dépend pas du compte connecté.
   */
  waitForAuth?: boolean
  /** Un projet Visuel n'est pas chargé : l'état vaut alors `not-plan` (la page choisit l'éditeur). */
  planOnly?: boolean
}

/**
 * Charge un projet dans le magasin de l'éditeur et le ferme en quittant la page. Le résultat est
 * associé au projet demandé : tant qu'il ne correspond pas à l'adresse courante, l'état vaut
 * `loading` (rien à remettre à zéro dans l'effet).
 */
export function useProjectLoader(
  projectId: string | undefined,
  { waitForAuth = true, planOnly = false }: ProjectLoaderOptions = {},
): ProjectLoadState {
  const loadProject = useEditorStore((state) => state.loadProject)
  const closeProject = useEditorStore((state) => state.closeProject)
  const authStatus = useAuthStore((state) => state.status)
  const userId = useAuthStore((state) => state.user?.id ?? null)
  const authReady = !waitForAuth || authStatus !== 'loading'
  const accountKey = waitForAuth ? userId : null
  const [result, setResult] = useState<{ projectId: string; state: ProjectLoadState } | null>(null)

  useEffect(() => {
    if (!projectId || !authReady) return
    let cancelled = false
    // Projet qu'on vient de créer depuis l'accueil : il est déjà en mémoire, pas besoin de le relire.
    const justCreated = peekCreated(projectId)
    const load = justCreated ? Promise.resolve(justCreated) : repository.get(projectId)
    if (justCreated) forgetCreated(projectId)
    load
      .then((project) => {
        if (cancelled) return
        if (!project) return setResult({ projectId, state: 'not-found' })
        if (planOnly && project.kind !== 'plan') return setResult({ projectId, state: 'not-plan' })
        // Un ancien plan (sans scène) aux identifiants en double serait compté deux fois : refusé clairement.
        if (project.kind === 'plan' && !project.scene && duplicateIds([...project.document.elements, ...(project.document.levels ?? [])]).length > 0) {
          return setResult({ projectId, state: 'duplicate-ids' })
        }
        loadProject(project)
        setResult({ projectId, state: 'ready' })
      })
      .catch((error: unknown) => {
        if (!cancelled) setResult({ projectId, state: error instanceof DuplicateElementIdError ? 'duplicate-ids' : 'error' })
      })
    return () => {
      cancelled = true
      closeProject()
    }
  }, [projectId, authReady, accountKey, planOnly, loadProject, closeProject])

  if (!projectId) return 'not-found'
  if (!authReady || result?.projectId !== projectId) return 'loading'
  return result.state
}
