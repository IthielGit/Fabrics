import { showSidebarPanel } from '@pascal-app/editor'
import clsx from 'clsx'
import { ArrowLeft, Download, PanelsTopLeft, Share2 } from 'lucide-react'
import { lazy, Suspense, useState, type KeyboardEvent } from 'react'
import { Link } from 'react-router'
import CollabIndicator from '../components/editor/CollabIndicator'
import DimensioningSelector from '../components/editor/DimensioningSelector'
import PlanCheckBadge from '../components/editor/PlanCheckBadge'
import PresenceAvatars from '../components/editor/PresenceAvatars'
import SaveIndicator from '../components/editor/SaveIndicator'
import { displayProjectName } from '../features/documents/projectName'
import { useT } from '../i18n/useT'
import { useAuthStore } from '../stores/authStore'
import { useEditorStore } from '../stores/editorStore'
import { useViewsStore } from '../stores/viewsStore'

// Fenêtres chargées à l'ouverture seulement (lot Performance).
const PascalExportDialog = lazy(() => import('./PascalExportDialog'))
const ShareDialog = lazy(() => import('../components/editor/ShareDialog'))

/** Identifiant de l'onglet Métrés dans la barre latérale de Pascal (`PascalEditorPage`). */
export const METRES_TAB_ID = 'fabrics-metres'

const CONTROL =
  'inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg px-2.5 text-sm font-medium ' +
  'text-muted-foreground transition-colors hover:bg-accent hover:text-foreground ' +
  'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring'
const PRIMARY =
  'inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium ' +
  'text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
const SECONDARY =
  'inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium ' +
  'text-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/**
 * Barre du haut de l'éditeur de Pascal (M19 A3), à la place de l'en-tête de l'ancien éditeur : retour,
 * nom du projet, enregistrement, collaboration (présence, avatars), points à vérifier, cotation
 * Aucune / Client / Exécution, Vues (façades, coupes, planche), Partager et Exporter.
 */
export default function PascalNavbar({ isOwner }: { isOwner: boolean }) {
  const t = useT()
  const projectName = useEditorStore((state) => (state.project ? displayProjectName(state.project) : ''))
  const projectId = useEditorStore((state) => state.project?.id ?? null)
  const renameProject = useEditorStore((state) => state.renameProject)
  const openViews = useViewsStore((state) => state.openViews)
  const signedIn = useAuthStore((state) => state.status === 'signedIn')
  const [draftName, setDraftName] = useState<string | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  const commitName = () => {
    if (draftName !== null && draftName.trim()) renameProject(draftName.trim())
    setDraftName(null)
  }
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') event.currentTarget.blur()
    if (event.key === 'Escape') {
      setDraftName(null)
      event.currentTarget.blur()
    }
  }

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-sidebar px-2 text-foreground">
      <Link to="/" title={t('auth.backToHome')} aria-label={t('auth.backToHome')} className={clsx(CONTROL, 'w-8 px-0')}>
        <ArrowLeft size={18} aria-hidden="true" />
      </Link>
      <input
        aria-label={t('projects.nameLabel')}
        title={t('pascalEditor.renameHint')}
        value={draftName ?? projectName}
        maxLength={200}
        onFocus={(event) => {
          setDraftName(projectName)
          event.target.select()
        }}
        onChange={(event) => setDraftName(event.target.value)}
        onBlur={commitName}
        onKeyDown={onKeyDown}
        className="h-8 min-w-0 max-w-[min(32vw,24rem)] truncate rounded-lg bg-transparent px-2 text-[15px] font-semibold [field-sizing:content] hover:bg-accent focus:bg-accent focus:outline-2 focus:outline-ring"
      />
      {/* Indicateurs de Fabrics : leurs couleurs claires passent en sombre. */}
      <div className="fabrics-on-dark flex min-w-0 items-center gap-3 text-[13px]">
        <SaveIndicator />
        <CollabIndicator />
        <PresenceAvatars />
        <PlanCheckBadge onOpen={() => showSidebarPanel(METRES_TAB_ID)} />
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <div className="fabrics-on-dark">
          <DimensioningSelector />
        </div>
        <button type="button" onClick={openViews} title={t('pascalEditor.viewsHint')} className={CONTROL}>
          <PanelsTopLeft size={17} aria-hidden="true" />
          <span className="max-md:sr-only">{t('pascalEditor.views')}</span>
        </button>
        {isOwner && signedIn && (
          <button type="button" onClick={() => setShareOpen(true)} className={SECONDARY}>
            <Share2 size={16} aria-hidden="true" />
            <span className="max-sm:sr-only">{t('pascalEditor.share')}</span>
          </button>
        )}
        <button type="button" onClick={() => setExportOpen(true)} className={PRIMARY}>
          <Download size={16} aria-hidden="true" />
          <span className="max-sm:sr-only">{t('pascalEditor.export')}</span>
        </button>
      </div>
      <Suspense fallback={null}>
        {exportOpen && <PascalExportDialog onClose={() => setExportOpen(false)} />}
        {shareOpen && projectId && (
          <div className="fabrics-on-dark">
            <ShareDialog projectId={projectId} isPlan onClose={() => setShareOpen(false)} />
          </div>
        )}
      </Suspense>
    </header>
  )
}
