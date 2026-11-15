import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import EditorHeader from '../components/editor/EditorHeader'
import EmptyPlanCard from '../components/editor/EmptyPlanCard'
import LiveMetresBar from '../components/editor/LiveMetresBar'
import EditorStage from '../components/editor/EditorStage'
import PlanContextBar from '../components/editor/PlanContextBar'
import MiniMap from '../components/editor/MiniMap'
import ScrollBars from '../components/editor/ScrollBars'
import PlanSignals from '../components/editor/PlanSignals'
import Notice from '../components/editor/Notice'
import ShortcutsDialog from '../components/editor/ShortcutsDialog'
import SidePanel from '../components/editor/SidePanel'
import ToolHint from '../components/editor/ToolHint'
import ToolModeBar from '../components/editor/ToolModeBar'
import Toolbar from '../components/editor/Toolbar'
import { useAutosave } from '../components/editor/useAutosave'
import { useCollaboration } from '../components/editor/useCollaboration'
import { useComments } from '../components/editor/useComments'
import { useEditorShortcuts } from '../components/editor/useEditorShortcuts'
import { usePendingRestore } from '../components/editor/usePendingRestore'
import ZoomControls from '../components/editor/ZoomControls'
import ViewsScreen from '../components/views/ViewsScreen'
import Viewer3DPanel from '../components/viewer3d/Viewer3DPanel'
import { forgetCreated, peekCreated } from '../features/persistence/justCreated'
import { repository } from '../features/persistence/repository'
import { fr } from '../i18n/fr'
import { useAuthStore } from '../stores/authStore'
import { useEditorStore } from '../stores/editorStore'

type LoadState = 'loading' | 'ready' | 'not-found' | 'error'

interface EditorPageProps {
  /** Faux pour un éditeur invité : il n'a pas le bouton « Partager ». */
  isOwner?: boolean
}

export default function EditorPage({ isOwner = true }: EditorPageProps) {
  const { projectId } = useParams()
  const loadProject = useEditorStore((state) => state.loadProject)
  const closeProject = useEditorStore((state) => state.closeProject)
  useEditorShortcuts()
  useAutosave()
  // Résultat du chargement, associé au projet demandé : tant qu'il ne correspond pas
  // à l'adresse courante, on est en « chargement » (rien à remettre à zéro dans l'effet).
  const [result, setResult] = useState<{ projectId: string; state: LoadState } | null>(null)

  // Les projets ne sont lus qu'une fois la session connue (local ou compte), et relus si le compte change.
  const authStatus = useAuthStore((state) => state.status)
  const userId = useAuthStore((state) => state.user?.id ?? null)
  const authReady = authStatus !== 'loading'

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
        if (!project) {
          setResult({ projectId, state: 'not-found' })
          return
        }
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
    ? 'not-found'
    : !authReady
      ? 'loading'
      : result?.projectId === projectId
      ? result.state
      : 'loading'

  // M14 : collaboration temps réel une fois le projet chargé (sans effet en mode local).
  useCollaboration(projectId, loadState === 'ready')
  // M15 : restauration demandée depuis l'aperçu d'une version.
  usePendingRestore(projectId, loadState === 'ready')
  // M16 : commentaires du projet (avec un compte connecté).
  useComments(projectId, loadState === 'ready')

  if (loadState === 'loading') {
    return <p className="p-8 text-slate-500">{fr.common.loading}</p>
  }

  if (loadState !== 'ready') {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold">{fr.editor.notFoundTitle}</h1>
        <p className="mt-2 text-slate-600">
          {loadState === 'error' ? fr.editor.loadError : fr.editor.notFoundText}
        </p>
        <Link to="/" className="mt-4 inline-block text-indigo-600 underline">
          {fr.editor.backToHome}
        </Link>
      </main>
    )
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      <EditorHeader isOwner={isOwner} />
      <div className="flex min-h-0 flex-1">
        {/* M15 bis : rail d'outils collé au bord gauche, hors du canevas. */}
        <Toolbar />
        {/* @container : les barres du bas se rangent selon la largeur du plan (M15 bis, lot D). */}
        <div className="@container relative min-w-0 flex-1">
          <EditorStage />
          <EmptyPlanCard />
          {/* En haut du plan : ligne 1 = niveau affiché et cotation ; ligne 2 = options de l'outil en cours (seulement s'il en a). */}
          <div className="pointer-events-none absolute left-3 right-3 top-3 z-10 flex flex-col items-start gap-2">
            <div className="flex w-full flex-wrap items-start gap-2">
              <PlanContextBar />
            </div>
            <ToolModeBar />
          </div>
          <ZoomControls />
          <LiveMetresBar />
          <MiniMap />
          <ScrollBars />
          <PlanSignals />
          <Notice />
          <ToolHint />
        </div>
        <Viewer3DPanel />
        <SidePanel />
      </div>
      <ViewsScreen />
      <ShortcutsDialog />
    </div>
  )
}
