import clsx from 'clsx'
import { MessageSquare, Plus } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { colorForUser } from '../../features/collab/presence'
import {
  buildThreads,
  commentExcerpt,
  countOpenThreads,
  filterThreads,
  levelNameOf,
  sortByActivity,
  type ThreadFilter,
} from '../../features/comments/commentsLogic'
import { fr } from '../../i18n/fr'
import { useCommentsStore } from '../../stores/commentsStore'
import { useEditorStore } from '../../stores/editorStore'
import Button from '../ui/Button'
import CommentThreadView from './CommentThreadView'
import { focusThread } from './focusThread'

const FILTERS: ThreadFilter[] = ['open', 'resolved', 'all']

/**
 * Panneau « Commentaires » (M16, lot C) : fils du projet, filtrés ouverts / résolus / tous, du plus
 * récemment commenté au plus ancien. Cliquer un fil l'ouvre et centre le plan sur son épingle.
 */
interface CommentsPanelProps {
  /** Éditeur de Pascal (M19 A2c) : « Nouveau » ouvre un brouillon ici au lieu de l'outil de pose. */
  onNew?: () => void
  /** Bulle de saisie affichée en tête du panneau (éditeur de Pascal). */
  composer?: ReactNode
}

export default function CommentsPanel({ onNew, composer }: CommentsPanelProps = {}) {
  const comments = useCommentsStore((state) => state.comments)
  const loaded = useCommentsStore((state) => state.loaded)
  const people = useCommentsStore((state) => state.people)
  const selectedThreadId = useCommentsStore((state) => state.selectedThreadId)
  const selectThread = useCommentsStore((state) => state.selectThread)
  const levels = useEditorStore((state) => state.project?.document.levels)
  const activeTool = useEditorStore((state) => state.activeTool)
  const setTool = useEditorStore((state) => state.setTool)
  const [filter, setFilter] = useState<ThreadFilter>('open')

  const threads = useMemo(() => buildThreads(comments), [comments])
  const shown = useMemo(() => sortByActivity(filterThreads(threads, filter)), [threads, filter])
  // Un fil supprimé par quelqu'un d'autre pendant qu'il est ouvert : retour à la liste.
  const selected = selectedThreadId ? threads.find((thread) => thread.root.id === selectedThreadId) : undefined

  if (selected) return <CommentThreadView thread={selected} onBack={() => selectThread(null)} />

  const openCount = countOpenThreads(threads)
  const showLevel = (levels?.length ?? 0) > 1

  return (
    <section aria-label={fr.comments.panelTitle} className="p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900">{fr.comments.panelTitle}</h2>
        {/* L'outil « Commenter » se lance ici (ou avec C), et plus depuis la colonne d'outils. */}
        <Button
          variant="primary"
          onClick={() => (onNew ? onNew() : setTool('comment'))}
          aria-pressed={activeTool === 'comment'}
          title={`${fr.comments.newTitle} (C)`}
          className="h-8 rounded-lg px-2.5 py-0 text-xs"
        >
          <Plus size={14} aria-hidden="true" />
          {fr.comments.newButton}
        </Button>
      </div>
      <p className="mt-1 text-xs text-slate-600">
        {activeTool === 'comment' ? fr.comments.placing : fr.comments.panelIntro}
      </p>
      {composer}

      <div role="group" aria-label={fr.comments.filterLabel} className="mt-3 flex rounded-md border border-slate-300 p-0.5">
        {FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            className={clsx(
              'flex-1 rounded px-2 py-1 text-xs font-medium focus-visible:outline-2 focus-visible:outline-indigo-600',
              filter === value ? 'bg-indigo-100 text-indigo-800' : 'text-slate-700 hover:bg-slate-100',
            )}
          >
            {fr.comments.filters[value]}
            {value === 'open' && openCount > 0 && ` (${openCount})`}
          </button>
        ))}
      </div>

      {!loaded && <p role="status" className="mt-4 text-sm text-slate-600">{fr.comments.loading}</p>}

      {loaded && shown.length === 0 && (
        <p className="mt-4 flex items-start gap-2 text-sm text-slate-600">
          <MessageSquare size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          {threads.length === 0 ? fr.comments.empty : fr.comments.emptyFilter[filter]}
        </p>
      )}

      <ul className="mt-3 space-y-1.5">
        {shown.map((thread) => {
          const author = people.get(thread.root.authorId)
          const color = author?.color ?? colorForUser(thread.root.authorId)
          const levelName = showLevel ? levelNameOf(levels, thread.root.levelId) : null
          return (
            <li key={thread.root.id}>
              <button
                type="button"
                onClick={() => focusThread(thread)}
                className={clsx(
                  'flex w-full items-start gap-2 rounded-md border border-slate-200 px-3 py-2 text-left hover:bg-slate-50',
                  'focus-visible:outline-2 focus-visible:outline-indigo-600',
                  thread.resolved && 'opacity-70',
                )}
              >
                <span
                  className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: color }}
                  aria-hidden="true"
                >
                  {thread.number}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-900">
                    {author?.name ?? fr.history.unknownAuthor}
                  </span>
                  <span className="block text-sm text-slate-700">{commentExcerpt(thread.root.body, 90)}</span>
                  <span className="mt-0.5 block text-xs text-slate-600">
                    {[
                      fr.comments.when(thread.lastActivityAt),
                      thread.replies.length > 0 ? fr.comments.repliesCount(thread.replies.length) : '',
                      levelName ?? '',
                      thread.resolved ? fr.comments.resolved : '',
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
