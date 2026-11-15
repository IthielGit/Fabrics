import clsx from 'clsx'
import { ArrowDownToLine, ArrowUpToLine, Building, Check, ChevronDown } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { levelAbove, levelBelow } from '../../features/documents/levels'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import { MENU_LIST, MENU_TRIGGER, menuItemClass } from '../ui/menuStyles'
import { SEGMENT_BASE, SEGMENT_DIVIDER } from '../ui/segmented'
import { useDismiss } from './useDismiss'

const TOGGLE_CLASS = clsx(SEGMENT_BASE, 'w-8 px-0')
const TOGGLE_ON = 'bg-indigo-100 text-indigo-700'
const TOGGLE_OFF = 'text-slate-600 enabled:hover:bg-slate-100 enabled:hover:text-slate-900'

/**
 * Sélecteur de niveau d'un plan, dans la barre « Niveau · Cotation » (M15 bis) : un menu
 * « Niveau  Rez-de-chaussée ▾ » qui liste les niveaux, puis deux interrupteurs pour afficher le
 * niveau du dessous ou du dessus en transparence (seulement s'il y a plusieurs niveaux).
 */
export default function LevelSelector() {
  const levels = useEditorStore((state) => state.project?.document.levels)
  const activeLevelId = useEditorStore((state) => state.activeLevelId)
  const showLowerLevel = useEditorStore((state) => state.showLowerLevel)
  const setActiveLevel = useEditorStore((state) => state.setActiveLevel)
  const setShowLowerLevel = useEditorStore((state) => state.setShowLowerLevel)
  const showUpperLevel = useEditorStore((state) => state.showUpperLevel)
  const setShowUpperLevel = useEditorStore((state) => state.setShowUpperLevel)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(rootRef, open, close)

  if (!levels || levels.length === 0 || activeLevelId === null) return null
  const active = levels.find((level) => level.id === activeLevelId)
  const below = levelBelow(levels, activeLevelId)
  const referenceOn = showLowerLevel && below !== undefined
  const above = levelAbove(levels, activeLevelId)
  const upperOn = showUpperLevel && above !== undefined
  // Avec un seul niveau, les deux interrupteurs de transparence ne servent à rien : on les cache.
  const severalLevels = levels.length > 1

  return (
    <nav aria-label={fr.levels.selectorLabel} className="flex min-w-0 items-center gap-0.5">
      <div ref={rootRef} className="relative min-w-0">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          title={fr.levels.selectorLabel}
          onClick={() => setOpen((value) => !value)}
          className={clsx(MENU_TRIGGER, 'max-w-full')}
        >
          <Building size={16} aria-hidden className="shrink-0 text-slate-500" />
          <span className="text-slate-500 max-sm:sr-only">{fr.levels.label}</span>
          <span className="truncate font-medium text-slate-900">{active?.name}</span>
          <ChevronDown size={14} aria-hidden className="shrink-0 text-slate-500" />
        </button>
        {open && (
          // Le plus haut niveau en premier, comme sur une coupe du bâtiment.
          <div role="menu" aria-label={fr.levels.selectorLabel} className={clsx(MENU_LIST, 'max-h-80 overflow-y-auto')}>
            {[...levels].reverse().map((level) => (
              <button
                key={level.id}
                type="button"
                role="menuitemradio"
                aria-checked={level.id === activeLevelId}
                title={fr.levels.activate}
                onClick={() => {
                  setActiveLevel(level.id)
                  setOpen(false)
                }}
                className={menuItemClass(level.id === activeLevelId)}
              >
                <span className="truncate">{level.name}</span>
                {level.id === activeLevelId && <Check size={14} aria-hidden className="shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </div>
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
          className={clsx(TOGGLE_CLASS, referenceOn ? TOGGLE_ON : TOGGLE_OFF)}
        >
          <ArrowDownToLine size={18} aria-hidden />
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
          className={clsx(TOGGLE_CLASS, upperOn ? TOGGLE_ON : TOGGLE_OFF)}
        >
          <ArrowUpToLine size={18} aria-hidden />
        </button>
      )}
    </nav>
  )
}
