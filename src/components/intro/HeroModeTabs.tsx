import { HERO_MODES, type HeroMode } from '../../features/intro/heroModes'
import { fr } from '../../i18n/fr'

interface HeroModeTabsProps {
  current: HeroMode
  onSelect: (mode: HeroMode) => void
}

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'

/** Les trois plus-values du hero : un bouton chacune, la phrase explicative suit le choix. */
export default function HeroModeTabs({ current, onSelect }: HeroModeTabsProps) {
  return (
    <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
      <div role="group" aria-label={fr.intro.modesLabel} className="flex flex-wrap gap-2">
        {HERO_MODES.map((mode) => {
          const active = mode === current
          return (
            <button
              key={mode}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(mode)}
              className={`h-11 rounded-xl px-4 text-sm font-medium transition-colors duration-200 ${FOCUS} ${
                active
                  ? 'bg-indigo-950 text-white'
                  : 'bg-white text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50'
              }`}
            >
              {fr.intro.modes[mode].label}
            </button>
          )
        })}
      </div>
      <p aria-live="polite" className="max-w-md text-sm leading-relaxed text-slate-600 lg:text-right">
        {fr.intro.modes[current].text}
      </p>
    </div>
  )
}
