import clsx from 'clsx'
import { Eye, History, MessageSquare, PencilRuler } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { fr } from '../../i18n/fr'
import { useCommentsStore } from '../../stores/commentsStore'
import { useEditorStore } from '../../stores/editorStore'
import EditorStage from './EditorStage'
import Notice from './Notice'
import ToolHint from './ToolHint'
import ZoomControls from './ZoomControls'
import { displayProjectName } from '../../features/documents/projectName'

const ICON_BUTTON =
  'rounded-md p-2 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40'

interface ReadOnlyViewerProps {
  /** Bandeau sous l'en-tête (aperçu d'une version). */
  banner?: ReactNode
  /** Panneau de droite (historique et métrés d'un membre) ; jamais sur le lien public. */
  aside?: ReactNode
  /**
   * Commentaires (M16, lot D) : pour un membre connecté, épingles visibles et outil « Commenter ».
   * Jamais sur le lien public de partage ni dans l'aperçu d'une version.
   */
  comments?: boolean
}

/**
 * Page d'un projet Visuel déjà chargé dans l'éditeur, sans aucun outil de modification. Utilisée par
 * la page de partage public (`/s/…`), par un compte invité en lecture (`/p/…`) et par l'aperçu d'une
 * version (`/p/…/versions/…`). Les plans passent par `src/pascal/PascalReadOnly.tsx` (M19 A7).
 */
export default function ReadOnlyViewer({ banner, aside, comments = false }: ReadOnlyViewerProps = {}) {
  const [asideOpen, setAsideOpen] = useState(true)
  const activeTool = useEditorStore((state) => state.activeTool)
  const setTool = useEditorStore((state) => state.setTool)
  // Cliquer l'épingle d'un commentaire rouvre le panneau s'il a été masqué (ajustement d'état pendant le rendu).
  const selectedThreadId = useCommentsStore((state) => state.selectedThreadId)
  const [seenThreadId, setSeenThreadId] = useState(selectedThreadId)
  if (selectedThreadId !== seenThreadId) {
    setSeenThreadId(selectedThreadId)
    if (selectedThreadId) setAsideOpen(true)
  }
  const commenting = comments && activeTool === 'comment'
  const projectName = useEditorStore((state) => (state.project ? displayProjectName(state.project) : ''))

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-3">
        <Link to="/" className="flex items-center gap-2" title={fr.sharedView.madeWith}>
          <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-950 text-indigo-200">
            <PencilRuler size={14} aria-hidden="true" />
          </span>
          <span className="font-bold text-indigo-950">{fr.app.name}</span>
        </Link>
        <h1 className="min-w-0 truncate font-medium text-slate-900">{projectName}</h1>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
          <Eye size={12} aria-hidden="true" />
          {fr.sharedView.badge}
        </span>
        <div className="ml-auto flex items-center gap-1">
          {comments && (
            <button
              type="button"
              onClick={() => setTool(commenting ? 'select' : 'comment')}
              aria-pressed={commenting}
              title={`${fr.tools.comment} (C)`}
              className={clsx(
                'flex items-center gap-1.5 rounded-md px-2 py-2 text-sm hover:bg-slate-100',
                commenting ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700',
              )}
            >
              <MessageSquare size={18} aria-hidden="true" />
              {fr.tools.comment}
            </button>
          )}
          {aside && (
            <button
              type="button"
              onClick={() => setAsideOpen((value) => !value)}
              aria-pressed={asideOpen}
              title={fr.history.preview.togglePanel}
              aria-label={fr.history.preview.togglePanel}
              className={clsx(ICON_BUTTON, asideOpen && 'bg-indigo-50 text-indigo-700')}
            >
              <History size={18} />
            </button>
          )}
        </div>
      </header>
      {banner}
      <div className="flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1">
          <EditorStage readOnly showComments={comments} />
          <ZoomControls readOnly />
          <Notice />
          {comments && <ToolHint />}
        </div>
        {aside && asideOpen && aside}
      </div>
    </div>
  )
}
