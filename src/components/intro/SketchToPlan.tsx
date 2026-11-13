import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react'
import { ChevronsLeftRight } from 'lucide-react'
import { measureDemoRooms } from '../../features/intro/demoPlan'
import { fr } from '../../i18n/fr'
import MeasuresCard from './MeasuresCard'
import PlanDrawing from './PlanDrawing'
import SketchDrawing from './SketchDrawing'

/**
 * Repère commun aux deux calques, en mm / 10 : le plan occupe 0..870 × 0..420,
 * la marge accueille les cotes. Croquis et plan se superposent exactement.
 */
const VIEWBOX = '-90 -90 1050 600'
/**
 * Sur téléphone (scène 4:3), cadrage resserré sur le plan : la chaîne de gauche
 * (redondante avec celle de droite) disparaît et les textes sont agrandis.
 */
const VIEWBOX_COMPACT = '-28 -130 1000 750'

/** Sous `sm` (téléphones) : dessins en version compacte. */
const COMPACT_QUERY = '(max-width: 639px)'

function subscribeCompact(onChange: () => void): () => void {
  const mql = window.matchMedia(COMPACT_QUERY)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

function useCompact(): boolean {
  return useSyncExternalStore(
    subscribeCompact,
    () => window.matchMedia(COMPACT_QUERY).matches,
    () => false,
  )
}

const MEASURES = measureDemoRooms()

const INTRO_FROM = 88
const RESTING = 50
const INTRO_DELAY_MS = 400
const INTRO_DURATION_MS = 1400

/** Sortie exponentielle : rapide au départ, se pose doucement. */
const easeOutExpo = (t: number): number => (t >= 1 ? 1 : 1 - 2 ** (-10 * t))

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Petits carreaux de cahier, bleu pâle. */
const PAPER_STYLE: CSSProperties = {
  backgroundImage:
    'linear-gradient(to right, rgb(59 130 246 / 0.14) 1px, transparent 1px),' +
    'linear-gradient(to bottom, rgb(59 130 246 / 0.14) 1px, transparent 1px)',
  backgroundSize: '18px 18px',
}

// Sur grand écran, les dessins laissent une colonne à droite pour la carte des métrés.
const DRAWING_FRAME = 'absolute top-0 left-0 h-full w-full lg:w-[calc(100%-15rem)]'

/** « Votre croquis devient un plan coté » : comparateur avant / après à glisser. */
export default function SketchToPlan() {
  const [value, setValue] = useState<number>(() => (prefersReducedMotion() ? RESTING : INTRO_FROM))
  const cancelIntro = useRef<() => void>(() => {})

  useEffect(() => {
    if (prefersReducedMotion()) return
    let frame = 0
    const timer = window.setTimeout(() => {
      const startedAt = performance.now()
      const step = (now: number) => {
        const t = Math.min(1, (now - startedAt) / INTRO_DURATION_MS)
        setValue(INTRO_FROM + (RESTING - INTRO_FROM) * easeOutExpo(t))
        if (t < 1) frame = requestAnimationFrame(step)
      }
      frame = requestAnimationFrame(step)
    }, INTRO_DELAY_MS)
    const cancel = () => {
      window.clearTimeout(timer)
      cancelAnimationFrame(frame)
    }
    cancelIntro.current = cancel
    return cancel
  }, [])

  const compact = useCompact()
  const viewBox = compact ? VIEWBOX_COMPACT : VIEWBOX

  const takeOver = () => cancelIntro.current()
  const shown = Math.round(value)

  return (
    <div>
      <div className="relative isolate -mx-6 aspect-[4/3] w-[calc(100%+3rem)] overflow-hidden bg-stone-50 ring-slate-900/10 sm:mx-0 sm:w-full sm:aspect-[16/10] sm:rounded-3xl sm:ring-1 select-none lg:aspect-auto lg:h-[600px]">
        {/* Calque croquis */}
        <div className="absolute inset-0 bg-stone-50" style={PAPER_STYLE}>
          <SketchDrawing viewBox={viewBox} compact={compact} measures={MEASURES} className={DRAWING_FRAME} />
        </div>

        {/* Calque plan, découpé à droite du séparateur */}
        <div className="absolute inset-0 bg-indigo-950" style={{ clipPath: `inset(0 0 0 ${value}%)` }}>
          <PlanDrawing viewBox={viewBox} compact={compact} measures={MEASURES} className={DRAWING_FRAME} />
          <MeasuresCard
            measures={MEASURES}
            className="absolute right-6 bottom-6 hidden w-52 shadow-xl shadow-indigo-950/40 lg:block"
          />
        </div>

        <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-slate-900/5 lg:top-6 lg:left-6 lg:text-sm">
          {fr.intro.sketchLabel}
        </span>
        <span className="pointer-events-none absolute top-3 right-3 rounded-full bg-indigo-600 px-3 py-1 text-xs font-medium text-white shadow-sm lg:top-6 lg:right-6 lg:text-sm">
          {fr.intro.planLabel}
        </span>

        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={shown}
          onChange={(event) => {
            takeOver()
            setValue(Number(event.target.value))
          }}
          onPointerDown={takeOver}
          onKeyDown={takeOver}
          aria-label={fr.intro.compareLabel}
          aria-valuetext={fr.intro.compareValue(shown)}
          className="peer absolute inset-0 z-30 h-full w-full cursor-ew-resize appearance-none bg-transparent opacity-0 [&::-moz-range-thumb]:h-full [&::-moz-range-thumb]:w-1 [&::-webkit-slider-thumb]:h-full [&::-webkit-slider-thumb]:w-1 [&::-webkit-slider-thumb]:appearance-none"
        />

        {/* Séparateur et poignée */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 z-20 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_0_1px_rgb(30_27_75/0.12)]"
          style={{ left: `${value}%` }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 z-20 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-indigo-950 shadow-lg shadow-indigo-950/30 ring-indigo-400 ring-offset-2 ring-offset-indigo-950 peer-focus-visible:ring-4"
          style={{ left: `${value}%` }}
        >
          <ChevronsLeftRight className="size-5" strokeWidth={2.25} />
        </div>
      </div>

      <MeasuresCard measures={MEASURES} className="mt-4 ring-1 ring-slate-200 lg:hidden" />
    </div>
  )
}
