import clsx from 'clsx'
import {
  BookOpen,
  Building2,
  Calculator,
  History,
  Layers,
  MessageSquare,
  SlidersHorizontal,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import LibraryPanel from '../library/LibraryPanel'
import { commentsAvailable } from '../../features/comments/commentsApi'
import { buildThreads, countOpenThreads } from '../../features/comments/commentsLogic'
import { versionsAvailable } from '../../features/versions/versionsApi'
import { fr } from '../../i18n/fr'
import { useAuthStore } from '../../stores/authStore'
import { useCommentsStore } from '../../stores/commentsStore'
import { useEditorStore, type SidePanelTab } from '../../stores/editorStore'
import CommentsPanel from './CommentsPanel'
import HistoryPanel from './HistoryPanel'
import LayersPanel from './LayersPanel'
import LevelsPanel from './LevelsPanel'
import MeasurementsPanel from './MeasurementsPanel'
import PropertiesPanel from './PropertiesPanel'

interface TabDefinition {
  id: SidePanelTab
  label: string
  icon: LucideIcon
  planOnly?: boolean
  /** Seulement avec un compte connecté (l'historique est dans Supabase). */
  cloudOnly?: boolean
}

const TABS: TabDefinition[] = [
  { id: 'properties', label: fr.sidePanel.properties, icon: SlidersHorizontal },
  { id: 'library', label: fr.sidePanel.library, icon: BookOpen, planOnly: true },
  { id: 'levels', label: fr.sidePanel.levels, icon: Building2, planOnly: true },
  { id: 'layers', label: fr.sidePanel.layers, icon: Layers },
  { id: 'measurements', label: fr.sidePanel.measurements, icon: Calculator, planOnly: true },
  { id: 'comments', label: fr.sidePanel.comments, icon: MessageSquare, cloudOnly: true },
  { id: 'history', label: fr.sidePanel.history, icon: History, cloudOnly: true },
]

/**
 * Panneau de droite, rangé en onglets : Propriétés, Bibliothèque, Niveaux (plan), Calques, Métrés,
 * Historique (avec un compte).
 * Un seul contenu à la fois, au lieu de tous les panneaux empilés.
 */
export default function SidePanel() {
  const isPlan = useEditorStore((state) => state.project?.kind === 'plan')
  const projectId = useEditorStore((state) => state.project?.id)
  const tab = useEditorStore((state) => state.sidePanelTab)
  const setTab = useEditorStore((state) => state.setSidePanelTab)
  const selectedIds = useEditorStore((state) => state.selectedIds)
  const activeTool = useEditorStore((state) => state.activeTool)
  const open = useEditorStore((state) => state.sidePanelOpen)
  const setOpen = useEditorStore((state) => state.setSidePanelOpen)

  const signedIn = useAuthStore((state) => state.user !== null)
  const cloud = signedIn && versionsAvailable() && commentsAvailable()
  // Pastille de l'onglet « Commentaires » : fils encore ouverts.
  const comments = useCommentsStore((state) => state.comments)
  const openThreads = useMemo(() => countOpenThreads(buildThreads(comments)), [comments])
  const tabs = TABS.filter((t) => (isPlan || !t.planOnly) && (cloud || !t.cloudOnly))
  // Un onglet du plan dans un visuel (projet ouvert ensuite) : on revient aux propriétés.
  const current = tabs.some((t) => t.id === tab) ? tab : 'properties'

  // Sélectionner un élément sur le plan (outil Sélection) montre ses propriétés quand on était
  // dans la bibliothèque. Les calques et les métrés restent ouverts : on y sélectionne aussi.
  const hadSelection = useRef(false)
  useEffect(() => {
    const has = selectedIds.length > 0
    if (has && !hadSelection.current && current === 'library' && activeTool === 'select') {
      setTab('properties')
    }
    hadSelection.current = has
  }, [selectedIds, current, activeTool, setTab])

  // Sur grand écran le panneau est fixe ; en dessous il devient un tiroir par-dessus le plan.
  return (
    <>
      {open && (
        <button
          type="button"
          aria-label={fr.sidePanel.close}
          tabIndex={-1}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden"
        />
      )}
    <aside
      className={clsx(
        // Largeur : 22rem de contenu + 3.25rem de rail d'onglets (M15 bis, lot D).
        'shrink-0 flex-row border-l border-slate-200 bg-white lg:flex lg:w-[25.25rem]',
        open
          ? 'fixed inset-y-0 right-0 z-40 flex w-[min(25.25rem,92vw)] shadow-2xl lg:static lg:z-auto lg:shadow-none'
          : 'hidden',
      )}
    >
      <div role="tabpanel" aria-label={tabs.find((t) => t.id === current)?.label} className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        {current === 'properties' && <PropertiesPanel />}
        {current === 'library' && <LibraryPanel />}
        {current === 'levels' && <LevelsPanel />}
        {current === 'layers' && <LayersPanel />}
        {current === 'measurements' && <MeasurementsPanel />}
        {current === 'comments' && <CommentsPanel key={projectId} />}
        {current === 'history' && <HistoryPanel key={projectId} />}
      </div>
      {/* Onglets en colonne d'icônes, à droite (M15 bis, lot D) : le nom apparaît au survol. */}
      <div
        role="tablist"
        aria-label={fr.sidePanel.label}
        aria-orientation="vertical"
        className="flex w-13 shrink-0 flex-col items-center gap-1 border-l border-slate-200 bg-slate-50 py-2.5"
      >
        <button
          type="button"
          aria-label={fr.sidePanel.close}
          title={fr.sidePanel.close}
          onClick={() => setOpen(false)}
          className="mb-1 flex size-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-200 lg:hidden"
        >
          <X size={18} aria-hidden="true" />
        </button>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={current === id}
            aria-label={label}
            onClick={() => setTab(id)}
            className={clsx(
              'group relative flex size-9 items-center justify-center rounded-lg pointer-coarse:size-11',
              'transition-colors duration-150 ease-out',
              'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-600',
              current === id
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900',
            )}
          >
            <Icon size={18} aria-hidden="true" />
            {id === 'comments' && openThreads > 0 && (
              <span
                aria-label={fr.comments.openBadge(openThreads)}
                className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold leading-4 text-white"
              >
                {openThreads > 99 ? '99+' : openThreads}
              </span>
            )}
            <span
              aria-hidden="true"
              className={clsx(
                'pointer-events-none absolute right-full top-1/2 z-50 mr-2 -translate-y-1/2 whitespace-nowrap',
                'rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow',
                'transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100',
              )}
            >
              {label}
            </span>
          </button>
        ))}
      </div>
    </aside>
    </>
  )
}
