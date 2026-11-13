import gsap from 'gsap'
import { ChevronsLeftRight } from 'lucide-react'
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react'
import { measureDemoRooms, type DemoRoomId } from '../../features/intro/demoPlan'
import { DEMO_FAULT, DIVIDER_AT, ROOM_SEQUENCE, type HeroMode } from '../../features/intro/heroModes'
import { fr } from '../../i18n/fr'
import FaultPill from './FaultPill'
import HeroModeTabs from './HeroModeTabs'
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

/** Le séparateur part du côté plan, puis se pose ici ; les métrés comptent en même temps. */
const INTRO_FROM = 88
const RESTING = DIVIDER_AT.sketch
const INTRO_DELAY_S = 0.4

/** Centre de l'anneau qui repère le défaut, en unités du dessin (mm / 10). */
const RING_ORIGIN = `${DEMO_FAULT.x / 10} ${(DEMO_FAULT.fromY + DEMO_FAULT.toY) / 20}`

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

/**
 * « Votre croquis devient un plan coté » : comparateur avant / après à glisser, et trois
 * plus-values à essayer (croquis → plan, métrés automatiques, contrôle avant export).
 * GSAP pilote le temps et l'easing ; l'état React ne fait que l'afficher.
 */
export default function SketchToPlan() {
  const rootRef = useRef<HTMLDivElement>(null)
  const contextRef = useRef<gsap.Context | null>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  // Départ : animé (séparateur côté plan, chiffres à zéro) ou, sans animation, déjà posé.
  const [initial] = useState(() =>
    prefersReducedMotion() ? { divider: RESTING, progress: 1 } : { divider: INTRO_FROM, progress: 0 },
  )
  const motion = useRef({ ...initial })

  const [value, setValue] = useState<number>(initial.divider)
  const [progress, setProgress] = useState<number>(initial.progress)
  const [mode, setMode] = useState<HeroMode>('sketch')
  const [activeRoom, setActiveRoom] = useState<DemoRoomId | null>(null)
  const [faultShown, setFaultShown] = useState(false)
  const compact = useCompact()
  const viewBox = compact ? VIEWBOX_COMPACT : VIEWBOX

  // Ouverture : le séparateur se pose, les surfaces comptent jusqu'à leur valeur exacte.
  useEffect(() => {
    const context = gsap.context(() => {}, rootRef)
    contextRef.current = context
    if (!prefersReducedMotion()) {
      context.add(() => {
        timelineRef.current = gsap
          .timeline({ delay: INTRO_DELAY_S })
          .to(motion.current, {
            divider: RESTING,
            duration: 1.4,
            ease: 'expo.out',
            onUpdate: () => setValue(motion.current.divider),
          })
          .to(
            motion.current,
            {
              progress: 1,
              duration: 1.3,
              ease: 'power2.out',
              onUpdate: () => setProgress(motion.current.progress),
            },
            '<0.15',
          )
      })
    }
    return () => {
      timelineRef.current?.kill()
      context.revert()
      contextRef.current = null
    }
  }, [])

  const pulseRing = () => {
    if (prefersReducedMotion()) return
    gsap.fromTo(
      '[data-fault-ring]',
      { scale: 1, opacity: 1, svgOrigin: RING_ORIGIN },
      { scale: 2.6, opacity: 0, svgOrigin: RING_ORIGIN, duration: 1.1, repeat: 2, ease: 'expo.out' },
    )
  }

  // L'alerte entre en scène, puis l'anneau pulse autour du défaut.
  useEffect(() => {
    if (!faultShown || prefersReducedMotion()) return
    contextRef.current?.add(() => {
      gsap.from('[data-fault-pill]', { opacity: 0, y: -10, scale: 0.95, transformOrigin: '100% 0%', duration: 0.5, ease: 'expo.out', clearProps: 'transform' })
      pulseRing()
    })
  }, [faultShown])

  const stopMotion = () => {
    timelineRef.current?.kill()
    gsap.killTweensOf(motion.current)
  }

  const selectMode = (next: HeroMode) => {
    stopMotion()
    const instant = prefersReducedMotion()
    setMode(next)
    setActiveRoom(null)
    setFaultShown(false)
    contextRef.current?.add(() => {
      const timeline = gsap.timeline()
      timeline.to(motion.current, {
        divider: DIVIDER_AT[next],
        duration: instant ? 0 : 1,
        ease: 'expo.out',
        onUpdate: () => setValue(motion.current.divider),
      })
      if (next === 'measures') {
        // Les surfaces repartent de zéro et comptent ; chaque pièce s'allume à son tour.
        timeline.set(motion.current, { progress: 0 }, 0)
        timeline.to(
          motion.current,
          {
            progress: 1,
            duration: instant ? 0 : 1.8,
            ease: 'power2.out',
            onUpdate: () => setProgress(motion.current.progress),
          },
          0.3,
        )
        ROOM_SEQUENCE.forEach((id, index) => {
          timeline.call(() => setActiveRoom(id), undefined, 0.5 + index * 0.6)
        })
        timeline.call(() => setActiveRoom(null), undefined, 0.5 + ROOM_SEQUENCE.length * 0.6)
      } else {
        timeline.set(motion.current, { progress: 1 }, 0)
        timeline.call(() => setProgress(1), undefined, 0)
      }
      if (next === 'check') timeline.call(() => setFaultShown(true), undefined, instant ? 0 : 0.7)
      timelineRef.current = timeline
    })
  }

  const seeOnPlan = () => contextRef.current?.add(pulseRing)
  const shown = Math.round(value)

  const takeOver = () => stopMotion()

  return (
    <div ref={rootRef}>
      <HeroModeTabs current={mode} onSelect={selectMode} />

      <div className="relative isolate -mx-6 aspect-[4/3] w-[calc(100%+3rem)] overflow-hidden bg-stone-50 ring-slate-900/10 sm:mx-0 sm:w-full sm:aspect-[16/10] sm:rounded-3xl sm:ring-1 select-none lg:aspect-auto lg:h-[560px]">
        {/* Calque croquis */}
        <div className="absolute inset-0 bg-stone-50" style={PAPER_STYLE}>
          <SketchDrawing viewBox={viewBox} compact={compact} measures={MEASURES} className={DRAWING_FRAME} />
        </div>

        {/* Calque plan, découpé à droite du séparateur */}
        <div className="absolute inset-0 bg-indigo-950" style={{ clipPath: `inset(0 0 0 ${value}%)` }}>
          <PlanDrawing
            viewBox={viewBox}
            compact={compact}
            measures={MEASURES}
            className={DRAWING_FRAME}
            highlightId={activeRoom}
            fault={faultShown}
          />
          <MeasuresCard
            measures={MEASURES}
            progress={progress}
            activeId={activeRoom}
            blocked={faultShown}
            className="absolute right-6 bottom-6 hidden w-52 shadow-xl shadow-indigo-950/40 lg:block"
          />
        </div>

        <span className={`pointer-events-none absolute top-3 left-3 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-slate-900/5 transition-opacity duration-300 lg:top-6 lg:left-6 lg:text-sm ${value < 12 ? 'opacity-0' : ''}`}>
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
            motion.current.divider = Number(event.target.value)
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
          className="pointer-events-none absolute inset-y-0 z-20 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_0_1px_rgb(30_27_75/0.12)] transition-opacity duration-300"
          style={{ left: `${value}%`, opacity: value < 2 ? 0 : 1 }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 z-20 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-indigo-950 shadow-lg shadow-indigo-950/30 ring-indigo-400 ring-offset-2 ring-offset-indigo-950 transition-[opacity,scale] duration-300 ease-out-strong peer-focus-visible:ring-4 peer-active:scale-90"
          style={{ left: `${value}%`, opacity: value < 2 ? 0 : 1 }}
        >
          <ChevronsLeftRight className="size-5" strokeWidth={2.25} />
        </div>

        {faultShown && <FaultPill placement="stage" onSee={seeOnPlan} />}
      </div>

      {faultShown && <FaultPill placement="flow" onSee={seeOnPlan} />}

      <MeasuresCard
        measures={MEASURES}
        progress={progress}
        activeId={activeRoom}
        blocked={faultShown}
        className="mt-4 ring-1 ring-slate-200 lg:hidden"
      />
    </div>
  )
}
