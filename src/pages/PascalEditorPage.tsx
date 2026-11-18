import { applySceneGraphToEditor, Editor, type SceneGraph } from '@pascal-app/editor'
import { Calculator, History, MessageSquare } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import HistoryPanel from '../components/editor/HistoryPanel'
import EditorStage from '../components/editor/EditorStage'
import MeasurementsPanel from '../components/editor/MeasurementsPanel'
import Notice from '../components/editor/Notice'
import PlanSignals from '../components/editor/PlanSignals'
import { useAutosave } from '../components/editor/useAutosave'
import { useCollaboration } from '../components/editor/useCollaboration'
import { useComments } from '../components/editor/useComments'
import { usePendingRestore } from '../components/editor/usePendingRestore'
import ViewsScreen from '../components/views/ViewsScreen'
import { commentsAvailable } from '../features/comments/commentsApi'
import { forgetCreated, peekCreated } from '../features/persistence/justCreated'
import { repository } from '../features/persistence/repository'
import type { PlanScene } from '../features/scene/sceneTypes'
import { versionsAvailable } from '../features/versions/versionsApi'
import { useT } from '../i18n/useT'
import '../pascal/bootstrap'
import PascalCommentsTab from '../pascal/PascalCommentsTab'
import PascalNavbar, { METRES_TAB_ID } from '../pascal/PascalNavbar'
import { usePascalLevelSync } from '../pascal/usePascalLevelSync'
import EditorPage from './EditorPage'
import { useAuthStore } from '../stores/authStore'
import { pushPascalScene, useEditorStore } from '../stores/editorStore'

type LoadState = 'loading' | 'ready' | 'notFound' | 'notPlan' | 'error'

interface PascalTab {
  id: string
  label: string
  icon: ReactNode
  mobileIcon: ReactNode
  component: ComponentType
}

/** Panneau de Fabrics dans la barre latérale de Pascal, ses couleurs claires passées en sombre. */
function fabricsPanel(Panel: ComponentType): ComponentType {
  return function FabricsPanel() {
    return (
      <div className="fabrics-on-dark h-full min-h-0 overflow-y-auto">
        <Panel />
      </div>
    )
  }
}

const MetresTab = fabricsPanel(MeasurementsPanel)
const HistoryTab = fabricsPanel(HistoryPanel)

/** Scène de l'éditeur de Pascal → scène d'un projet Plan (même forme : nœuds et racines). */
function toPlanScene(graph: SceneGraph): PlanScene {
  return { nodes: graph.nodes as PlanScene['nodes'], rootNodeIds: [...graph.rootNodeIds] }
}

/**
 * Éditeur de Pascal sur un projet Plan (M19 A2, `/p/:id/pascal`). Le projet est ouvert dans
 * `editorStore` comme dans l'ancien éditeur : sa scène vit dans le `Y.Doc` (local ou partagé), d'où
 * l'enregistrement automatique, la collaboration, les versions et les commentaires. Chaque
 * modification faite dans Pascal y est écrite (`pushPascalScene`) ; une scène venue d'ailleurs
 * (autre personne, version restaurée) est appliquée à Pascal.
 */
export default function PascalEditorPage({ isOwner = true }: { isOwner?: boolean }) {
  const t = useT()
  const { projectId } = useParams()
  const loadProject = useEditorStore((state) => state.loadProject)
  const closeProject = useEditorStore((state) => state.closeProject)
  const authStatus = useAuthStore((state) => state.status)
  const userId = useAuthStore((state) => state.user?.id ?? null)
  const authReady = authStatus !== 'loading'
  const [result, setResult] = useState<{ projectId: string; state: LoadState } | null>(null)
  useAutosave()

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
        if (!project) return setResult({ projectId, state: 'notFound' })
        if (project.kind !== 'plan') return setResult({ projectId, state: 'notPlan' })
        loadProject(project)
        setResult({ projectId, state: 'ready' })
      })
      .catch(() => {
        if (!cancelled) setResult({ projectId, state: 'error' })
      })
    return () => {
      cancelled = true
      closeProject()
    }
  }, [projectId, authReady, userId, loadProject, closeProject])

  const loadState: LoadState = !projectId
    ? 'notFound'
    : !authReady || result?.projectId !== projectId
      ? 'loading'
      : result.state
  const ready = loadState === 'ready'

  // Collaboration, restauration d'une version, commentaires : comme dans l'ancien éditeur.
  useCollaboration(projectId, ready)
  usePendingRestore(projectId, ready)
  useComments(projectId, ready)
  usePascalLevelSync(ready)

  // Scène venue d'ailleurs (autre personne, version restaurée, annuler) → éditeur de Pascal.
  // Celles qui viennent de Pascal lui-même sont reconnues à leur identité et ignorées.
  const fromPascal = useRef<PlanScene | null>(null)
  useEffect(() => {
    if (!ready) return
    return useEditorStore.subscribe((state, previous) => {
      const scene = state.project?.scene
      if (!scene || scene === previous.project?.scene || scene === fromPascal.current) return
      fromPascal.current = scene
      applySceneGraphToEditor(scene as unknown as SceneGraph)
    })
  }, [ready])

  const handleLoad = useCallback(async () => {
    const scene = useEditorStore.getState().project?.scene ?? null
    fromPascal.current = scene
    return scene as unknown as SceneGraph
  }, [])

  const handleSave = useCallback(
    async (graph: SceneGraph) => {
      const scene = toPlanScene(graph)
      fromPascal.current = scene
      pushPascalScene(scene)
    },
    [],
  )

  const signedIn = userId !== null
  const cloud = signedIn && versionsAvailable() && commentsAvailable()
  const sidebarTabs = useMemo<PascalTab[]>(() => {
    const tabs: PascalTab[] = [
      {
        id: METRES_TAB_ID,
        label: t('pascalEditor.tabMetres'),
        icon: <Calculator className="h-5 w-5" />,
        mobileIcon: <Calculator className="h-5 w-5" />,
        component: MetresTab,
      },
    ]
    if (cloud) {
      tabs.push(
        {
          id: 'fabrics-comments',
          label: t('pascalEditor.tabComments'),
          icon: <MessageSquare className="h-5 w-5" />,
          mobileIcon: <MessageSquare className="h-5 w-5" />,
          component: PascalCommentsTab,
        },
        {
          id: 'fabrics-history',
          label: t('pascalEditor.tabHistory'),
          icon: <History className="h-5 w-5" />,
          mobileIcon: <History className="h-5 w-5" />,
          component: HistoryTab,
        },
      )
    }
    return tabs
  }, [t, cloud])

  const projectName = useEditorStore((state) => state.project?.name ?? '')

  if (loadState === 'loading') {
    return <p className="pascal-shell p-8 text-muted-foreground">{t('common.loading')}</p>
  }
  // Un projet Visuel garde son éditeur (Konva) : même adresse `/p/:id` pour tous les projets.
  if (loadState === 'notPlan') return <EditorPage isOwner={isOwner} />
  if (loadState !== 'ready') {
    return (
      <main className="pascal-shell p-8">
        <h1 className="text-lg font-semibold">{t('pascalEditor.unavailableTitle')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {loadState === 'error' ? t('pascalEditor.loadError') : t('pascalEditor.notFound')}
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
        navbarSlot={<PascalNavbar isOwner={isOwner} />}
        projectId={projectId}
        projectName={projectName}
        sidebarTabs={sidebarTabs}
        onLoad={handleLoad}
        onSave={handleSave}
      />
      {/*
        Plan de l'ancien éditeur, hors de l'écran et en lecture seule : il sert aux exports PNG, JPG et
        PDF (cotes Client / Exécution comprises) et à la miniature, que Fabrics photographie sur ce plan.
      */}
      <div aria-hidden="true" inert className="pointer-events-none fixed top-0 h-[900px] w-[1400px]" style={{ left: -20000 }}>
        <EditorStage readOnly />
      </div>
      {/* Signaux du plan (export bloqué, surfaces à corriger…), en haut à droite, sous le bouton Split. */}
      <div className="fabrics-on-dark pointer-events-none absolute inset-x-0 bottom-0 top-14 z-40 [&_*]:pointer-events-auto">
        <PlanSignals />
      </div>
      <ViewsScreen />
      {/* Messages de Fabrics (enregistrement, export, versions) par-dessus l'éditeur. */}
      <div className="pointer-events-none absolute inset-x-0 top-14 z-50 [&>*]:pointer-events-auto">
        <Notice />
      </div>
    </div>
  )
}
