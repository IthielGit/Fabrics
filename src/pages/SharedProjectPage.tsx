import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import ReadOnlyViewer from '../components/editor/ReadOnlyViewer'
import { repository } from '../features/persistence/repository'
import { fr } from '../i18n/fr'
import { useEditorStore } from '../stores/editorStore'

type LoadState = 'loading' | 'ready' | 'not-found' | 'error'

/**
 * Projet d'un autre compte ouvert en lecture seule (rôle « lecteur »). Rien n'est enregistré
 * depuis cette page : pas d'enregistrement automatique, pas de raccourcis d'édition, et la base
 * refuserait de toute façon une écriture d'un lecteur.
 */
export default function SharedProjectPage({ projectId }: { projectId: string }) {
  const loadProject = useEditorStore((state) => state.loadProject)
  const closeProject = useEditorStore((state) => state.closeProject)
  const [result, setResult] = useState<{ projectId: string; state: LoadState } | null>(null)

  useEffect(() => {
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

  const state: LoadState = result?.projectId === projectId ? result.state : 'loading'

  if (state === 'loading') return <p className="p-8 text-slate-500">{fr.common.loading}</p>
  if (state === 'ready') return <ReadOnlyViewer />
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">{fr.editor.notFoundTitle}</h1>
      <p className="mt-2 text-slate-600">{state === 'error' ? fr.editor.loadError : fr.editor.notFoundText}</p>
      <Link to="/" className="mt-4 inline-block text-indigo-600 underline">
        {fr.editor.backToHome}
      </Link>
    </main>
  )
}
