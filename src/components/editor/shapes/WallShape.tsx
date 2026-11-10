import { Line } from 'react-konva'
import { sameLocation } from '../../../features/geometry/walls'
import { useEditorStore } from '../../../stores/editorStore'
import type { WallElement } from '../../../types/document'
import type { ShapeInteraction } from './shapeTypes'

interface WallShapeProps extends ShapeInteraction {
  element: WallElement
}

/** Zone de clic minimale autour d'un mur fin, en pixels écran. */
const MIN_HIT_WIDTH_PX = 12

export default function WallShape({
  element,
  interactive,
  viewScale,
  onPointerDown,
  onDragStart,
  onDragMove,
  onDragEnd,
}: WallShapeProps) {
  const selected = useEditorStore((state) => state.selectedIds.includes(element.id))

  // Un axe qui revient à son point de départ est dessiné fermé (angle raccordé en onglet).
  const pts = element.points
  const closed =
    pts.length >= 8 &&
    sameLocation({ x: pts[0], y: pts[1] }, { x: pts[pts.length - 2], y: pts[pts.length - 1] })
  const points = closed ? pts.slice(0, -2) : pts

  const geometry = {
    points,
    closed,
    lineJoin: 'miter' as const,
    lineCap: 'butt' as const,
  }

  return (
    <>
      {selected && (
        <Line
          {...geometry}
          stroke="#6366f1"
          strokeWidth={element.thickness + 10 / viewScale}
          opacity={0.45}
          visible={!element.hidden}
          listening={false}
        />
      )}
      <Line
        {...geometry}
        id={element.id}
        name="element"
        x={element.x}
        y={element.y}
        stroke={element.fill}
        strokeWidth={element.thickness}
        hitStrokeWidth={Math.max(element.thickness, MIN_HIT_WIDTH_PX / viewScale)}
        opacity={element.opacity}
        visible={!element.hidden}
        listening={interactive && !element.locked}
        draggable={interactive && !element.locked}
        onMouseDown={onPointerDown}
        onTouchStart={onPointerDown}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
      />
    </>
  )
}
