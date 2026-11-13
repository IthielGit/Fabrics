import {
  DEMO_DIMENSIONS,
  DEMO_PLAN_SIZE,
  DEMO_ROOMS,
  type DemoRoomId,
  type DemoRoomMeasure,
} from '../../features/intro/demoPlan'
import { DEMO_FAULT } from '../../features/intro/heroModes'
import { formatArea, formatLength } from '../../features/units/format'
import { fr } from '../../i18n/fr'

interface PlanDrawingProps {
  /** viewBox partagé avec le croquis (unités = mm / 10). */
  viewBox: string
  measures: readonly DemoRoomMeasure[]
  /** Version téléphone : textes agrandis, cotes à l'extérieur, chaîne de gauche omise. */
  compact?: boolean
  className?: string
  /** Pièce surlignée pendant la démonstration des métrés. */
  highlightId?: DemoRoomId | null
  /** Affiche le défaut de démonstration (deux murs superposés). */
  fault?: boolean
}

/** 1 unité SVG = 10 mm. */
const MM_PER_UNIT = 10
const u = (mm: number): number => mm / MM_PER_UNIT

const W = u(DEMO_PLAN_SIZE.width) // 870
const D = u(DEMO_PLAN_SIZE.depth) // 420
/** Cloison séjour | cuisine-entrée, et cloison cuisine | entrée. */
const SPLIT_X = u(DEMO_DIMENSIONS.bottom[0]) // 520
const SPLIT_Y = u(DEMO_DIMENSIONS.right[0]) // 320

const EXT = 16 // mur extérieur : 160 mm
const INT = 8 // cloison : 80 mm
const HALF_EXT = EXT / 2

/** Ouvertures (unités SVG). */
const WINDOW = { from: 160, to: 360 }
const FRONT_DOOR = { from: 540, to: 620 } // mur bas de l'entrée
const LIVING_DOOR = { from: 330, to: 410 } // cloison x = SPLIT_X
const KITCHEN_DOOR = { from: 770, to: 850 } // cloison y = SPLIT_Y

const WALL = '#a5b4fc' // indigo-300
const LABEL = '#e0e7ff' // indigo-100
const SUBLABEL = '#c7d2fe' // indigo-200

const NUMERIC = { fontVariantNumeric: 'tabular-nums' } as const

/** Petite barre oblique de cote, à la façon des plans d'architecte. */
function tick(x: number, y: number): string {
  return `M${x - 6} ${y + 6}L${x + 6} ${y - 6}`
}

interface ChainProps {
  /** Longueurs successives en mm. */
  lengths: readonly number[]
  orientation: 'horizontal' | 'vertical'
  /** Position de la ligne de cote (y si horizontale, x si verticale). */
  at: number
  /** Côté du texte par rapport à la ligne : -1 avant, +1 après. */
  labelSide: -1 | 1
  /** Bord du mur d'où partent les lignes d'attache. */
  wallEdge: number
  fontSize?: number
}

/** Largeur approximative d'une cote (chiffres tabulaires + « mm »), en unités SVG. */
const labelWidth = (text: string, fontSize: number): number => text.length * fontSize * 0.6

function DimensionChain({ lengths, orientation, at, labelSide, wallEdge, fontSize = 16 }: ChainProps) {
  const stops = lengths.reduce<number[]>((acc, mm) => [...acc, acc[acc.length - 1] + u(mm)], [0])
  const horizontal = orientation === 'horizontal'
  const start = stops[0]
  const end = stops[stops.length - 1]
  const overshoot = Math.sign(at - wallEdge) * 8
  const gap = Math.sign(at - wallEdge) * 6

  const line = horizontal ? `M${start - 10} ${at}H${end + 10}` : `M${at} ${start - 10}V${end + 10}`
  const extensions = stops
    .map((s) =>
      horizontal ? `M${s} ${wallEdge + gap}V${at + overshoot}` : `M${wallEdge + gap} ${s}H${at + overshoot}`,
    )
    .join('')
  const ticks = stops.map((s) => (horizontal ? tick(s, at) : tick(at, s))).join('')

  return (
    <g>
      <path d={extensions} stroke={WALL} strokeOpacity="0.35" strokeWidth="1" fill="none" />
      <path d={line} stroke={WALL} strokeOpacity="0.8" strokeWidth="1.25" fill="none" />
      <path d={ticks} stroke={LABEL} strokeWidth="2" fill="none" />
      {lengths.map((mm, i) => {
        const text = formatLength(mm)
        const mid = (stops[i] + stops[i + 1]) / 2
        const offset = labelSide * 8
        // Segment trop court pour sa cote (dernier segment) : texte posé dans le
        // prolongement de la chaîne, au-delà de sa dernière extrémité.
        const outside = i === lengths.length - 1 && stops[i + 1] - stops[i] < labelWidth(text, fontSize) + 16
        const along = outside ? end + 16 : mid
        return horizontal ? (
          <text
            key={i}
            x={along}
            y={at + offset}
            dominantBaseline={labelSide < 0 ? 'auto' : 'hanging'}
            textAnchor={outside ? 'start' : 'middle'}
            fill={SUBLABEL}
            fontSize={fontSize}
            style={NUMERIC}
          >
            {text}
          </text>
        ) : (
          <text
            key={i}
            x={at + offset}
            y={along}
            transform={`rotate(-90 ${at + offset} ${along})`}
            dominantBaseline={labelSide < 0 ? 'auto' : 'hanging'}
            // Pivoté de -90° : le texte monte, « end » le fait partir vers le bas.
            textAnchor={outside ? 'end' : 'middle'}
            fill={SUBLABEL}
            fontSize={fontSize}
            style={NUMERIC}
          >
            {text}
          </text>
        )
      })}
    </g>
  )
}

/**
 * Le plan propre : murs, ouvertures, pièces avec leur surface calculée et chaînes de cotes.
 * Décoratif : les métrés lisibles par les lecteurs d'écran sont dans `MeasuresCard`.
 */
export default function PlanDrawing({
  viewBox,
  measures,
  compact = false,
  className,
  highlightId = null,
  fault = false,
}: PlanDrawingProps) {
  const nameSize = compact ? 32 : 22
  const areaSize = compact ? 29 : 18
  const dimSize = compact ? 29 : 16
  // Sur téléphone, les cotes passent à l'extérieur des chaînes (place libre entre mur et cote trop étroite).
  const dimSide = compact ? 1 : -1
  // Mur extérieur tracé sur son axe (décalé d'un demi-mur vers l'extérieur),
  // interrompu par la fenêtre (haut) et la porte d'entrée (bas).
  const exterior =
    `M${WINDOW.from} ${-HALF_EXT}H${-HALF_EXT}V${D + HALF_EXT}H${FRONT_DOOR.from}` +
    `M${FRONT_DOOR.to} ${D + HALF_EXT}H${W + HALF_EXT}V${-HALF_EXT}H${WINDOW.to}`

  const partitions =
    `M${SPLIT_X} 0V${LIVING_DOOR.from}M${SPLIT_X} ${LIVING_DOOR.to}V${D}` +
    `M${SPLIT_X + INT / 2} ${SPLIT_Y}H${KITCHEN_DOOR.from}M${KITCHEN_DOOR.to} ${SPLIT_Y}H${W}`

  // Vantaux (trait) et débattements (arc), rayon = largeur du passage.
  const livingR = LIVING_DOOR.to - LIVING_DOOR.from
  const kitchenR = KITCHEN_DOOR.to - KITCHEN_DOOR.from
  const frontR = FRONT_DOOR.to - FRONT_DOOR.from
  const leaves =
    // séjour ↔ entrée : charnière en bas, ouvre côté séjour
    `M${SPLIT_X} ${LIVING_DOOR.to}H${SPLIT_X - livingR}` +
    // cuisine ↔ entrée : charnière à droite, ouvre côté cuisine
    `M${KITCHEN_DOOR.to} ${SPLIT_Y}V${SPLIT_Y - kitchenR}` +
    // porte d'entrée : charnière à gauche, ouvre vers l'intérieur
    `M${FRONT_DOOR.from} ${D}V${D - frontR}`
  const swings =
    `M${SPLIT_X - livingR} ${LIVING_DOOR.to}A${livingR} ${livingR} 0 0 1 ${SPLIT_X} ${LIVING_DOOR.from}` +
    `M${KITCHEN_DOOR.to} ${SPLIT_Y - kitchenR}A${kitchenR} ${kitchenR} 0 0 0 ${KITCHEN_DOOR.from} ${SPLIT_Y}` +
    `M${FRONT_DOOR.from} ${D - frontR}A${frontR} ${frontR} 0 0 1 ${FRONT_DOOR.to} ${D}`

  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <pattern id="intro-plan-grid-minor" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M10 0H0V10" fill="none" stroke={WALL} strokeOpacity="0.06" strokeWidth="0.5" />
        </pattern>
        <pattern id="intro-plan-grid-major" width="100" height="100" patternUnits="userSpaceOnUse">
          <rect width="100" height="100" fill="url(#intro-plan-grid-minor)" />
          <path d="M100 0H0V100" fill="none" stroke={WALL} strokeOpacity="0.12" strokeWidth="0.75" />
        </pattern>
      </defs>
      {/* La grille déborde du viewBox pour couvrir toute la scène. */}
      <rect x="-2000" y="-2000" width="5000" height="5000" fill="url(#intro-plan-grid-major)" />

      {/* Sols des pièces, très légèrement teintés */}
      <rect x="0" y="0" width={W} height={D} fill={WALL} fillOpacity="0.04" />

      {/* Surbrillance de la pièce en cours de démonstration (fondu CSS) */}
      {DEMO_ROOMS.map((room) => (
        <polygon
          key={room.id}
          points={room.points.map((value) => u(value)).join(' ')}
          fill="#818cf8"
          style={{ opacity: highlightId === room.id ? 0.32 : 0, transition: 'opacity 350ms ease-out' }}
        />
      ))}

      {/* Fenêtre du séjour : dormant + vitrage */}
      <rect
        x={WINDOW.from}
        y={-EXT}
        width={WINDOW.to - WINDOW.from}
        height={EXT}
        fill="#1e1b4b"
        stroke={WALL}
        strokeWidth="1.25"
      />
      <path d={`M${WINDOW.from} ${-HALF_EXT}H${WINDOW.to}`} stroke={WALL} strokeWidth="1.25" />

      <path d={exterior} fill="none" stroke={WALL} strokeWidth={EXT} strokeLinejoin="miter" strokeOpacity="0.9" />
      <path d={partitions} fill="none" stroke={WALL} strokeWidth={INT} strokeOpacity="0.9" />
      <path d={leaves} fill="none" stroke={LABEL} strokeWidth="2" strokeLinecap="round" />
      <path d={swings} fill="none" stroke={WALL} strokeWidth="1.25" strokeOpacity="0.6" strokeDasharray="4 4" />

      {/* Défaut de démonstration : deux murs superposés, repérés en orange */}
      <g style={{ opacity: fault ? 1 : 0, transition: 'opacity 450ms ease-out' }}>
        <path
          d={`M${u(DEMO_FAULT.x)} ${u(DEMO_FAULT.fromY)}V${u(DEMO_FAULT.toY)}`}
          stroke="#fb923c"
          strokeWidth={INT + 6}
          strokeLinecap="butt"
          fill="none"
        />
        <circle
          data-fault-ring
          cx={u(DEMO_FAULT.x)}
          cy={(u(DEMO_FAULT.fromY) + u(DEMO_FAULT.toY)) / 2}
          r="16"
          fill="none"
          stroke="#fb923c"
          strokeWidth="2.5"
        />
      </g>

      {/* Pièces : nom et surface calculée au centre */}
      {measures.map((room) => {
        const cx = u(room.center.x)
        const cy = u(room.center.y)
        return (
          <g key={room.id} textAnchor="middle">
            <text x={cx} y={cy - (compact ? 6 : 8)} fill={LABEL} fontSize={nameSize} fontWeight="600">
              {fr.intro.rooms[room.id]}
            </text>
            <text x={cx} y={cy + (compact ? 28 : 18)} fill={SUBLABEL} fontSize={areaSize} style={NUMERIC}>
              {formatArea(room.areaMm2)}
            </text>
          </g>
        )
      })}

      {/* Chaînes de cotes */}
      <DimensionChain
        lengths={DEMO_DIMENSIONS.bottom}
        orientation="horizontal"
        at={D + 52}
        labelSide={dimSide}
        wallEdge={D + EXT}
        fontSize={dimSize}
      />
      <DimensionChain
        lengths={DEMO_DIMENSIONS.right}
        orientation="vertical"
        at={W + 52}
        labelSide={dimSide}
        wallEdge={W + EXT}
        fontSize={dimSize}
      />
      {/* La chaîne de gauche répète le total de droite : omise sur téléphone, faute de place. */}
      {!compact && (
        <DimensionChain lengths={DEMO_DIMENSIONS.left} orientation="vertical" at={-52} labelSide={-1} wallEdge={-EXT} />
      )}
    </svg>
  )
}
