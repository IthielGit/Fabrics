import { DEMO_PLAN_SIZE, DEMO_ROOMS } from '../../features/intro/demoPlan'
import { formatLength } from '../../features/units/format'
import { fr } from '../../i18n/fr'

/*
 * Planche d'illustration : plan du rez-de-chaussée, façade sud et coupe A-A d'une petite
 * maison R+1, à la même échelle, posées sur une même ligne de sol. Les cotes d'entrée sont
 * en mm, dans le repère du plan de démonstration (0 = nu intérieur du mur ouest / nord).
 * Les trois vues ont la même largeur de colonne : sur écran large, elles se touchent et la
 * ligne de sol devient continue ; sous `md`, elles s'empilent.
 */

/** Unités SVG par mm. */
const SCALE = 0.03
/** Épaisseur des murs extérieurs, en mm. */
const EXT = 300
/** Demi-épaisseur des cloisons, en mm. */
const PART = 50
/** Hauteur d'étage (sol à sol), épaisseur de dalle, hauteur à l'égout, en mm. */
const STOREY = 2900
const SLAB = 200
const EAVE = 2 * STOREY
/** Débord de toiture et pente. */
const OVERHANG = 300
const PITCH_DEG = 35
const ROOF_THICK = 250

/** Escalier droit le long du mur nord du séjour (montée d'ouest en est). */
const STAIR = { x: 1000, depth: 1000, treads: 12, going: 230 } as const
/** Coupe A-A : ligne de coupe est-ouest à travers l'escalier, en mm depuis le mur nord. */
const CUT_Y = 500

/** Ouvertures du mur sud, en mm (x de début, x de fin, allège, hauteur sous linteau). */
interface Opening {
  from: number
  to: number
  sill: number
  head: number
}
const GROUND_WINDOW: Opening = { from: 700, to: 1900, sill: 900, head: 2250 }
const FRENCH_DOOR: Opening = { from: 2800, to: 4600, sill: 0, head: 2250 }
const FRONT_DOOR: Opening = { from: 6500, to: 7400, sill: 0, head: 2150 }
const UPPER_WINDOWS: readonly Opening[] = [
  { from: 700, to: 1900, sill: STOREY + 900, head: STOREY + 2150 },
  { from: 3100, to: 4300, sill: STOREY + 900, head: STOREY + 2150 },
  { from: 6350, to: 7550, sill: STOREY + 900, head: STOREY + 2150 },
]

const COLUMN_WIDTH = 380
const TOP_MARGIN = 24
/** Sous la ligne de sol : place pour la chaîne de cote du plan (même marge dans les trois vues). */
const BOTTOM_MARGIN = 32
/**
 * Décalage horizontal de la façade (vers la droite) et de la coupe (vers la gauche) : libère
 * à l'extérieur la place des niveaux, sans que le débord de toit ne sorte de la colonne.
 */
const LEVEL_SHIFT = 18

const STROKE = '#a5b4fc' // indigo-300
const LABEL = '#c7d2fe' // indigo-200
/** Corps des cotes et niveaux, en unités SVG (≈ 12 px à 1440 px de large, ≈ 10 px sur téléphone). */
const LABEL_SIZE = 12.5
const labelStyle = { fontVariantNumeric: 'tabular-nums' } as const

const width = DEMO_PLAN_SIZE.width
const depth = DEMO_PLAN_SIZE.depth
const footprint = (width + 2 * EXT) * SCALE
const originX = (COLUMN_WIDTH - footprint) / 2
const PITCH_TAN = Math.tan((PITCH_DEG * Math.PI) / 180)
/** Hauteur du pignon au-dessus de l'égout (nu extérieur du mur → faîtage). */
const roofRise = (width / 2 + EXT) * PITCH_TAN
const ridgeZ = EAVE + roofRise + ROOF_THICK
const elevationHeight = TOP_MARGIN + ridgeZ * SCALE + BOTTOM_MARGIN
const planHeight = TOP_MARGIN + (depth + 2 * EXT) * SCALE + BOTTOM_MARGIN

/** x en mm → x SVG (commun aux trois vues). */
function sx(mm: number): number {
  return originX + (mm + EXT) * SCALE
}

/** Coordonnées « mm » d'un rectangle → attributs SVG, avec une fonction y propre à la vue. */
function rectProps(x0: number, x1: number, a: number, b: number, sy: (mm: number) => number) {
  const ya = sy(a)
  const yb = sy(b)
  return { x: sx(x0), y: Math.min(ya, yb), width: (x1 - x0) * SCALE, height: Math.abs(yb - ya) }
}

function GroundLine({ y }: { y: number }) {
  return <path d={`M0 ${y}H${COLUMN_WIDTH}`} stroke={STROKE} strokeWidth="2" />
}

/** Marge entre un niveau et le bord de la colonne, en unités SVG. */
const EDGE_PAD = 3

/**
 * Niveau d'altitude (repère de niveau) : triangle plein posé sur le trait de niveau, texte
 * au-dessus du triangle, trait de rappel jusqu'au bâtiment (`toX`).
 */
function LevelDatum({ y, side, toX, label }: { y: number; side: 'left' | 'right'; toX: number; label: string }) {
  const left = side === 'left'
  const textX = left ? EDGE_PAD : COLUMN_WIDTH - EDGE_PAD
  const markX = left ? EDGE_PAD + 5 : COLUMN_WIDTH - EDGE_PAD - 5
  return (
    <g>
      <path d={`M${markX} ${y}H${toX}`} stroke={STROKE} strokeWidth="1" strokeOpacity="0.7" />
      <path d={`M${markX} ${y}L${markX - 4} ${y - 6}H${markX + 4}Z`} fill={STROKE} />
      <text
        x={textX}
        y={y - 9}
        fill={LABEL}
        fontSize={LABEL_SIZE}
        textAnchor={left ? 'start' : 'end'}
        style={labelStyle}
      >
        {label}
      </text>
    </g>
  )
}

/** Niveaux communs à la façade et à la coupe : rez ±0, étage, faîtage. */
function Levels({ groundY, side, shift }: { groundY: number; side: 'left' | 'right'; shift: number }) {
  const left = side === 'left'
  const wallX = (left ? sx(-EXT) - 4 : sx(width + EXT) + 4) + shift
  const sz = (mm: number) => groundY - mm * SCALE
  return (
    <>
      <LevelDatum y={groundY} side={side} toX={wallX} label="±0 mm" />
      <LevelDatum y={sz(STOREY)} side={side} toX={wallX} label={`+${formatLength(STOREY)}`} />
      <LevelDatum y={sz(ridgeZ)} side={side} toX={sx(width / 2) + shift} label={`+${formatLength(ridgeZ)}`} />
    </>
  )
}

/** Profil du pignon (identique en façade et en coupe) : sommet du mur et rive de toit. */
function gablePoints(): { wall: string; verge: string } {
  const mid = width / 2
  const wall = [
    [-EXT, 0],
    [-EXT, EAVE],
    [mid, EAVE + roofRise],
    [width + EXT, EAVE],
    [width + EXT, 0],
  ]
    .map(([x, z]) => `${x},${z}`)
    .join(' ')
  const verge = [
    [-EXT - OVERHANG, EAVE + ROOF_THICK - OVERHANG * PITCH_TAN],
    [mid, EAVE + ROOF_THICK + roofRise],
    [width + EXT + OVERHANG, EAVE + ROOF_THICK - OVERHANG * PITCH_TAN],
  ]
    .map(([x, z]) => `${x},${z}`)
    .join(' ')
  return { wall, verge }
}

/** Convertit une liste « x,z » en mm vers des points SVG pour une ligne de sol donnée. */
function toSvgPoints(list: string, groundY: number): string {
  return list
    .split(' ')
    .map((pair) => {
      const [x, z] = pair.split(',').map(Number)
      return `${sx(x)},${groundY - z * SCALE}`
    })
    .join(' ')
}

function PlanView() {
  const groundY = planHeight - BOTTOM_MARGIN
  const sy = (mm: number) => groundY - (depth + EXT - mm) * SCALE
  const fill = { fill: STROKE, fillOpacity: 0.85 }

  // Mur sud découpé par les ouvertures.
  const southGaps = [GROUND_WINDOW, FRENCH_DOOR, FRONT_DOOR]
  const southSegments: Array<[number, number]> = []
  let cursor = -EXT
  for (const gap of southGaps) {
    southSegments.push([cursor, gap.from])
    cursor = gap.to
  }
  southSegments.push([cursor, width + EXT])

  const cuisine = DEMO_ROOMS.find((r) => r.id === 'cuisine')
  const splitX = cuisine ? cuisine.points[0] : width / 2 // limite séjour / cuisine
  const kitchenDepth = cuisine ? cuisine.points[5] : depth / 2 // limite cuisine / entrée
  const innerDoor = { from: width - 1200, to: width - 300 }

  const stairEnd = STAIR.x + STAIR.treads * STAIR.going
  const treadLines = Array.from({ length: STAIR.treads - 1 }, (_, i) => STAIR.x + (i + 1) * STAIR.going)
  const leaf = (FRONT_DOOR.to - FRONT_DOOR.from) * SCALE
  const halfLeaf = ((FRENCH_DOOR.to - FRENCH_DOOR.from) / 2) * SCALE
  const innerLeaf = (innerDoor.to - innerDoor.from) * SCALE
  const cutY = sy(CUT_Y)
  const southInner = sy(depth)
  /** Ligne de cote, sous la ligne de sol. */
  const dimY = 24

  return (
    <svg viewBox={`0 0 ${COLUMN_WIDTH} ${planHeight}`} aria-hidden="true" focusable="false" className="block h-auto w-full">
      {/* Murs extérieurs */}
      <rect {...rectProps(-EXT, width + EXT, -EXT, 0, sy)} {...fill} />
      <rect {...rectProps(-EXT, 0, 0, depth, sy)} {...fill} />
      <rect {...rectProps(width, width + EXT, 0, depth, sy)} {...fill} />
      {southSegments.map(([a, b]) => (
        <rect key={a} {...rectProps(a, b, depth, depth + EXT, sy)} {...fill} />
      ))}
      {/* Cloisons */}
      <rect {...rectProps(splitX - PART, splitX + PART, 0, 1400, sy)} {...fill} />
      <rect {...rectProps(splitX - PART, splitX + PART, 2300, kitchenDepth + PART, sy)} {...fill} />
      <rect {...rectProps(splitX + PART, innerDoor.from, kitchenDepth - PART, kitchenDepth + PART, sy)} {...fill} />
      <rect {...rectProps(innerDoor.to, width, kitchenDepth - PART, kitchenDepth + PART, sy)} {...fill} />

      <g fill="none" stroke={STROKE} strokeWidth="1" strokeOpacity="0.8">
        {/* Fenêtre : deux traits dans l'épaisseur du mur */}
        <path
          d={`M${sx(GROUND_WINDOW.from)} ${sy(depth + 100)}H${sx(GROUND_WINDOW.to)}M${sx(GROUND_WINDOW.from)} ${sy(depth + 200)}H${sx(GROUND_WINDOW.to)}`}
        />
        {/* Porte-fenêtre à deux vantaux */}
        <path
          d={`M${sx(FRENCH_DOOR.from)} ${southInner}V${southInner - halfLeaf}A${halfLeaf} ${halfLeaf} 0 0 1 ${sx(FRENCH_DOOR.from) + halfLeaf} ${southInner}M${sx(FRENCH_DOOR.to)} ${southInner}V${southInner - halfLeaf}A${halfLeaf} ${halfLeaf} 0 0 0 ${sx(FRENCH_DOOR.to) - halfLeaf} ${southInner}`}
        />
        {/* Porte d'entrée */}
        <path
          d={`M${sx(FRONT_DOOR.from)} ${southInner}V${southInner - leaf}A${leaf} ${leaf} 0 0 1 ${sx(FRONT_DOOR.to)} ${southInner}`}
        />
        {/* Porte cuisine */}
        <path
          d={`M${sx(innerDoor.from)} ${sy(kitchenDepth - PART)}V${sy(kitchenDepth - PART) - innerLeaf}A${innerLeaf} ${innerLeaf} 0 0 1 ${sx(innerDoor.to)} ${sy(kitchenDepth - PART)}`}
        />
        {/* Escalier : contour, marches, ligne de foulée */}
        <rect {...rectProps(STAIR.x, stairEnd, 0, STAIR.depth, sy)} />
        <path d={treadLines.map((x) => `M${sx(x)} ${sy(0)}V${sy(STAIR.depth)}`).join('')} strokeOpacity="0.55" />
        <path
          d={`M${sx(STAIR.x + 100)} ${sy(STAIR.depth / 2)}H${sx(stairEnd - 150)}M${sx(stairEnd - 150) - 5} ${sy(STAIR.depth / 2) - 3.5}L${sx(stairEnd - 150)} ${sy(STAIR.depth / 2)}L${sx(stairEnd - 150) - 5} ${sy(STAIR.depth / 2) + 3.5}`}
        />
      </g>

      {/* Ligne de coupe A-A, flèches tournées vers le nord */}
      <path
        d={`M${sx(-EXT) - 12} ${cutY}H${sx(width + EXT) + 12}`}
        stroke={STROKE}
        strokeWidth="1"
        strokeDasharray="10 3 2 3"
        strokeOpacity="0.9"
      />
      {[sx(-EXT) - 12, sx(width + EXT) + 12].map((x) => (
        <path key={x} d={`M${x - 5} ${cutY}L${x} ${cutY - 8}L${x + 5} ${cutY}Z`} fill={STROKE} />
      ))}

      {/* Cote d'ensemble sous le plan : largeur intérieure, nu à nu des murs est et ouest */}
      <g stroke={STROKE} strokeWidth="1">
        <path
          d={`M${sx(0)} ${groundY + 5}V${groundY + dimY + 4}M${sx(width)} ${groundY + 5}V${groundY + dimY + 4}M${sx(0) - 6} ${groundY + dimY}H${sx(width) + 6}`}
          strokeOpacity="0.7"
        />
        {[sx(0), sx(width)].map((x) => (
          <path key={x} d={`M${x - 3.5} ${groundY + dimY + 3.5}L${x + 3.5} ${groundY + dimY - 3.5}`} strokeWidth="1.5" />
        ))}
      </g>
      <text
        x={sx(width / 2)}
        y={groundY + dimY - 4}
        fill={LABEL}
        fontSize={LABEL_SIZE}
        textAnchor="middle"
        style={labelStyle}
      >
        {formatLength(width)}
      </text>

      {/* Le plan repose sur la ligne de sol commune */}
      <GroundLine y={groundY} />
    </svg>
  )
}

function FacadeView() {
  const groundY = elevationHeight - BOTTOM_MARGIN
  const sz = (mm: number) => groundY - mm * SCALE
  const { wall, verge } = gablePoints()
  const openings = [GROUND_WINDOW, FRENCH_DOOR, FRONT_DOOR, ...UPPER_WINDOWS]
  const ocZ = EAVE + roofRise * 0.4

  return (
    <svg viewBox={`0 0 ${COLUMN_WIDTH} ${elevationHeight}`} aria-hidden="true" focusable="false" className="block h-auto w-full">
      <Levels groundY={groundY} side="left" shift={LEVEL_SHIFT} />
      <g fill="none" stroke={STROKE} strokeLinejoin="miter" transform={`translate(${LEVEL_SHIFT} 0)`}>
        <polygon points={toSvgPoints(wall, groundY)} strokeWidth="1.5" />
        <polyline points={toSvgPoints(verge, groundY)} strokeWidth="3" />
        {/* Bandeau d'étage */}
        <path d={`M${sx(-EXT)} ${sz(STOREY)}H${sx(width + EXT)}`} strokeWidth="1" strokeOpacity="0.4" />
        {openings.map((o) => {
          const r = rectProps(o.from, o.to, o.sill, o.head, sz)
          const midX = r.x + r.width / 2
          const isDoor = o === FRONT_DOOR
          return (
            <g key={`${o.from}-${o.sill}`} strokeWidth="1.25">
              <rect {...r} />
              {isDoor ? (
                <path d={`M${r.x + r.width - 4} ${r.y + r.height / 2}h-2`} strokeWidth="1.5" />
              ) : (
                <path d={`M${midX} ${r.y}V${r.y + r.height}`} strokeOpacity="0.6" strokeWidth="1" />
              )}
            </g>
          )
        })}
        {/* Œil-de-bœuf du pignon */}
        <circle cx={sx(width / 2)} cy={sz(ocZ)} r={350 * SCALE} strokeWidth="1.25" />
      </g>
      <GroundLine y={groundY} />
    </svg>
  )
}

function SectionView() {
  const groundY = elevationHeight - BOTTOM_MARGIN
  const sz = (mm: number) => groundY - mm * SCALE
  const { verge } = gablePoints()
  const fill = { fill: STROKE, fillOpacity: 0.85 }

  const cuisine = DEMO_ROOMS.find((r) => r.id === 'cuisine')
  const splitX = cuisine ? cuisine.points[0] : width / 2
  const stairEnd = STAIR.x + STAIR.treads * STAIR.going
  const risers = STAIR.treads + 1
  const rise = STOREY / risers

  // Profil de l'escalier : contremarche, marche, … puis sous-face jusqu'au départ.
  const steps: string[] = [`${sx(STAIR.x)},${sz(0)}`]
  for (let i = 0; i < risers; i++) {
    const x = STAIR.x + i * STAIR.going
    steps.push(`${sx(x)},${sz((i + 1) * rise)}`)
    if (i < risers - 1) steps.push(`${sx(x + STAIR.going)},${sz((i + 1) * rise)}`)
  }
  steps.push(`${sx(stairEnd)},${sz(STOREY - SLAB)}`, `${sx(STAIR.x + 2 * STAIR.going)},${sz(0)}`)

  return (
    <svg viewBox={`0 0 ${COLUMN_WIDTH} ${elevationHeight}`} aria-hidden="true" focusable="false" className="block h-auto w-full">
      <Levels groundY={groundY} side="right" shift={-LEVEL_SHIFT} />
      <g transform={`translate(${-LEVEL_SHIFT} 0)`}>
        {/* Murs coupés */}
        <rect {...rectProps(-EXT, 0, 0, EAVE, sz)} {...fill} />
        <rect {...rectProps(width, width + EXT, 0, EAVE, sz)} {...fill} />
        {/* Dalles : sol, étage (trémie au-dessus de l'escalier), plafond des combles */}
        <rect {...rectProps(-EXT, width + EXT, -SLAB, 0, sz)} {...fill} />
        <rect {...rectProps(0, STAIR.x, STOREY - SLAB, STOREY, sz)} {...fill} />
        <rect {...rectProps(stairEnd, width, STOREY - SLAB, STOREY, sz)} {...fill} />
        <rect {...rectProps(0, width, EAVE - SLAB, EAVE, sz)} {...fill} />
        {/* Cloison coupée */}
        <rect {...rectProps(splitX - PART, splitX + PART, 0, STOREY - SLAB, sz)} {...fill} />
        {/* Escalier droit */}
        <polygon points={steps.join(' ')} {...fill} />
        {/* Toiture coupée */}
        <polyline
          points={toSvgPoints(verge, groundY)}
          fill="none"
          stroke={STROKE}
          strokeWidth="4"
          strokeLinejoin="miter"
        />
      </g>
      <GroundLine y={groundY} />
    </svg>
  )
}

const VIEWS = [
  { key: 'plan', View: PlanView, caption: fr.intro.views.plan },
  { key: 'facade', View: FacadeView, caption: fr.intro.views.facade },
  { key: 'section', View: SectionView, caption: fr.intro.views.section },
] as const

/** Planche plan / façade / coupe d'une même maison, sur fond indigo. */
export default function BuildingViews() {
  return (
    <div className="border border-indigo-300/40 bg-[linear-gradient(to_right,rgb(165_180_252/0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgb(165_180_252/0.07)_1px,transparent_1px)] bg-[size:24px_24px] py-6">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:gap-0">
        {VIEWS.map(({ key, View, caption }) => (
          <figure key={key} className="flex min-w-0 flex-1 flex-col">
            <View />
            <figcaption className="mt-3 px-2 text-center text-sm text-indigo-200">{caption}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
