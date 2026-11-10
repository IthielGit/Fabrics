import { Arrow, Line } from 'react-konva'
import type { LineElement } from '../../../types/document'
import type { ShapeInteraction } from './shapeTypes'

interface LineShapeProps extends ShapeInteraction {
  element: LineElement
}

/** Zone de clic minimale autour d'une ligne fine, en pixels écran. */
const MIN_HIT_WIDTH_PX = 12

export default function LineShape({
  element,
  interactive,
  viewScale,
  onPointerDown,
  onDragStart,
  onDragMove,
  onDragEnd,
}: LineShapeProps) {
  const common = {
    id: element.id,
    name: 'element',
    x: element.x,
    y: element.y,
    points: element.points,
    rotation: element.rotation,
    opacity: element.opacity,
    stroke: element.stroke,
    strokeWidth: element.strokeWidth,
    lineCap: 'round' as const,
    lineJoin: 'round' as const,
    hitStrokeWidth: Math.max(element.strokeWidth, MIN_HIT_WIDTH_PX / viewScale),
    visible: !element.hidden,
    listening: interactive && !element.locked,
    draggable: interactive && !element.locked,
    onMouseDown: onPointerDown,
    onTouchStart: onPointerDown,
    onDragStart,
    onDragMove,
    onDragEnd,
  }

  if (element.arrowEnd) {
    const head = Math.max(element.strokeWidth * 4, 1)
    return <Arrow {...common} fill={element.stroke} pointerLength={head} pointerWidth={head} />
  }
  return <Line {...common} />
}
