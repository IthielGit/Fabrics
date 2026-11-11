import { Arrow, Group, Line, Rect, Text } from 'react-konva'
import { useEditorStore } from '../../../stores/editorStore'
import { fr } from '../../../i18n/fr'
import { stairLayout, stairStatus, type Flight } from '../../../features/stairs/stairs'
import type { StairElement } from '../../../types/document'
import type { ShapeInteraction } from './shapeTypes'

interface StairShapeProps extends ShapeInteraction {
  element: StairElement
}

const NORMAL = { stroke: '#334155', fill: '#f8fafc', text: '#334155' }
const WARNING = { stroke: '#dc2626', fill: '#fee2e2', text: '#b91c1c' }

/** Taille de police des messages : 22 cm sur le plan, jamais sous 10 px à l'écran. */
const LABEL_FONT_MM = 220
const LABEL_MIN_PX = 10
const LABEL_WIDTH_MM = 2600

/** Lignes qui séparent les girons d'une volée (perpendiculaires au sens de la montée). */
function treadLines(flight: Flight): number[][] {
  const lines: number[][] = []
  const count = flight.treads
  for (let k = 1; k < count; k++) {
    if (flight.direction === 'up') {
      const y = flight.y + flight.height - (k * flight.height) / count
      lines.push([flight.x, y, flight.x + flight.width, y])
    } else if (flight.direction === 'down') {
      const y = flight.y + (k * flight.height) / count
      lines.push([flight.x, y, flight.x + flight.width, y])
    } else {
      const x = flight.x + (k * flight.width) / count
      lines.push([x, flight.y, x, flight.y + flight.height])
    }
  }
  return lines
}

/** Flèche de montée : du pied de l'escalier jusqu'au sommet, en passant par le milieu des volées et des paliers. */
function arrowPoints(element: StairElement): number[] {
  const w = element.width
  const l1 = element.length
  const l2 = element.length2 ?? 0
  const margin = Math.min(150, l1 / 4)
  if (element.shape === 'l') {
    return [w / 2, w + l1 - margin, w / 2, w / 2, w + l2 - margin, w / 2]
  }
  if (element.shape === 'u') {
    const second = w + (element.gap ?? 0) + w / 2
    return [w / 2, w + l1 - margin, w / 2, w / 2, second, w / 2, second, w + l2 - margin]
  }
  return [w / 2, l1 - margin, w / 2, margin]
}

/**
 * Escalier vu de dessus : volées avec leurs lignes de marche, palier, flèche de montée. En rouge
 * quand il est trop court (avec la longueur nécessaire) ou sans niveau au-dessus.
 */
export default function StairShape({
  element,
  interactive,
  viewScale,
  onPointerDown,
  onDragStart,
  onDragMove,
  onDragEnd,
}: StairShapeProps) {
  const levels = useEditorStore((state) => state.project?.document.levels)
  const selected = useEditorStore((state) => state.selectedIds.includes(element.id))
  const status = stairStatus(element, levels)
  const treads = status.kind === 'no-level-above' ? 0 : status.steps.treads
  const layout = stairLayout(element, treads)
  const look = status.kind === 'ok' ? NORMAL : WARNING
  const mirrored = element.mirrored === true && element.shape !== 'straight'

  const stroke = selected ? '#4f46e5' : look.stroke
  const lineWidth = Math.max(15, 1.2 / viewScale)
  const fontSize = Math.max(LABEL_FONT_MM, LABEL_MIN_PX / viewScale)
  const message =
    status.kind === 'no-level-above'
      ? fr.stairs.noLevelAbove
      : status.kind === 'too-short'
        ? fr.stairs.tooShort(Math.ceil(status.steps.requiredRun))
        : null

  return (
    <Group
      id={element.id}
      name="element"
      x={element.x}
      y={element.y}
      rotation={element.rotation}
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
      {/* Retournement gauche / droite autour du milieu de l'emprise. */}
      <Group x={mirrored ? layout.width : 0} scaleX={mirrored ? -1 : 1}>
        <Line
          points={layout.outline.flatMap((p) => [p.x, p.y])}
          closed
          fill={look.fill}
          stroke={stroke}
          strokeWidth={lineWidth * (selected ? 1.8 : 1)}
          lineJoin="miter"
        />
        {layout.landing && (
          <Rect
            x={layout.landing.x}
            y={layout.landing.y}
            width={layout.landing.width}
            height={layout.landing.height}
            stroke={stroke}
            strokeWidth={lineWidth}
            listening={false}
          />
        )}
        {layout.flights.flatMap((flight, i) =>
          treadLines(flight).map((points, j) => (
            <Line
              key={`${i}-${j}`}
              points={points}
              stroke={look.stroke}
              strokeWidth={lineWidth * 0.6}
              listening={false}
            />
          )),
        )}
        <Arrow
          points={arrowPoints(element)}
          stroke={look.stroke}
          fill={look.stroke}
          strokeWidth={lineWidth}
          pointerLength={Math.min(220, element.width / 3)}
          pointerWidth={Math.min(180, element.width / 3)}
          listening={false}
        />
      </Group>
      {message && (
        <Text
          x={layout.width / 2}
          y={layout.height / 2}
          width={LABEL_WIDTH_MM}
          offsetX={LABEL_WIDTH_MM / 2}
          offsetY={fontSize}
          rotation={-element.rotation}
          align="center"
          text={message}
          fontSize={fontSize}
          fontStyle="bold"
          fill={look.text}
          listening={false}
        />
      )}
    </Group>
  )
}
