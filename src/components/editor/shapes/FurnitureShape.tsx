import { Circle, Ellipse, Group, Line, Rect } from 'react-konva'
import { getSymbol } from '../../../features/library/catalog'
import { drawSymbol } from '../../../features/library/drawing'
import { arcPoints } from '../../../features/library/primitives'
import { STYLE_LOOKS } from '../../../features/library/style'
import type { Primitive } from '../../../features/library/types'
import type { FurnitureElement } from '../../../types/document'
import type { ShapeInteraction } from './shapeTypes'

interface FurnitureShapeProps extends ShapeInteraction {
  element: FurnitureElement
}

/** Épaisseur minimale d'un trait à l'écran (px) : un objet dézoomé reste lisible. */
const MIN_STROKE_PX = 1

/** Un objet de la bibliothèque : ses primitives de dessin, dans une boîte de la taille de l'objet. */
export default function FurnitureShape({
  element,
  interactive,
  viewScale,
  onPointerDown,
  onDragStart,
  onDragMove,
  onDragEnd,
}: FurnitureShapeProps) {
  const def = getSymbol(element.symbol)
  const { width, depth } = element

  const renderPrimitive = (primitive: Primitive, index: number) => {
    const look = STYLE_LOOKS[primitive.style]
    const common = {
      fill: look.fill ?? undefined,
      stroke: look.stroke ?? undefined,
      strokeWidth: look.stroke ? Math.max(look.strokeWidth, MIN_STROKE_PX / viewScale) : 0,
      dash: look.dash ?? undefined,
      lineJoin: 'round' as const,
      lineCap: 'round' as const,
    }
    switch (primitive.kind) {
      case 'rect':
        return (
          <Rect
            key={index}
            {...common}
            x={primitive.x}
            y={primitive.y}
            width={primitive.w}
            height={primitive.h}
            cornerRadius={primitive.r}
          />
        )
      case 'circle':
        return <Circle key={index} {...common} x={primitive.cx} y={primitive.cy} radius={primitive.r} />
      case 'ellipse':
        return (
          <Ellipse
            key={index}
            {...common}
            x={primitive.cx}
            y={primitive.cy}
            radiusX={primitive.rx}
            radiusY={primitive.ry}
          />
        )
      case 'line':
        return <Line key={index} {...common} fill={undefined} points={primitive.points} />
      case 'polygon':
        return <Line key={index} {...common} points={primitive.points} closed />
      case 'arc':
        return (
          <Line
            key={index}
            {...common}
            fill={undefined}
            points={arcPoints(primitive.cx, primitive.cy, primitive.r, primitive.from, primitive.to)}
          />
        )
    }
  }

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
      {/* Zone de clic : toute la boîte de l'objet, même là où il est transparent. */}
      <Rect width={width} height={depth} fill="rgba(255,255,255,0.01)" />
      {def ? (
        drawSymbol(def, width, depth, element.mirrored).map(renderPrimitive)
      ) : (
        // Objet inconnu (projet créé avec une version plus récente) : un cadre pointillé.
        <Rect
          width={width}
          height={depth}
          stroke="#dc2626"
          strokeWidth={Math.max(8, MIN_STROKE_PX / viewScale)}
          dash={[80, 60]}
        />
      )}
    </Group>
  )
}
