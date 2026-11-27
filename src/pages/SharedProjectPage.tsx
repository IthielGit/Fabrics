import { lazy, Suspense } from 'react'
import { Link } from 'react-router'
import ReadOnlySidePanel from '../components/editor/ReadOnlySidePanel'
import ReadOnlyViewer from '../components/editor/ReadOnlyViewer'
import { useComments } from '../components/editor/useComments'
import { useProjectLoader } from '../components/editor/useProjectLoader'
import { fr } from '../i18n/fr'
import PascalReadOnlyBar from '../pascal/PascalReadOnlyBar'
import { useEditorStore } from '../stores/editorStore'

// Un plan s'ouvre en lecture seule dans l'éditeur de Pascal (M19 A7) ; un Visuel garde sa page.
const PascalReadOnly = lazy(() => import('../pascal/PascalReadOnly'))

/**
 * Projet d'un autre compte ouvert en lecture seule (rôle « lecteur »). Rien n'est enregistré
 * depuis cette page : pas d'enregistrement automatique, pas de raccourcis d'édition, et la base
 * refuserait de toute façon une écriture d'un lecteur.
 */
export default function SharedProjectPage({ projectId }: { projectId: string }) {
  // Ne dépend pas du compte connecté : la lecture part tout de suite.
  const state = useProjectLoader(projectId, { waitForAuth: false })

  // M16 : un membre lecteur voit et pose des commentaires (D74) ; ni nommer ni restaurer une version.
  useComments(projectId, state === 'ready')

  if (state === 'loading') return <p className="p-8 text-slate-500">{fr.common.loading}</p>
  // Un membre lecteur voit l'historique (D73) et les commentaires (D74), sans pouvoir nommer ni restaurer.
  if (state === 'ready' && useEditorStore.getState().project?.kind === 'plan') {
    return (
      <Suspense fallback={<p className="pascal-shell p-8 text-muted-foreground">{fr.common.loading}</p>}>
        <PascalReadOnly banner={<PascalReadOnlyBar />} history comments />
      </Suspense>
    )
  }
  if (state === 'ready') {
    return <ReadOnlyViewer comments aside={<ReadOnlySidePanel canName={false} comments />} />
  }
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
