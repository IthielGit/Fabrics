import { useLayoutEffect, useRef, useState } from 'react'
import { HERO_MODES, type HeroMode } from '../../features/intro/heroModes'
import { fr } from '../../i18n/fr'

interface HeroModeTabsProps {
  current: HeroMode
  onSelect: (mode: HeroMode) => void
}

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
const CELL = 'h-11 rounded-lg px-3 text-[13px] leading-tight font-medium sm:px-4 sm:text-sm'
const BUTTON = `relative ${CELL} text-slate-700 transition-[transform,color] duration-150 ease-out-strong hover:text-indigo-950 active:scale-[0.97] ${FOCUS}`

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
      setClip(`inset(${top}px ${right}px ${bottom}px ${left}px round 8px)`)
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(group)
    return () => observer.disconnect()
  }, [current])

  return (
    <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
      <div data-tabs className="relative w-full rounded-xl bg-slate-100 p-1 ring-1 ring-slate-900/5 lg:w-fit">
        <div ref={groupRef} role="group" aria-label={fr.intro.modesLabel} className="relative grid grid-cols-3 lg:flex">
          {HERO_MODES.map((mode) => (
            <button
              key={mode}
              data-tab-button
              type="button"
              aria-pressed={mode === current}
              onClick={() => onSelect(mode)}
              className={BUTTON}
            >
              {fr.intro.modes[mode].label}
            </button>
          ))}
        </div>
        {/* Copie décorative en blanc sur indigo, révélée seulement sous le bouton actif. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-1 grid grid-cols-3 transition-[clip-path] lg:flex duration-300 ease-in-out-strong motion-reduce:transition-none"
          style={{ clipPath: clip ?? 'inset(0 100% 0 0)' }}
        >
          {HERO_MODES.map((mode) => (
            <span key={mode} className={`flex items-center justify-center bg-indigo-950 text-center text-white shadow-sm ${CELL}`}>
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
