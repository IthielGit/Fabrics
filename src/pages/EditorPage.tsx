import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import EditorHeader from '../components/editor/EditorHeader'
import EditorStage from '../components/editor/EditorStage'
import LayersPanel from '../components/editor/LayersPanel'
import MeasurementsPanel from '../components/editor/MeasurementsPanel'
import Notice from '../components/editor/Notice'
import PropertiesPanel from '../components/editor/PropertiesPanel'
import ToolHint from '../components/editor/ToolHint'
import Toolbar from '../components/editor/Toolbar'
import { useAutosave } from '../components/editor/useAutosave'
import { useEditorShortcuts } from '../components/editor/useEditorShortcuts'
import ZoomControls from '../components/editor/ZoomControls'
import { repository } from '../features/persistence/repository'
import { fr } from '../i18n/fr'
import { useEditorStore } from '../stores/editorStore'

type LoadState = 'loading' | 'ready' | 'not-found' | 'error'

export default function EditorPage() {
  const { projectId } = useParams()
  const loadProject = useEditorStore((state) => state.loadProject)
  const closeProject = useEditorStore((state) => state.closeProject)
  useEditorShortcuts()
  useAutosave()
  // Résultat du chargement, associé au projet demandé : tant qu'il ne correspond pas
  // à l'adresse courante, on est en « chargement » (rien à remettre à zéro dans l'effet).
  const [result, setResult] = useState<{ projectId: string; state: LoadState } | null>(null)

  useEffect(() => {
    if (!projectId) return
    let cancelled = false
    repository
      .get(projectId)
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
  }, [projectId, loadProject, closeProject])

  const loadState: LoadState = !projectId
    ? 'not-found'
    : result?.projectId === projectId
      ? result.state
      : 'loading'

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
      <EditorHeader />
      <div className="flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1">
          <EditorStage />
          <Toolbar />
          <ZoomControls />
          <Notice />
          <ToolHint />
        </div>
        <aside className="w-72 shrink-0 overflow-y-auto border-l border-slate-200 bg-white">
          <PropertiesPanel />
          <LayersPanel />
          <MeasurementsPanel />
        </aside>
      </div>
    </div>
  )
}
