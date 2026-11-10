import clsx from 'clsx'
import { SYMBOLS } from '../../features/library/catalog'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import SymbolPreview from './SymbolPreview'

/**
 * Panneau « Bibliothèque » d'un plan : liste des objets du catalogue ; un clic choisit l'objet,
 * puis un clic sur le plan le pose. (Catégories, recherche et glisser-déposer : lot C.)
 */
export default function LibraryPanel() {
  const isPlan = useEditorStore((state) => state.project?.kind === 'plan')
  const activeTool = useEditorStore((state) => state.activeTool)
  const activeSymbol = useEditorStore((state) => state.furnitureSymbolId)
  const startPlacing = useEditorStore((state) => state.startPlacingFurniture)

  if (!isPlan) return null

  return (
    <section aria-label={fr.library.title} className="border-t border-slate-200 p-4">
      <h2 className="text-sm font-semibold text-slate-900">{fr.library.title}</h2>
      <ul className="mt-3 space-y-1">
        {SYMBOLS.map((def) => {
          const selected = activeTool === 'furniture' && activeSymbol === def.id
          return (
            <li key={def.id}>
              <button
                type="button"
                onClick={() => startPlacing(def.id)}
                aria-pressed={selected}
                className={clsx(
                  'flex w-full items-center gap-3 rounded-md border px-2 py-1.5 text-left',
                  selected
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-transparent hover:bg-slate-100',
                )}
              >
                <SymbolPreview def={def} />
                <span className="min-w-0">
                  <span className="block truncate text-sm text-slate-900">
                    {fr.library.symbols[def.id]?.name ?? def.id}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {fr.library.size(def.width, def.depth)}
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
