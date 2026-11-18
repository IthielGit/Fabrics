import { Editor, type SceneGraph } from '@pascal-app/editor'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { forgetCreated, peekCreated } from '../features/persistence/justCreated'
import { repository } from '../features/persistence/repository'
import { planToScene, viewOfScene } from '../features/scene/sceneBinding'
import type { PlanScene } from '../features/scene/sceneTypes'
import { useT } from '../i18n/useT'
import '../pascal/bootstrap'
import { useAuthStore } from '../stores/authStore'
import type { Project } from '../types/document'

type State = { kind: 'loading' } | { kind: 'notFound' } | { kind: 'notPlan' } | { kind: 'error' } | { kind: 'ready'; project: Project; scene: PlanScene }

/**
 * Éditeur de Pascal sur un vrai projet Plan (M19 A2a, essai à `/p/:id/pascal`) : la scène du projet
 * est chargée dans l'éditeur de Pascal, et chaque modification est enregistrée dans le projet.
 * Collaboration, commentaires, historique et métrés : étapes A2b à A2d.
 */
export default function PascalEditorPage() {
  const t = useT()
  const { projectId } = useParams()
  const authStatus = useAuthStore((state) => state.status)
  const authReady = authStatus !== 'loading'
  const [state, setState] = useState<{ projectId: string; value: State } | null>(null)
  const projectRef = useRef<Project | null>(null)

  useEffect(() => {
    document.body.classList.add('dark', 'pascal-tokens')
    return () => document.body.classList.remove('dark', 'pascal-tokens')
  }, [])

  useEffect(() => {
    if (!projectId || !authReady) return
    let cancelled = false
    const justCreated = peekCreated(projectId)
    const load = justCreated ? Promise.resolve(justCreated) : repository.get(projectId)
    if (justCreated) forgetCreated(projectId)
    load
      .then((project) => {
        if (cancelled) return
        if (!project) return setState({ projectId, value: { kind: 'notFound' } })
        if (project.kind !== 'plan') return setState({ projectId, value: { kind: 'notPlan' } })
        const scene = project.scene ?? planToScene(project.document)
        projectRef.current = project
        setState({ projectId, value: { kind: 'ready', project, scene } })
      })
      .catch(() => {
        if (!cancelled) setState({ projectId, value: { kind: 'error' } })
      })
    return () => {
      cancelled = true
    }
  }, [projectId, authReady])

  const current: State = state && state.projectId === projectId ? state.value : { kind: 'loading' }
  const scene = current.kind === 'ready' ? current.scene : null

  const handleLoad = useCallback(async () => scene as unknown as SceneGraph, [scene])

  const handleSave = useCallback(async (graph: SceneGraph) => {
    const project = projectRef.current
    if (!project) return
    const nextScene: PlanScene = { nodes: graph.nodes as PlanScene['nodes'], rootNodeIds: [...graph.rootNodeIds] }
    const next: Project = {
      ...project,
      scene: nextScene,
      document: viewOfScene(nextScene, project.document),
      updatedAt: new Date().toISOString(),
    }
    await repository.save(next)
    projectRef.current = next
  }, [])

  if (current.kind === 'loading') {
    return <p className="pascal-shell p-8 text-muted-foreground">{t('common.loading')}</p>
  }
  if (current.kind !== 'ready') {
    return (
      <main className="pascal-shell p-8">
        <h1 className="text-lg font-semibold">{t('pascalEditor.unavailableTitle')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {current.kind === 'notPlan'
            ? t('pascalEditor.notPlan')
            : current.kind === 'error'
              ? t('pascalEditor.loadError')
              : t('pascalEditor.notFound')}
        </p>
        <Link to="/" className="mt-4 inline-block text-sm underline">
          {t('auth.backToHome')}
        </Link>
      </main>
    )
  }

  return (
    <div className="dark pascal-tokens relative h-screen w-screen">
      <Editor
        layoutVersion="v2"
        projectId={current.project.id}
        projectName={current.project.name}
        onLoad={handleLoad}
        onSave={handleSave}
      />
    </div>
  )
}
