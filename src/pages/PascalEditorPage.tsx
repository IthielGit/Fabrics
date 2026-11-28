import { applySceneGraphToEditor, Editor, showSidebarPanel, type SceneGraph } from '@pascal-app/editor'
import { EditorViewerToolbarLeft, EditorViewerToolbarRight } from '@pascal-app-host/viewer-toolbar'
import { Calculator, Coins, History, ListChecks, MessageSquare, ScrollText } from 'lucide-react'
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { Link, useParams } from 'react-router'
import HistoryPanel from '../components/editor/HistoryPanel'
import ControlsPanel from '../components/editor/ControlsPanel'
import MeasurementsPanel from '../components/editor/MeasurementsPanel'
import ProjectJournalPanel from '../components/editor/ProjectJournalPanel'
import DqePanel from '../components/pricing/DqePanel'
import Notice from '../components/editor/Notice'
import PlanSignals from '../components/editor/PlanSignals'
import RescueBanner from '../components/editor/RescueBanner'
import { useAutosave } from '../components/editor/useAutosave'
import { useCollaboration } from '../components/editor/useCollaboration'
import { useComments } from '../components/editor/useComments'
import { usePendingRestore } from '../components/editor/usePendingRestore'
import { useProjectLoader } from '../components/editor/useProjectLoader'
import { commentsAvailable } from '../features/comments/commentsApi'
import type { PlanScene } from '../features/scene/sceneTypes'
import { versionsAvailable } from '../features/versions/versionsApi'
import { useT } from '../i18n/useT'
import '../pascal/bootstrap'
import type { WebXRFeature } from '../pascal/PascalWebXR'
import PascalCommentsTab from '../pascal/PascalCommentsTab'
import PascalNavbar, { CONTROLS_TAB_ID, METRES_TAB_ID } from '../pascal/PascalNavbar'
import { pascalTabs, type PascalTab } from '../pascal/pascalTabs'
import { usePascalLevelSync } from '../pascal/usePascalLevelSync'
import { usePascalThumbnail } from '../pascal/usePascalThumbnail'
import { useWebXRInstalled } from '../pascal/useWebXRInstalled'
import { EditorPage } from './lazyPages'
import { useAuthStore } from '../stores/authStore'
import { pushPascalScene, useEditorStore } from '../stores/editorStore'
import { useViewsStore } from '../stores/viewsStore'

// Façades, coupes et planche : chargées quand on ouvre les Vues (lot Performance).
const ViewsScreen = lazy(() => import('../components/views/ViewsScreen'))

// Réalité virtuelle (A6) : chargée seulement quand le module WebXR est installé dans le projet.
const PascalWebXRRuntime = lazy(() => import('../pascal/PascalWebXR'))
const PascalVrButton = lazy(() => import('../pascal/PascalWebXR').then((m) => ({ default: m.PascalVrButton })))


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

const ControlsTab = fabricsPanel(ControlsPanel)
const MetresTab = fabricsPanel(() => <MeasurementsPanel onOpenControls={() => showSidebarPanel(CONTROLS_TAB_ID)} />)
const HistoryTab = fabricsPanel(HistoryPanel)
const DqeTab = fabricsPanel(DqePanel)
const JournalTab = fabricsPanel(ProjectJournalPanel)

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
  const userId = useAuthStore((state) => state.user?.id ?? null)
  useAutosave()

  useEffect(() => {
    document.body.classList.add('dark', 'pascal-tokens')
    return () => document.body.classList.remove('dark', 'pascal-tokens')
  }, [])

  // Un projet Visuel ouvert à cette adresse garde son éditeur (`not-plan`).
  const loadState = useProjectLoader(projectId, { planOnly: true })
  const ready = loadState === 'ready'

  // Collaboration, restauration d'une version, commentaires : comme dans l'ancien éditeur.
  useCollaboration(projectId, ready)
  usePendingRestore(projectId, ready)
  useComments(projectId, ready)
  usePascalLevelSync(ready)
  const handleThumbnail = usePascalThumbnail(projectId, ready)
  const viewsOpen = useViewsStore((state) => state.open)
  const webXRInstalled = useWebXRInstalled()
  const [vr, setVr] = useState<WebXRFeature | null>(null)

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
      {
        id: CONTROLS_TAB_ID,
        label: t('pascalEditor.tabControls'),
        icon: <ListChecks className="h-5 w-5" />,
        mobileIcon: <ListChecks className="h-5 w-5" />,
        component: ControlsTab,
      },
      {
        id: 'fabrics-dqe',
        label: t('pascalEditor.tabDqe'),
        icon: <Coins className="h-5 w-5" />,
        mobileIcon: <Coins className="h-5 w-5" />,
        component: DqeTab,
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
      if (isOwner) {
        tabs.push({
          id: 'fabrics-journal',
          label: t('pascalEditor.tabJournal'),
          icon: <ScrollText className="h-5 w-5" />,
          mobileIcon: <ScrollText className="h-5 w-5" />,
          component: JournalTab,
        })
      }
    }
    const { leading, trailing } = pascalTabs(t)
    return [...leading, ...tabs, ...trailing]
  }, [t, cloud, isOwner])

  const projectName = useEditorStore((state) => state.project?.name ?? '')

  if (loadState === 'loading') {
    return <p className="pascal-shell p-8 text-muted-foreground">{t('common.loading')}</p>
  }
  // Un projet Visuel garde son éditeur (Konva) : même adresse `/p/:id` pour tous les projets.
  if (loadState === 'not-plan') return <EditorPage isOwner={isOwner} />
  if (loadState !== 'ready') {
    return (
      <main className="pascal-shell p-8">
        <h1 className="text-lg font-semibold">{t('pascalEditor.unavailableTitle')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {loadState === 'duplicate-ids'
            ? t('pascalEditor.duplicateIds')
            : loadState === 'error'
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
        navbarSlot={<PascalNavbar isOwner={isOwner} />}
        projectId={projectId}
        projectName={projectName}
        sidebarTabs={sidebarTabs}
        viewerToolbarLeft={<EditorViewerToolbarLeft />}
        viewerToolbarRight={
          <EditorViewerToolbarRight
            vrLabel={t('pascalEditor.enterVr')}
            vrButton={
              vr ? (
                <Suspense fallback={null}>
                  <PascalVrButton feature={vr} />
                </Suspense>
              ) : null
            }
          />
        }
        immersive={vr?.session ? vr.immersive : undefined}
        onLoad={handleLoad}
        onSave={handleSave}
        onThumbnailCapture={handleThumbnail}
      />
      {/* Signaux du plan (export bloqué, surfaces à corriger…), en haut à droite, sous le bouton Split. */}
      <div className="fabrics-on-dark pointer-events-none absolute inset-x-0 bottom-0 top-14 z-40 [&_*]:pointer-events-auto">
        <PlanSignals />
      </div>
      {webXRInstalled && (
        <Suspense fallback={null}>
          <PascalWebXRRuntime onFeature={setVr} />
        </Suspense>
      )}
      {viewsOpen && (
        <Suspense fallback={null}>
          <ViewsScreen />
        </Suspense>
      )}
      {/* Messages de Fabrics (enregistrement, export, versions) par-dessus l'éditeur. */}
      <div className="pointer-events-none absolute inset-x-0 top-14 z-50 [&>*]:pointer-events-auto">
        <Notice />
        <RescueBanner />
      </div>
    </div>
  )
}
