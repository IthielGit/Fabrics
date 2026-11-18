import clsx from 'clsx'
import {
  ArrowLeft,
  Box,
  Download,
  MessageSquare,
  PanelRight,
  PanelsTopLeft,
  Redo2,
  Share2,
  Undo2,
} from 'lucide-react'
import { useMemo, useState, type KeyboardEvent } from 'react'
import { Link } from 'react-router'
import { commentsAvailable } from '../../features/comments/commentsApi'
import { buildThreads, countOpenThreads } from '../../features/comments/commentsLogic'
import { versionsAvailable } from '../../features/versions/versionsApi'
import { fr } from '../../i18n/fr'
import { useAuthStore } from '../../stores/authStore'
import { useCollabStore } from '../../stores/collabStore'
import { useCommentsStore } from '../../stores/commentsStore'
import { useEditorStore } from '../../stores/editorStore'
import { useViewer3DStore } from '../../stores/viewer3dStore'
import { useViewsStore } from '../../stores/viewsStore'
import Button from '../ui/Button'
import ExportDialog from './ExportDialog'
import PlanCheckBadge from './PlanCheckBadge'
import CollabIndicator from './CollabIndicator'
import PresenceAvatars from './PresenceAvatars'
import SaveIndicator from './SaveIndicator'
import ShareDialog from './ShareDialog'
import { displayProjectName } from '../../features/documents/projectName'

/** Base commune des boutons de l'en-tête : 32 px de haut, même arrondi que les barres du plan. */
const HEADER_CONTROL =
  'inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg text-sm font-medium text-slate-700 ' +
  'transition-colors duration-150 ease-out hover:bg-slate-100 hover:text-slate-900 pointer-coarse:h-11 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-600 ' +
  'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent'
const ICON_BUTTON = clsx(HEADER_CONTROL, 'w-8 pointer-coarse:w-11')
const TEXT_BUTTON = clsx(HEADER_CONTROL, 'px-2.5')
const PRESSED = 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800'
const DIVIDER = 'mx-1.5 h-5 w-px shrink-0 bg-slate-200'
/** Partager et Exporter : boutons pleins ou bordés, à la même hauteur que le reste. */
const ACTION_BUTTON = 'h-8 rounded-lg px-3 py-0 pointer-coarse:h-11'

interface EditorHeaderProps {
  /** Seul le propriétaire du projet partage et invite ; un éditeur invité n'a pas le bouton. */
  isOwner?: boolean
}

/**
 * En-tête de l'éditeur, en trois groupes : à gauche le projet (retour, nom, état), à droite
 * l'historique (annuler, rétablir), les vues (3D, Vues) puis les actions (Commentaires, Partager,
 * Exporter en principal).
 */
export default function EditorHeader({ isOwner = true }: EditorHeaderProps) {
  const projectName = useEditorStore((state) => (state.project ? displayProjectName(state.project) : ''))
  // Collaboration ouverte (M14) : annuler / rétablir ne concernent que ses propres modifications.
  const collabActive = useCollabStore((state) => state.active)
  const collabCanUndo = useCollabStore((state) => state.canUndo)
  const collabCanRedo = useCollabStore((state) => state.canRedo)
  // Projet Plan (M18) : historique de la scène ; projet Visuel : historique local.
  const localCanUndo = useEditorStore((state) => state.history.past.length > 0 || state.sceneHistory.canUndo)
  const localCanRedo = useEditorStore((state) => state.history.future.length > 0 || state.sceneHistory.canRedo)
  const canUndo = collabActive ? collabCanUndo : localCanUndo
  const canRedo = collabActive ? collabCanRedo : localCanRedo
  const renameProject = useEditorStore((state) => state.renameProject)
  const undo = useEditorStore((state) => state.undo)
  const redo = useEditorStore((state) => state.redo)
  const isPlan = useEditorStore((state) => state.project?.kind === 'plan')
  const viewer3DOpen = useViewer3DStore((state) => state.open)
  const toggleViewer3D = useViewer3DStore((state) => state.toggleOpen)
  const openViews = useViewsStore((state) => state.openViews)
  const setSidePanelOpen = useEditorStore((state) => state.setSidePanelOpen)
  const sidePanelTab = useEditorStore((state) => state.sidePanelTab)
  const setSidePanelTab = useEditorStore((state) => state.setSidePanelTab)

  // Pendant la saisie on garde un brouillon ; le nom n'est validé qu'à la sortie du champ.
  const [draftName, setDraftName] = useState<string | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  // Le partage passe par le compte : il faut être connecté (lien public : plans seulement ; invitations : tout projet).
  const projectId = useEditorStore((state) => state.project?.id ?? null)
  const signedIn = useAuthStore((state) => state.status === 'signedIn')

  // Commentaires (M16) : bouton avec le nombre de fils ouverts ; il ouvre l'onglet du panneau.
  // Mêmes conditions que l'onglet « Commentaires » du panneau (compte connecté, services en ligne).
  const canComment = signedIn && versionsAvailable() && commentsAvailable()
  const comments = useCommentsStore((state) => state.comments)
  const openThreads = useMemo(() => countOpenThreads(buildThreads(comments)), [comments])
  const commentsShown = sidePanelTab === 'comments'

  const commitName = () => {
    if (draftName !== null && draftName.trim()) renameProject(draftName.trim())
    setDraftName(null) // un nom vide est refusé : on revient au nom précédent
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') event.currentTarget.blur()
    if (event.key === 'Escape') {
      setDraftName(null)
      event.currentTarget.blur()
    }
  }

  return (
    <header className="flex h-12 shrink-0 items-center gap-1 border-b border-slate-200 bg-white px-2 sm:px-3">
      {/* Projet : retour, nom (modifiable sur place), état d'enregistrement et de collaboration. */}
      <Link to="/" title={fr.editor.backToHome} aria-label={fr.editor.backToHome} className={ICON_BUTTON}>
        <ArrowLeft size={18} aria-hidden="true" />
      </Link>

      <input
        aria-label={fr.projects.nameLabel}
        title={fr.editor.renameHint}
        value={draftName ?? projectName}
        maxLength={200}
        onFocus={(event) => {
          setDraftName(projectName)
          event.target.select()
        }}
        onChange={(event) => setDraftName(event.target.value)}
        onBlur={commitName}
        onKeyDown={handleKeyDown}
        className={clsx(
          'h-8 min-w-0 flex-1 truncate rounded-lg px-2 text-[15px] font-semibold text-slate-900',
          'sm:flex-none sm:field-sizing-content sm:min-w-28 sm:max-w-[min(40vw,28rem)]',
          'transition-colors duration-150 ease-out hover:bg-slate-100',
          'focus:bg-white focus:outline-2 focus:outline-offset-0 focus:outline-indigo-600',
        )}
      />

      <div className="flex min-w-0 items-center gap-3 pl-1 text-[13px]">
        <SaveIndicator />
        <CollabIndicator />
        <PresenceAvatars />
        <PlanCheckBadge />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-0.5">
        {/* Historique. */}
        <button
          type="button"
          onClick={undo}
          disabled={!canUndo}
          title={`${fr.editor.undo} (Ctrl+Z)`}
          aria-label={fr.editor.undo}
          className={ICON_BUTTON}
        >
          <Undo2 size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={redo}
          disabled={!canRedo}
          title={`${fr.editor.redo} (Ctrl+Maj+Z)`}
          aria-label={fr.editor.redo}
          className={ICON_BUTTON}
        >
          <Redo2 size={18} aria-hidden="true" />
        </button>

        {/* Vues du plan. */}
        {isPlan && <span className={clsx(DIVIDER, 'max-sm:hidden')} aria-hidden="true" />}
        {isPlan && (
          <button
            type="button"
            onClick={toggleViewer3D}
            aria-pressed={viewer3DOpen}
            title={viewer3DOpen ? fr.viewer3d.close : fr.viewer3d.open}
            aria-label={viewer3DOpen ? fr.viewer3d.close : fr.viewer3d.open}
            className={clsx(TEXT_BUTTON, 'max-md:w-8 max-md:px-0', viewer3DOpen && PRESSED)}
          >
            <Box size={18} aria-hidden="true" />
            <span className="max-md:sr-only">{fr.viewer3d.shortLabel}</span>
          </button>
        )}
        {isPlan && (
          <button
            type="button"
            onClick={openViews}
            title={fr.views.open}
            aria-label={fr.views.open}
            className={clsx(TEXT_BUTTON, 'max-md:w-8 max-md:px-0')}
          >
            <PanelsTopLeft size={18} aria-hidden="true" />
            <span className="max-md:sr-only">{fr.views.openLabel}</span>
          </button>
        )}

        {/* Actions sur le projet. */}
        <span className={clsx(DIVIDER, 'max-sm:hidden')} aria-hidden="true" />
        {canComment && (
          <button
            type="button"
            onClick={() => {
              setSidePanelTab('comments')
              setSidePanelOpen(true)
            }}
            aria-pressed={commentsShown}
            title={openThreads > 0 ? fr.comments.headerButtonCount(openThreads) : fr.comments.headerButton}
            aria-label={openThreads > 0 ? fr.comments.headerButtonCount(openThreads) : fr.comments.headerButton}
            className={clsx(HEADER_CONTROL, 'mr-1 px-2', commentsShown && PRESSED)}
          >
            <MessageSquare size={18} aria-hidden="true" />
            {openThreads > 0 && (
              <span
                aria-hidden="true"
                className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-indigo-600 px-1 text-[11px] font-semibold leading-none text-white tabular-nums"
              >
                {openThreads > 99 ? '99+' : openThreads}
              </span>
            )}
          </button>
        )}
        {isOwner && signedIn && (
          <Button onClick={() => setShareOpen(true)} className={clsx(ACTION_BUTTON, 'mr-1.5')} aria-label={fr.share.open}>
            <Share2 size={16} aria-hidden="true" />
            <span className="max-sm:sr-only">{fr.share.open}</span>
          </Button>
        )}
        <Button variant="primary" onClick={() => setExportOpen(true)} className={ACTION_BUTTON} aria-label={fr.export.open}>
          <Download size={16} aria-hidden="true" />
          <span className="max-sm:sr-only">{fr.export.open}</span>
        </Button>

        {/* Petit écran : le panneau de droite devient un tiroir, ouvert par ce bouton, du même côté. */}
        <button
          type="button"
          onClick={() => setSidePanelOpen(true)}
          title={fr.sidePanel.open}
          aria-label={fr.sidePanel.open}
          className={clsx(ICON_BUTTON, 'ml-1 lg:hidden')}
        >
          <PanelRight size={18} aria-hidden="true" />
        </button>
      </div>
      {exportOpen && <ExportDialog onClose={() => setExportOpen(false)} />}
      {shareOpen && projectId && (
        <ShareDialog projectId={projectId} isPlan={isPlan} onClose={() => setShareOpen(false)} />
      )}
    </header>
  )
}
