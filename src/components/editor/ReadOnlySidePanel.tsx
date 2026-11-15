import clsx from 'clsx'
import { Calculator, History, MessageSquare, type LucideIcon } from 'lucide-react'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import CommentsPanel from './CommentsPanel'
import HistoryPanel from './HistoryPanel'
import MeasurementsPanel from './MeasurementsPanel'

type Tab = 'comments' | 'history' | 'measurements'

const TABS: { id: Tab; label: string; icon: LucideIcon; planOnly?: boolean; commentsOnly?: boolean }[] = [
  { id: 'comments', label: fr.sidePanel.comments, icon: MessageSquare, commentsOnly: true },
  { id: 'history', label: fr.history.preview.tabs.history, icon: History },
  { id: 'measurements', label: fr.history.preview.tabs.measurements, icon: Calculator, planOnly: true },
]

interface ReadOnlySidePanelProps {
  /** Nommer et renommer des versions (éditeurs et propriétaire). */
  canName: boolean
  /** Version affichée dans l'aperçu. */
  selectedVersionId?: string
  /** Onglet « Commentaires » (M16, lot D) : page d'un membre connecté, pas l'aperçu d'une version. */
  comments?: boolean
}

/**
 * Panneau de droite des pages en lecture seule d'un membre (M15, lot C) : historique des versions et
 * métrés du plan affiché (ceux de la version, dans un aperçu).
 */
export default function ReadOnlySidePanel({ canName, selectedVersionId, comments = false }: ReadOnlySidePanelProps) {
  const isPlan = useEditorStore((state) => state.project?.kind === 'plan')
  const projectId = useEditorStore((state) => state.project?.id)
  // Même onglet que l'éditeur (le clic sur une épingle ouvre « Commentaires » par `openThreadInPanel`).
  const tab = useEditorStore((state) => state.sidePanelTab)
  const setTab = useEditorStore((state) => state.setSidePanelTab)
  const tabs = TABS.filter((t) => (isPlan || !t.planOnly) && (comments || !t.commentsOnly))
  const fallback: Tab = comments ? 'comments' : 'history'
  const current: Tab = tabs.find((t) => t.id === tab)?.id ?? fallback

  return (
    <aside
      aria-label={fr.history.preview.panelsLabel}
      className="flex w-[min(22rem,92vw)] shrink-0 flex-col border-l border-slate-200 bg-white max-lg:fixed max-lg:inset-y-0 max-lg:right-0 max-lg:z-40 max-lg:shadow-2xl lg:w-88"
    >
      <div role="tablist" className="flex shrink-0 border-b border-slate-200">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={current === id}
            onClick={() => setTab(id)}
            className={clsx(
              'flex flex-1 flex-col items-center gap-1 border-b-2 px-1 py-2.5 text-xs font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600',
              current === id
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900',
            )}
          >
            <Icon size={16} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="min-h-0 flex-1 overflow-y-auto">
        {current === 'comments' && <CommentsPanel key={projectId} />}
        {current === 'history' && (
          <HistoryPanel key={projectId} canName={canName} selectedVersionId={selectedVersionId} />
        )}
        {current === 'measurements' && <MeasurementsPanel />}
      </div>
    </aside>
  )
}
