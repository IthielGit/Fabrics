import clsx from 'clsx'
import { Layers, Layers2 } from 'lucide-react'
import { levelAbove, levelBelow } from '../../features/documents/levels'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import { SEGMENT_BASE, SEGMENT_DIVIDER, SEGMENTED_BAR, segmentClass } from '../ui/segmented'

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
  const showUpperLevel = useEditorStore((state) => state.showUpperLevel)
  const setShowUpperLevel = useEditorStore((state) => state.setShowUpperLevel)

  if (!levels || levels.length === 0 || activeLevelId === null) return null
  const below = levelBelow(levels, activeLevelId)
  const referenceOn = showLowerLevel && below !== undefined
  const above = levelAbove(levels, activeLevelId)
  const upperOn = showUpperLevel && above !== undefined
  // Avec un seul niveau, les deux interrupteurs de transparence ne servent à rien : on les cache.
  const severalLevels = levels.length > 1

  return (
    <nav
      aria-label={fr.levels.selectorLabel}
      className={clsx('pointer-events-auto min-w-0 max-w-full sm:min-w-[15rem] sm:max-w-[60%]', SEGMENTED_BAR)}
    >
      <div className="flex min-w-0 items-center gap-0.5 overflow-x-auto">
        {levels.map((level) => (
          <button
            key={level.id}
            type="button"
            title={fr.levels.activate}
            aria-pressed={level.id === activeLevelId}
            onClick={() => setActiveLevel(level.id)}
            className={segmentClass(level.id === activeLevelId)}
          >
            {level.name}
          </button>
        ))}
      </div>
      {/* Les deux interrupteurs de transparence forment un groupe à part, séparé des niveaux. */}
      {severalLevels && <span className={SEGMENT_DIVIDER} aria-hidden />}
      {severalLevels && (
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
          SEGMENT_BASE,
          'w-8 px-0',
          referenceOn
            ? 'bg-indigo-100 text-indigo-700'
            : 'text-slate-600 enabled:hover:bg-slate-100 enabled:hover:text-slate-900',
        )}
      >
        <Layers size={18} aria-hidden />
      </button>
      )}
      {severalLevels && (
      <button
        type="button"
        disabled={!above}
        title={
          !above
            ? fr.levels.noUpperLevel
            : showUpperLevel
              ? `${fr.levels.hideUpper} (${fr.levels.upperLevelShown(above.name)})`
              : fr.levels.showUpper
        }
        aria-label={showUpperLevel ? fr.levels.hideUpper : fr.levels.showUpper}
        aria-pressed={upperOn}
        onClick={() => setShowUpperLevel(!showUpperLevel)}
        className={clsx(
          SEGMENT_BASE,
          'w-8 px-0',
          upperOn
            ? 'bg-indigo-100 text-indigo-700'
            : 'text-slate-600 enabled:hover:bg-slate-100 enabled:hover:text-slate-900',
        )}
      >
        <Layers2 size={18} aria-hidden />
      </button>
      )}
    </nav>
  )
}
