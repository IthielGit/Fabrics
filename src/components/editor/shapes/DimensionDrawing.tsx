import { Group, Line, Rect, Text } from 'react-konva'
import { dimensionTextRow } from '../../../features/dimensioning/layout'
import { dimensionGeometry } from '../../../features/geometry/dimension'
import { formatLength } from '../../../features/units/format'

const COLOR = '#111827'
/** Longueur d'un trait oblique aux extrémités de la ligne de cote (mm). */
const TICK_MM = 120
/** Écart entre l'objet mesuré et le début de la ligne d'attache, en mm (elle ne le touche pas). */
const EXTENSION_GAP_MM = 100
/** Hauteur du texte par défaut, en mm sur le plan. */
const TEXT_FONT_MM = 180
const TEXT_MIN_PX = 9
/** L'unité est plus petite et plus claire que le chiffre. */
const UNIT_SCALE = 0.65
const UNIT_COLOR = '#6b7280'
const UNIT_GAP_EM = 0.2
/** Largeur moyenne d'un caractère, en multiples de la taille de police (police sans empattement). */
const CHAR_WIDTH_EM = 0.56
/** En dessous de cette longueur à l'écran (px), la cote est trop courte pour porter l'unité. */
const MIN_UNIT_LENGTH_PX = 90

interface DimensionDrawingProps {
  points: readonly [number, number, number, number]
  offset: number
  viewScale: number
  /** Hauteur du texte en mm sur le plan (jamais sous 9 px à l'écran). */
  fontMm?: number
  /** Affiche « mm » après le chiffre quand la cote est assez longue (cotes tracées à la main). */
  withUnit?: boolean
  /** Zone de clic autour de la ligne de cote, en pixels écran ; absente : pas de clic. */
  hitWidthPx?: number
  /**
   * Cotes automatiques : un chiffre qui ne tient pas entre les traits passe un rang plus haut ou
   * sous la ligne selon ce rang dans la chaîne, sur un fond blanc qui le garde lisible.
   */
  chainIndex?: number
  /** Fond blanc derrière le chiffre (cotes automatiques, posées sur les murs et les meubles). */
  textBackground?: boolean
}

/** Position verticale du haut du texte, en multiples de sa hauteur, selon le rang choisi. */
const ROW_TOP_EM = { above: -1.25, above2: -2.45, below: 0.3 } as const

/** Dessin d'une cote : ligne décalée, lignes d'attache, traits obliques et longueur en mm. */
export default function DimensionDrawing({
  points,
  offset,
  viewScale,
  fontMm = TEXT_FONT_MM,
  withUnit = true,
  hitWidthPx,
  chainIndex,
  textBackground = false,
}: DimensionDrawingProps) {
  const geometry = dimensionGeometry(points, offset)
  if (!geometry) return null

  const { line, extensions, center, textAngle, direction, normal, length } = geometry
  const thin = 1.5 / viewScale
  const fontSize = Math.max(fontMm, TEXT_MIN_PX / viewScale)

  // Trait oblique à 45° à chaque extrémité de la ligne de cote.
  const tickVector = {
    x: ((direction.x + normal.x) / Math.SQRT2) * TICK_MM,
    y: ((direction.y + normal.y) / Math.SQRT2) * TICK_MM,
  }
  const ticks = line.map((p) => [
    p.x - tickVector.x,
    p.y - tickVector.y,
    p.x + tickVector.x,
    p.y + tickVector.y,
  ])

  // Les lignes d'attache commencent un peu avant l'objet mesuré, comme sur un plan coté.
  const gap = Math.min(EXTENSION_GAP_MM, Math.abs(offset) / 2) * (offset < 0 ? -1 : 1)
  const spacedExtensions = extensions.map(([from, to]) => [
    { x: from.x + normal.x * gap, y: from.y + normal.y * gap },
    to,
  ])

  // Texte : « 3500 » (+ « mm » en petit), centré sur la ligne de cote.
  const full = formatLength(length)
  const unit = full.slice(full.lastIndexOf(' ') + 1)
  const value = full.slice(0, full.lastIndexOf(' '))
  const showUnit = withUnit && length * viewScale >= MIN_UNIT_LENGTH_PX
  const valueWidth = value.length * CHAR_WIDTH_EM * fontSize
  const unitWidth = showUnit
    ? unit.length * CHAR_WIDTH_EM * fontSize * UNIT_SCALE + UNIT_GAP_EM * fontSize
    : 0
  const textStart = -(valueWidth + unitWidth) / 2
  // Cotes tracées à la main : toujours au-dessus ; cotes automatiques : selon la place disponible.
  const row = chainIndex === undefined ? 'above' : dimensionTextRow(length, value, fontSize, chainIndex)
  const textTop = ROW_TOP_EM[row] * fontSize

  const flat = (a: { x: number; y: number }, b: { x: number; y: number }) => [a.x, a.y, b.x, b.y]

  return (
    <>
      <Line
        points={flat(line[0], line[1])}
        stroke={COLOR}
        strokeWidth={thin}
        hitStrokeWidth={hitWidthPx !== undefined ? hitWidthPx / viewScale : undefined}
      />
      {spacedExtensions.map(([from, to], i) => (
        <Line key={`ext-${i}`} points={flat(from, to)} stroke={COLOR} strokeWidth={thin / 1.5} />
      ))}
      {ticks.map((tick, i) => (
        <Line key={`tick-${i}`} points={tick} stroke={COLOR} strokeWidth={thin * 1.2} />
      ))}
      <Group x={center.x} y={center.y} rotation={textAngle} listening={false}>
        {textBackground && (
          <Rect
            x={textStart - fontSize * 0.15}
            y={textTop + fontSize * 0.05}
            width={valueWidth + unitWidth + fontSize * 0.3}
            height={fontSize * 1.05}
            fill="#ffffff"
            opacity={0.85}
          />
        )}
        {/* Le chiffre à la taille normale, l'unité plus petite et plus claire pour ne pas encombrer. */}
        <Text
          x={textStart}
          y={textTop}
          text={value}
          fontSize={fontSize}
          fill={COLOR}
          wrap="none"
        />
        {showUnit && (
          <Text
            x={textStart + valueWidth + UNIT_GAP_EM * fontSize}
            y={textTop + fontSize * (1 - UNIT_SCALE) * 0.9}
            text={unit}
            fontSize={fontSize * UNIT_SCALE}
            fill={UNIT_COLOR}
            wrap="none"
          />
        )}
      </Group>
    </>
  )
}
