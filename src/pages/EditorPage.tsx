import { useEffect } from 'react'
import { Link, useParams } from 'react-router'
import EditorHeader from '../components/editor/EditorHeader'
import EditorStage from '../components/editor/EditorStage'
import MiniMap from '../components/editor/MiniMap'
import ScrollBars from '../components/editor/ScrollBars'
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
import { useProjectLoader } from '../components/editor/useProjectLoader'
import ZoomControls from '../components/editor/ZoomControls'
import { fr } from '../i18n/fr'

interface EditorPageProps {
  /** Faux pour un éditeur invité : il n'a pas le bouton « Partager ». */
  isOwner?: boolean
}

export default function EditorPage({ isOwner = true }: EditorPageProps) {
  const { projectId } = useParams()
  useEditorShortcuts()
  useAutosave()
  // M19 A4 : l'éditeur Visuel porte les couleurs de Pascal (thème sombre) ; sur <body> aussi, pour les
  // menus et fenêtres affichés hors de la page.
  useEffect(() => {
    const classes = ['dark', 'pascal-tokens', 'fabrics-on-dark']
    document.body.classList.add(...classes)
    return () => document.body.classList.remove(...classes)
  }, [])
  // Les projets ne sont lus qu'une fois la session connue (local ou compte), et relus si le compte change.
  const loadState = useProjectLoader(projectId)

  // M14 : collaboration temps réel une fois le projet chargé (sans effet en mode local).
  useCollaboration(projectId, loadState === 'ready')
  // M15 : restauration demandée depuis l'aperçu d'une version.
  usePendingRestore(projectId, loadState === 'ready')
  // M16 : commentaires du projet (avec un compte connecté).
  useComments(projectId, loadState === 'ready')

  if (loadState === 'loading') {
    return <p className="pascal-shell p-8 text-muted-foreground">{fr.common.loading}</p>
  }

  if (loadState !== 'ready') {
    return (
      <main className="pascal-shell p-8">
        <h1 className="text-2xl font-bold">{fr.editor.notFoundTitle}</h1>
        <p className="mt-2 text-muted-foreground">
          {loadState === 'error' ? fr.editor.loadError : fr.editor.notFoundText}
        </p>
        <Link to="/" className="mt-4 inline-block underline">
          {fr.editor.backToHome}
        </Link>
      </main>
    )
  }

  return (
    <div className="fabrics-on-dark pascal-tokens dark flex h-screen w-screen flex-col overflow-hidden bg-white text-slate-900">
      <EditorHeader isOwner={isOwner} />
      <div className="flex min-h-0 flex-1">
        {/* M15 bis : rail d'outils collé au bord gauche, hors du canevas. */}
        <Toolbar />
        {/* @container : les barres du bas se rangent selon la largeur du plan (M15 bis, lot D). */}
        <div className="@container relative min-w-0 flex-1">
          <EditorStage />
          {/* En haut de la page : options de l'outil en cours (seulement s'il en a). */}
          <div className="pointer-events-none absolute left-3 right-3 top-3 z-10 flex flex-col items-start gap-2">
            <ToolModeBar />
          </div>
          <ZoomControls />
          <MiniMap />
          <ScrollBars />
          <Notice />
          <ToolHint />
        </div>
        <SidePanel />
      </div>
      <ShortcutsDialog />
    </div>
  )
}
