import clsx from 'clsx'
import { Layers } from 'lucide-react'
import { levelBelow } from '../../features/documents/levels'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'

/**
 * Sélecteur de niveau, en haut du canevas d'un plan : un bouton par niveau, et un interrupteur
 * pour afficher le niveau du dessous en transparence (calque de référence).
 */
export default function LevelSelector() {
  const levels = useEditorStore((state) => state.project?.document.levels)
  const activeLevelId = useEditorStore((state) => state.activeLevelId)
  const showLowerLevel = useEditorStore((state) => state.showLowerLevel)
  const setActiveLevel = useEditorStore((state) => state.setActiveLevel)
  const setShowLowerLevel = useEditorStore((state) => state.setShowLowerLevel)

  if (!levels || levels.length === 0 || activeLevelId === null) return null
  const below = levelBelow(levels, activeLevelId)
  const referenceOn = showLowerLevel && below !== undefined

  return (
    <nav
      aria-label={fr.levels.selectorLabel}
      className="absolute left-16 top-3 z-10 flex max-w-[60%] items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow"
    >
      <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
        {levels.map((level) => (
          <button
            key={level.id}
            type="button"
            title={fr.levels.activate}
            aria-pressed={level.id === activeLevelId}
            onClick={() => setActiveLevel(level.id)}
            className={clsx(
              'shrink-0 rounded-md px-3 py-1.5 text-sm font-medium',
              level.id === activeLevelId
                ? 'bg-indigo-600 text-white'
                : 'text-slate-700 hover:bg-slate-100',
            )}
          >
            {level.name}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={!below}
        title={
          !below
            ? fr.levels.noLowerLevel
            : showLowerLevel
              ? `${fr.levels.hideLower} (${fr.levels.lowerLevelShown(below.name)})`
              : fr.levels.showLower
        }
        aria-label={showLowerLevel ? fr.levels.hideLower : fr.levels.showLower}
        aria-pressed={referenceOn}
        onClick={() => setShowLowerLevel(!showLowerLevel)}
        className={clsx(
          'shrink-0 rounded-md p-2 disabled:cursor-not-allowed disabled:opacity-40',
          referenceOn ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100',
        )}
      >
        <Layers size={18} />
      </button>
    </nav>
  )
}
