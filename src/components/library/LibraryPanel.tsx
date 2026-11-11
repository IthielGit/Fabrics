import clsx from 'clsx'
import { Search, Star } from 'lucide-react'
import { useMemo, useState, type DragEvent } from 'react'
import { CATEGORIES, SYMBOLS } from '../../features/library/catalog'
import { PREFABS } from '../../features/library/catalog/prefabs'
import { SETS, type SetDef } from '../../features/library/catalog/sets'
import { searchSymbols } from '../../features/library/search'
import type { SymbolCategory, SymbolDef } from '../../features/library/types'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import { FURNITURE_DRAG_TYPE } from './dragType'
import SymbolPreview, { SetPreview } from './SymbolPreview'
import { categoryName, symbolName, symbolSearchText } from './symbolText'
import { useLibraryPrefs } from './useLibraryPrefs'

type Entry = SymbolDef | SetDef
type Filter = 'all' | 'recents' | 'favorites' | SymbolCategory

const ENTRIES: readonly Entry[] = [...SYMBOLS, ...PREFABS, ...SETS]
const BY_ID = new Map(ENTRIES.map((entry) => [entry.id, entry]))
const isSet = (entry: Entry): entry is SetDef => 'members' in entry

/**
 * Panneau « Bibliothèque » d'un plan : recherche (sans accents), catégories, récents et favoris,
 * vignettes. Un clic choisit l'objet (ou l'ensemble) puis un clic sur le plan le pose (l'outil
 * reste actif) ; on peut aussi le glisser directement sur le plan.
 */
export default function LibraryPanel() {
  const isPlan = useEditorStore((state) => state.project?.kind === 'plan')
  const activeTool = useEditorStore((state) => state.activeTool)
  const activeSymbol = useEditorStore((state) => state.furnitureSymbolId)
  const startPlacing = useEditorStore((state) => state.startPlacingFurniture)
  const recents = useLibraryPrefs((state) => state.recents)
  const favorites = useLibraryPrefs((state) => state.favorites)
  const toggleFavorite = useLibraryPrefs((state) => state.toggleFavorite)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  // Résultats de la recherche, avant le filtre (pour compter les objets par catégorie).
  const found = useMemo(() => searchSymbols(ENTRIES, query, symbolSearchText), [query])
  const counts = useMemo(() => {
    const byCategory = new Map<SymbolCategory, number>()
    for (const entry of found) byCategory.set(entry.category, (byCategory.get(entry.category) ?? 0) + 1)
    return byCategory
  }, [found])

  if (!isPlan) return null

  const foundIds = new Set(found.map((entry) => entry.id))
  const fromList = (ids: readonly string[]) =>
    ids.flatMap((id) => (foundIds.has(id) ? (BY_ID.get(id) ?? []) : []))
  const shown: Entry[] =
    filter === 'all'
      ? found
      : filter === 'recents'
        ? fromList(recents)
        : filter === 'favorites'
          ? fromList(favorites)
          : found.filter((entry) => entry.category === filter)
  const categories = CATEGORIES.filter((id) => ENTRIES.some((entry) => entry.category === id))

  const handleDragStart = (id: string) => (event: DragEvent<HTMLButtonElement>) => {
    event.dataTransfer.setData(FURNITURE_DRAG_TYPE, id)
    event.dataTransfer.effectAllowed = 'copy'
  }

  const chip = (id: Filter, label: string, count: number) => (
    <button
      key={id}
      type="button"
      aria-pressed={filter === id}
      onClick={() => setFilter(id)}
      className={clsx(
        'rounded-full border px-2 py-0.5 text-xs',
        filter === id
          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
          : 'border-slate-300 text-slate-600 hover:bg-slate-100',
      )}
    >
      {label} <span className="text-slate-400">{count}</span>
    </button>
  )

  return (
    <section aria-label={fr.library.title} className="border-t border-slate-200 p-4">
      <h2 className="text-sm font-semibold text-slate-900">{fr.library.title}</h2>

      <div className="relative mt-3">
        <Search
          size={14}
          aria-hidden="true"
          className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={fr.library.searchPlaceholder}
          aria-label={fr.library.searchLabel}
          className="w-full rounded-md border border-slate-300 py-1 pl-7 pr-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {chip('all', fr.library.allCategories, found.length)}
        {chip('recents', fr.library.recents, fromList(recents).length)}
        {chip('favorites', fr.library.favorites, fromList(favorites).length)}
        {categories.map((id) => chip(id, categoryName(id), counts.get(id) ?? 0))}
      </div>

      {shown.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">{fr.library.noResult}</p>
      ) : (
        <ul className="mt-3 grid grid-cols-2 gap-2">
          {shown.map((entry) => {
            const selected = activeTool === 'furniture' && activeSymbol === entry.id
            const favorite = favorites.includes(entry.id)
            return (
              <li key={entry.id} className="relative">
                <button
                  type="button"
                  draggable
                  onDragStart={handleDragStart(entry.id)}
                  onClick={() => startPlacing(entry.id)}
                  aria-pressed={selected}
                  title={symbolName(entry.id)}
                  className={clsx(
                    'flex h-full w-full flex-col items-center gap-1 rounded-md border p-2 text-center',
                    selected
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 hover:bg-slate-50',
                  )}
                >
                  {isSet(entry) ? <SetPreview set={entry} size={64} /> : <SymbolPreview def={entry} size={64} />}
                  <span className="line-clamp-2 text-xs text-slate-900">{symbolName(entry.id)}</span>
                  <span className="text-[11px] text-slate-500">
                    {isSet(entry)
                      ? `${entry.shell ? fr.library.prefabBadge : fr.library.setBadge} · ${fr.library.size(entry.width, entry.depth)}`
                      : fr.library.size(entry.width, entry.depth)}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleFavorite(entry.id)}
                  aria-pressed={favorite}
                  aria-label={favorite ? fr.library.removeFavorite : fr.library.addFavorite}
                  title={favorite ? fr.library.removeFavorite : fr.library.addFavorite}
                  className="absolute right-1 top-1 rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-amber-500 aria-pressed:text-amber-500"
                >
                  <Star size={14} fill={favorite ? 'currentColor' : 'none'} aria-hidden="true" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
