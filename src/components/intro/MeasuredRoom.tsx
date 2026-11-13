import { useSyncExternalStore } from 'react'
import { DEMO_ROOMS, measureDemoRooms } from '../../features/intro/demoPlan'
import { formatArea, formatLength } from '../../features/units/format'
import { fr } from '../../i18n/fr'

/** Échelle du dessin : unités SVG par mm (1000 mm → 100 unités). */
const SCALE = 0.1
/** Épaisseur de mur dessinée, en mm (illustration). */
const WALL_MM = 200
/** Porte vers l'entrée, dans le mur du bas : décalage depuis l'angle et largeur, en mm. */
const DOOR_OFFSET_MM = 600
const DOOR_WIDTH_MM = 900

/** Coin intérieur haut-gauche de la pièce dans le SVG. */
const ORIGIN_X = 140
const ORIGIN_Y = 100
const VIEW_WIDTH = 650
const VIEW_HEIGHT = 460

const INK = '#1e1b4b' // indigo-950
const ACCENT = '#4f46e5' // indigo-600
const MUTED = '#64748b' // slate-500

/** Annotations : colonne de droite. */
const NOTE_X = 540
const NOTE_LEADER_END = 532

/** Sous `sm` (téléphones), le dessin est rendu en version compacte, textes agrandis. */
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

/** Petit trait oblique à 45° qui termine une ligne de cote. */
function tick(x: number, y: number): string {
  return `M${x - 5} ${y + 5}L${x + 5} ${y - 5}`
}

/**
 * La cuisine du plan de démonstration, dessinée en grand avec ses métrés annotés :
 * surface, périmètre et longueur des deux murs. Toutes les valeurs sont calculées.
 */
export default function MeasuredRoom() {
  const compact = useCompact()
  const room = DEMO_ROOMS.find((r) => r.id === 'cuisine')
  const measure = measureDemoRooms().find((m) => m.id === 'cuisine')
  if (!room || !measure) return null

  const xs = room.points.filter((_, i) => i % 2 === 0)
  const ys = room.points.filter((_, i) => i % 2 === 1)
  const widthMm = Math.max(...xs) - Math.min(...xs)
  const depthMm = Math.max(...ys) - Math.min(...ys)

  const w = widthMm * SCALE
  const h = depthMm * SCALE
  const t = WALL_MM * SCALE
  const left = ORIGIN_X
  const top = ORIGIN_Y
  const right = left + w
  const bottom = top + h
  const doorL = left + DOOR_OFFSET_MM * SCALE
  const doorR = doorL + DOOR_WIDTH_MM * SCALE
  const door = DOOR_WIDTH_MM * SCALE

  // Mur en « C » ouvert sur la porte : un seul contour, sans raccord visible.
  const wallPath = [
    `M${doorL} ${bottom + t}`,
    `H${left - t}V${top - t}H${right + t}V${bottom + t}H${doorR}`,
    `V${bottom}H${right}V${top}H${left}V${bottom}H${doorL}Z`,
  ].join('')

  const areaText = formatArea(measure.areaMm2)
  const perimeterText = formatLength(measure.perimeterMm)
  const widthText = formatLength(widthMm)
  const depthText = formatLength(depthMm)

  const label = `${fr.intro.rooms.cuisine} : ${fr.intro.area} ${areaText}, ${fr.intro.perimeter} ${perimeterText}, ${fr.intro.wall} ${widthText}, ${fr.intro.wall} ${depthText}`

  // Cotes : ligne du haut (largeur) et ligne de gauche (profondeur).
  const topDimY = top - t - 30
  const leftDimX = left - t - 30
  // Tracé du périmètre, légèrement en retrait du nu intérieur.
  const inset = 8
  const centerX = (left + right) / 2
  const centerY = (top + bottom) / 2 - 20
  const areaNoteY = 200
  const perimeterNoteY = 330
  const perimeterDot = { x: right - inset, y: bottom - 50 }

  // Version compacte : cadrage serré sur la pièce (pas de colonne de notes), textes plus
  // grands et notes posées dans la pièce, pour rester lisibles une fois le dessin réduit.
  const viewBox = compact
    ? `${leftDimX - 35} ${topDimY - 35} ${right + t + 15 - (leftDimX - 35)} ${bottom + t + 15 - (topDimY - 35)}`
    : `0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`
  const dimLabelSize = compact ? 17 : 16
  const dimValueSize = compact ? 18 : 16
  const depthMidY = (top + bottom) / 2
  const compactPerimeterY = bottom - 48
  const compactPerimeterTextX = right - inset - 18

  return (
    <svg
      viewBox={viewBox}
      role="img"
      aria-label={label}
      className="mx-auto block h-auto w-full max-w-[650px]"
      style={{ fontVariantNumeric: 'tabular-nums' }}
    >
      <defs>
        <pattern
          id="measured-room-grid"
          x={left}
          y={top}
          width="50"
          height="50"
          patternUnits="userSpaceOnUse"
        >
          <path d="M50 0H0V50" fill="none" stroke={ACCENT} strokeOpacity="0.09" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width={VIEW_WIDTH} height={VIEW_HEIGHT} fill="url(#measured-room-grid)" />

      {/* Sol de la pièce : la surface mesurée */}
      <rect x={left} y={top} width={w} height={h} fill={ACCENT} fillOpacity="0.05" />

      {/* Murs, épaisseur visible */}
      <path d={wallPath} fill={INK} fillOpacity="0.12" stroke={INK} strokeWidth="2" strokeLinejoin="miter" />

      {/* Porte : vantail et débattement */}
      <path
        d={`M${doorL} ${bottom}V${bottom - door}A${door} ${door} 0 0 1 ${doorR} ${bottom}`}
        fill="none"
        stroke={INK}
        strokeWidth="1.5"
        strokeOpacity="0.75"
      />

      {/* Tracé du périmètre */}
      <rect
        x={left + inset}
        y={top + inset}
        width={w - inset * 2}
        height={h - inset * 2}
        fill="none"
        stroke={ACCENT}
        strokeWidth="1.25"
        strokeDasharray="6 5"
        strokeOpacity="0.7"
      />

      {/* Cote du haut : largeur */}
      <g stroke={ACCENT} strokeWidth="1.25" fill="none">
        <path d={`M${left} ${top - t - 6}V${topDimY - 8}M${right} ${top - t - 6}V${topDimY - 8}`} strokeOpacity="0.6" />
        <path d={`M${left - 8} ${topDimY}H${right + 8}`} />
        <path d={`${tick(left, topDimY)}${tick(right, topDimY)}`} strokeWidth="2" />
      </g>
      <text x={centerX} y={topDimY - 12} textAnchor="middle" fontSize={dimLabelSize}>
        <tspan fill={MUTED}>{fr.intro.wall} </tspan>
        <tspan fill={INK} fontWeight="600" fontSize={dimValueSize}>
          {widthText}
        </tspan>
      </text>

      {/* Cote de gauche : profondeur */}
      <g stroke={ACCENT} strokeWidth="1.25" fill="none">
        <path d={`M${left - t - 6} ${top}H${leftDimX - 8}M${left - t - 6} ${bottom}H${leftDimX - 8}`} strokeOpacity="0.6" />
        <path d={`M${leftDimX} ${top - 8}V${bottom + 8}`} />
        <path d={`${tick(leftDimX, top)}${tick(leftDimX, bottom)}`} strokeWidth="2" />
      </g>
      {compact ? (
        // Texte de cote couché le long de la ligne, comme sur un plan.
        <text
          x={leftDimX - 12}
          y={depthMidY}
          transform={`rotate(-90 ${leftDimX - 12} ${depthMidY})`}
          textAnchor="middle"
          fontSize={dimLabelSize}
        >
          <tspan fill={MUTED}>{fr.intro.wall} </tspan>
          <tspan fill={INK} fontWeight="600" fontSize={dimValueSize}>
            {depthText}
          </tspan>
        </text>
      ) : (
        <>
          <text x={leftDimX - 14} y={depthMidY - 4} textAnchor="end" fontSize="16" fill={MUTED}>
            {fr.intro.wall}
          </text>
          <text x={leftDimX - 14} y={depthMidY + 17} textAnchor="end" fontSize="16" fill={INK} fontWeight="600">
            {depthText}
          </text>
        </>
      )}

      {compact ? (
        <>
          {/* Annotation : surface, au centre du sol mesuré */}
          <text x={centerX} y={centerY - 4} textAnchor="middle" fontSize="17" fill={MUTED}>
            {fr.intro.area}
          </text>
          <text x={centerX} y={centerY + 22} textAnchor="middle" fontSize="22" fill={INK} fontWeight="600">
            {areaText}
          </text>

          {/* Annotation : périmètre, reliée au tracé pointillé */}
          <path
            d={`M${compactPerimeterTextX + 6} ${compactPerimeterY}H${right - inset}`}
            stroke={ACCENT}
            strokeWidth="1.25"
            fill="none"
          />
          <circle cx={right - inset} cy={compactPerimeterY} r="4" fill={ACCENT} />
          <text x={compactPerimeterTextX} y={compactPerimeterY - 6} textAnchor="end" fontSize="17" fill={MUTED}>
            {fr.intro.perimeter}
          </text>
          <text
            x={compactPerimeterTextX}
            y={compactPerimeterY + 19}
            textAnchor="end"
            fontSize="22"
            fill={INK}
            fontWeight="600"
          >
            {perimeterText}
          </text>
        </>
      ) : (
        <>
          {/* Annotation : surface */}
          <g stroke={ACCENT} strokeWidth="1.25" fill="none">
            <path d={`M${centerX} ${centerY}L${NOTE_LEADER_END - 12} ${areaNoteY}H${NOTE_LEADER_END}`} />
          </g>
          <circle cx={centerX} cy={centerY} r="4" fill={ACCENT} />
          <text x={NOTE_X} y={areaNoteY - 6} fontSize="14" fill={MUTED}>
            {fr.intro.area}
          </text>
          <text x={NOTE_X} y={areaNoteY + 17} fontSize="20" fill={INK} fontWeight="600">
            {areaText}
          </text>
    
          {/* Annotation : périmètre */}
          <g stroke={ACCENT} strokeWidth="1.25" fill="none">
            <path d={`M${perimeterDot.x} ${perimeterDot.y}L${NOTE_LEADER_END - 12} ${perimeterNoteY}H${NOTE_LEADER_END}`} />
          </g>
          <circle cx={perimeterDot.x} cy={perimeterDot.y} r="4" fill={ACCENT} />
          <text x={NOTE_X} y={perimeterNoteY - 6} fontSize="14" fill={MUTED}>
            {fr.intro.perimeter}
          </text>
          <text x={NOTE_X} y={perimeterNoteY + 17} fontSize="20" fill={INK} fontWeight="600">
            {perimeterText}
          </text>
        </>
      )}
    </svg>
  )
}
