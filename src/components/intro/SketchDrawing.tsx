import { DEMO_DIMENSIONS, DEMO_PLAN_SIZE, type DemoRoomMeasure } from '../../features/intro/demoPlan'
import { fr } from '../../i18n/fr'

interface SketchDrawingProps {
  /** viewBox partagé avec le plan (unités = mm / 10). */
  viewBox: string
  measures: readonly DemoRoomMeasure[]
  /** Version téléphone : écriture agrandie pour rester lisible une fois réduite. */
  compact?: boolean
  className?: string
}

const u = (mm: number): number => mm / 10

const W = u(DEMO_PLAN_SIZE.width) // 870
const D = u(DEMO_PLAN_SIZE.depth) // 420
const SPLIT_X = u(DEMO_DIMENSIONS.bottom[0]) // 520
const SPLIT_Y = u(DEMO_DIMENSIONS.right[0]) // 320

const PENCIL = '#57534e' // stone-600
const HAND = "'Caveat', cursive"

const round = (n: number): string => (Math.round(n * 10) / 10).toString()

/**
 * Trait de crayon entre deux points : léger S (deux bosses opposées) et dépassement
 * aux extrémités, comme un trait tiré à main levée. Valeurs fixes : le dessin est stable.
 */
function pencil(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  { bow = 2, wave = -1.5, start = 0, end = 0 }: { bow?: number; wave?: number; start?: number; end?: number } = {},
): string {
  const len = Math.hypot(x2 - x1, y2 - y1)
  const ux = (x2 - x1) / len
  const uy = (y2 - y1) / len
  const sx = x1 - ux * start
  const sy = y1 - uy * start
  const ex = x2 + ux * end
  const ey = y2 + uy * end
  const at = (t: number, off: number): string =>
    `${round(sx + (ex - sx) * t - uy * off)} ${round(sy + (ey - sy) * t + ux * off)}`
  return `M${round(sx)} ${round(sy)}C${at(1 / 3, bow)} ${at(2 / 3, wave)} ${round(ex)} ${round(ey)}`
}

/** Le même plan, griffonné au crayon sur un cahier à petits carreaux. Décoratif. */
export default function SketchDrawing({ viewBox, measures, compact = false, className }: SketchDrawingProps) {
  const walls = [
    // haut, tracé deux fois (le premier trait n'était pas droit)
    pencil(0, 1, SPLIT_X + 6, -2, { bow: 3, wave: -2, start: 12 }),
    pencil(-4, -3, SPLIT_X + 2, 1, { bow: -2, wave: 2.5, start: 4, end: 2 }),
    pencil(SPLIT_X - 4, -1, W, 2, { bow: 2, wave: -1, end: 13 }),
    // droite
    pencil(W + 1, 0, W - 2, D, { bow: -2.5, wave: 2, start: 14, end: 9 }),
    // bas, avec la porte d'entrée laissée ouverte
    pencil(W + 2, D + 1, 622, D - 1, { bow: 1.5, wave: -2, start: 10 }),
    pencil(538, D + 2, 0, D, { bow: -2, wave: 1.5, end: 14 }),
    // gauche
    pencil(-1, D + 1, 1, 0, { bow: 2.5, wave: -2, start: 11, end: 15 }),
    // cloisons
    pencil(SPLIT_X + 1, -2, SPLIT_X - 2, D, { bow: -3, wave: 2, start: 6, end: 8 }),
    pencil(SPLIT_X - 6, SPLIT_Y + 2, W + 1, SPLIT_Y - 1, { bow: 2, wave: -2.5, end: 9 }),
  ]

  // Porte d'entrée vite marquée : un vantail et un arc approximatif.
  const door = 'M541 418L545 344M545 344C578 342 612 368 619 416'

  // Cotes devinées sous le plan : flèche à main levée, extrémités en petits traits.
  const guessY = D + 34
  const guesses = DEMO_DIMENSIONS.bottom.reduce<{ from: number; to: number; mm: number }[]>((acc, mm) => {
    const from = acc.length > 0 ? acc[acc.length - 1].to : 0
    return [...acc, { from, to: from + u(mm), mm }]
  }, [])

  // Noms en minuscules, un peu de travers, posés près du centre de chaque pièce.
  const tilt: Record<DemoRoomMeasure['id'], number> = { sejour: -4, cuisine: -3, entree: 2 }
  const size: Record<DemoRoomMeasure['id'], number> = compact
    ? { sejour: 46, cuisine: 42, entree: 38 }
    : { sejour: 40, cuisine: 36, entree: 30 }
  const guessSize = compact ? 36 : 32

  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <g fill="none" stroke={PENCIL} strokeLinecap="round" strokeLinejoin="round">
        <g strokeWidth="2.6" strokeOpacity="0.9">
          {walls.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        <path d={door} strokeWidth="1.8" strokeOpacity="0.75" />
        <g strokeWidth="1.6" strokeOpacity="0.7">
          {guesses.map((g) => (
            <g key={g.from}>
              <path d={pencil(g.from + 4, guessY, g.to - 4, guessY + 1, { bow: 1, wave: -1 })} />
              <path d={pencil(g.from + 1, guessY - 9, g.from - 1, guessY + 9, { bow: 0.5, wave: 0 })} />
              <path d={pencil(g.to + 1, guessY - 8, g.to - 1, guessY + 10, { bow: 0.5, wave: 0 })} />
            </g>
          ))}
        </g>
      </g>

      <g fill={PENCIL} style={{ fontFamily: HAND }} textAnchor="middle">
        {measures.map((room) => {
          const x = u(room.center.x)
          const y = u(room.center.y) + size[room.id] / 3
          return (
            <text key={room.id} x={x} y={y} fontSize={size[room.id]} transform={`rotate(${tilt[room.id]} ${x} ${y})`}>
              {fr.intro.rooms[room.id].toLocaleLowerCase('fr')}
            </text>
          )
        })}
        {guesses.map((g, i) => {
          const x = (g.from + g.to) / 2
          const y = guessY + 36
          return (
            <text key={g.from} x={x} y={y} fontSize={guessSize} transform={`rotate(${i === 0 ? -2 : 1.5} ${x} ${y})`}>
              {`${g.mm} ?`}
            </text>
          )
        })}
      </g>
    </svg>
  )
}
