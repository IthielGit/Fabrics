import { useLayoutEffect, useRef, useState } from 'react'
import { HERO_MODES, type HeroMode } from '../../features/intro/heroModes'
import { fr } from '../../i18n/fr'

interface HeroModeTabsProps {
  current: HeroMode
  onSelect: (mode: HeroMode) => void
}

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
const BUTTON = `relative h-11 rounded-xl px-4 text-sm font-medium transition-transform duration-150 ease-out-strong active:scale-[0.97] ${FOCUS}`

/**
 * Les trois plus-values du hero : un bouton chacune, la phrase explicative suit le choix.
 * Le fond actif glisse d'un bouton à l'autre (détourage d'une copie du groupe, sans reflow).
 */
export default function HeroModeTabs({ current, onSelect }: HeroModeTabsProps) {
  const groupRef = useRef<HTMLDivElement>(null)
  const [clip, setClip] = useState<string | null>(null)

  useLayoutEffect(() => {
    const group = groupRef.current
    if (!group) return
    const update = () => {
      const index = HERO_MODES.indexOf(current)
      const button = group.querySelectorAll<HTMLElement>('[data-tab-button]')[index]
      if (!button) return
      const { offsetLeft: left, offsetTop: top, offsetWidth: width, offsetHeight: height } = button
      const right = group.offsetWidth - left - width
      const bottom = group.offsetHeight - top - height
      setClip(`inset(${top}px ${right}px ${bottom}px ${left}px round 12px)`)
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(group)
    return () => observer.disconnect()
  }, [current])

  return (
    <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
      <div data-tabs className="relative w-fit">
        <div ref={groupRef} role="group" aria-label={fr.intro.modesLabel} className="flex flex-wrap gap-2">
          {HERO_MODES.map((mode) => (
            <button
              key={mode}
              data-tab-button
              type="button"
              aria-pressed={mode === current}
              onClick={() => onSelect(mode)}
              className={`${BUTTON} bg-white text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50`}
            >
              {fr.intro.modes[mode].label}
            </button>
          ))}
        </div>
        {/* Copie décorative en blanc sur indigo, révélée seulement sous le bouton actif. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex flex-wrap gap-2 transition-[clip-path] duration-300 ease-in-out-strong motion-reduce:transition-none"
          style={{ clipPath: clip ?? 'inset(0 100% 0 0)' }}
        >
          {HERO_MODES.map((mode) => (
            <span key={mode} className="flex h-11 items-center rounded-xl bg-indigo-950 px-4 text-sm font-medium text-white">
              {fr.intro.modes[mode].label}
            </span>
          ))}
        </div>
      </div>
      <p key={current} aria-live="polite" className="swap max-w-md text-sm leading-relaxed text-slate-600 lg:text-right">
        {fr.intro.modes[current].text}
      </p>
    </div>
  )
}
