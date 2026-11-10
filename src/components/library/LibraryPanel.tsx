import clsx from 'clsx'
import { Search } from 'lucide-react'
import { useMemo, useState, type DragEvent } from 'react'
import { CATEGORIES, SYMBOLS } from '../../features/library/catalog'
import { searchSymbols } from '../../features/library/search'
import type { SymbolCategory } from '../../features/library/types'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import { FURNITURE_DRAG_TYPE } from './dragType'
import SymbolPreview from './SymbolPreview'
import { categoryName, symbolName, symbolSearchText } from './symbolText'

type CategoryFilter = 'all' | SymbolCategory

/**
 * Panneau « Bibliothèque » d'un plan : recherche (sans accents), catégories, vignettes. Un clic
 * choisit l'objet puis un clic sur le plan le pose (l'outil reste actif) ; on peut aussi le
 * glisser directement sur le plan.
 */
export default function LibraryPanel() {
  const isPlan = useEditorStore((state) => state.project?.kind === 'plan')
  const activeTool = useEditorStore((state) => state.activeTool)
  const activeSymbol = useEditorStore((state) => state.furnitureSymbolId)
  const startPlacing = useEditorStore((state) => state.startPlacingFurniture)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('all')

  // Résultats de la recherche, avant le filtre de catégorie (pour compter les objets par catégorie).
  const found = useMemo(() => searchSymbols(SYMBOLS, query, symbolSearchText), [query])
  const counts = useMemo(() => {
    const byCategory = new Map<SymbolCategory, number>()
    for (const symbol of found) byCategory.set(symbol.category, (byCategory.get(symbol.category) ?? 0) + 1)
    return byCategory
  }, [found])

  if (!isPlan) return null

  const categories = CATEGORIES.filter((id) => SYMBOLS.some((symbol) => symbol.category === id))
  const shown = category === 'all' ? found : found.filter((symbol) => symbol.category === category)

  const handleDragStart = (id: string) => (event: DragEvent<HTMLButtonElement>) => {
    event.dataTransfer.setData(FURNITURE_DRAG_TYPE, id)
    event.dataTransfer.effectAllowed = 'copy'
  }

  const chip = (id: CategoryFilter, label: string, count: number) => (
    <button
      key={id}
      type="button"
      aria-pressed={category === id}
      onClick={() => setCategory(id)}
      className={clsx(
        'rounded-full border px-2 py-0.5 text-xs',
        category === id
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
        {categories.map((id) => chip(id, categoryName(id), counts.get(id) ?? 0))}
      </div>

      {shown.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">{fr.library.noResult}</p>
      ) : (
        <ul className="mt-3 grid grid-cols-2 gap-2">
          {shown.map((def) => {
            const selected = activeTool === 'furniture' && activeSymbol === def.id
            return (
              <li key={def.id}>
                <button
                  type="button"
                  draggable
                  onDragStart={handleDragStart(def.id)}
                  onClick={() => startPlacing(def.id)}
                  aria-pressed={selected}
                  title={symbolName(def.id)}
                  className={clsx(
                    'flex h-full w-full flex-col items-center gap-1 rounded-md border p-2 text-center',
                    selected
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 hover:bg-slate-50',
                  )}
                >
                  <SymbolPreview def={def} size={64} />
                  <span className="line-clamp-2 text-xs text-slate-900">{symbolName(def.id)}</span>
                  <span className="text-[11px] text-slate-500">
                    {fr.library.size(def.width, def.depth)}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
