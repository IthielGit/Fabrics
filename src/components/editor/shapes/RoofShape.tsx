import { useMemo } from 'react'
import { Arrow, Group, Line, Text } from 'react-konva'
import { computeRoof, roofPlanOutline } from '../../../features/building/roof'
import { flattenPoints } from '../../../features/geometry/polygon'
import type { Point } from '../../../features/geometry/viewport'
import { fr } from '../../../i18n/fr'
import { useEditorStore } from '../../../stores/editorStore'
import type { RoofElement } from '../../../types/document'
import type { ShapeInteraction } from './shapeTypes'

interface RoofShapeProps extends ShapeInteraction {
  element: RoofElement
}

const INK = '#57534e'
const SELECTED = '#4f46e5'
const INVALID = '#dc2626'
/** Flèche de pente : longueur sur le plan (mm), bornée par la taille du versant. */
const ARROW_MM = 900
/** Texte de la pente : 20 cm sur le plan, jamais sous 10 px à l'écran. */
const LABEL_FONT_MM = 200
const LABEL_MIN_PX = 10

/** Centre d'un versant vu de dessus. */
function planCentroid(points: readonly { x: number; z: number }[]): Point {
  const n = points.length || 1
  return {
    x: points.reduce((sum, p) => sum + p.x, 0) / n,
    y: points.reduce((sum, p) => sum + p.z, 0) / n,
  }
}

/**
 * Toiture vue de dessus : contour au nu extérieur des murs, débord en pointillé, faîtage et arêtiers
 * en trait fort, une flèche par versant dans le sens de la pente (vers le bas) avec la pente en
 * degrés. Contour rouge si la toiture n'est pas valable (toit en pente sur un contour qui n'est pas
 * un rectangle). Pas de remplissage : on clique sur ses traits, et le plan reste lisible dessous.
 */
export default function RoofShape({
  element,
  interactive,
  viewScale,
  onPointerDown,
  onDragStart,
  onDragMove,
  onDragEnd,
}: RoofShapeProps) {
  const selected = useEditorStore((state) => state.selectedIds.includes(element.id))
  const result = useMemo(() => computeRoof(element, 0), [element])
  const geometry = 'geometry' in result ? result.geometry : null
  const color = geometry ? (selected ? SELECTED : INK) : INVALID
  const thin = (selected ? 2 : 1.5) / viewScale
  const hit = 10 / viewScale
  const overhang = geometry ? geometry.overhangOutline : roofPlanOutline(element)
  const fontSize = Math.max(LABEL_FONT_MM, LABEL_MIN_PX / viewScale)
  const segments = geometry ? [...(geometry.ridge ? [geometry.ridge] : []), ...geometry.hips] : []

  return (
    <Group
      id={element.id}
      name="element"
      x={element.x}
      y={element.y}
      opacity={element.opacity}
      visible={!element.hidden}
      listening={interactive && !element.locked}
      draggable={interactive && !element.locked}
      onMouseDown={onPointerDown}
      onTouchStart={onPointerDown}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
    >
      <Line points={element.points} closed stroke={color} strokeWidth={thin} hitStrokeWidth={hit} />
      {element.overhang > 0 && (
        <Line
          points={flattenPoints(overhang)}
          closed
          stroke={color}
          strokeWidth={thin * 0.8}
          dash={[8 / viewScale, 6 / viewScale]}
          hitStrokeWidth={hit}
        />
      )}
      {segments.map(([a, b], i) => (
        <Line
          key={`ridge-${i}`}
          points={[a.x, a.y, b.x, b.y]}
          stroke={color}
          strokeWidth={thin * 1.6}
          hitStrokeWidth={hit}
        />
      ))}
      {geometry?.slopes.map((slope, i) => {
        if (!slope.downhill) return null
        const centre = planCentroid(slope.polygon)
        const half = ARROW_MM / 2
        const { x: dx, y: dy } = slope.downhill
        return (
          <Group key={`slope-${i}`} listening={false}>
            <Arrow
              points={[centre.x - dx * half, centre.y - dy * half, centre.x + dx * half, centre.y + dy * half]}
              stroke={color}
              fill={color}
              strokeWidth={thin}
              pointerLength={150}
              pointerWidth={120}
            />
            <Text
              x={centre.x - dx * half + dy * fontSize * 0.6}
              y={centre.y - dy * half - dx * fontSize * 0.6 - fontSize / 2}
              text={fr.roof.slopeLabel(element.pitch)}
              fontSize={fontSize}
              fill={color}
            />
          </Group>
        )
      })}
    </Group>
  )
}
