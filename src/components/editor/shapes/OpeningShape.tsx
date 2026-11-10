import { Group, Line, Rect } from 'react-konva'
import { openingGeometry } from '../../../features/geometry/openings'
import { openingSymbol } from '../../../features/geometry/openingSymbol'
import { useEditorStore } from '../../../stores/editorStore'
import type { OpeningElement } from '../../../types/document'
import type { ShapeInteraction } from './shapeTypes'

interface OpeningShapeProps extends ShapeInteraction {
  element: OpeningElement
}

const COLOR = '#334155'

/**
 * Une porte, une fenêtre ou une baie : le mur est « découpé » par un rectangle de la couleur du
 * fond de page, puis le symbole est tracé dessus. L'ouverture est dessinée après son mur
 * (elle est ajoutée à la fin du document).
 */
export default function OpeningShape({
  element,
  interactive,
  viewScale,
  onPointerDown,
}: OpeningShapeProps) {
  const selected = useEditorStore((state) => state.selectedIds.includes(element.id))
  const background = useEditorStore((state) => state.project?.document.page.background ?? '#ffffff')
  const wall = useEditorStore((state) => {
    const found = state.project?.document.elements.find((el) => el.id === element.wallId)
    return found?.type === 'wall' ? found : undefined
  })
  if (!wall) return null

  const geometry = openingGeometry(element, wall)
  if (!geometry) return null

  const symbol = openingSymbol(element, wall.thickness)
  const { cut } = symbol
  const stroke = 1.5 / viewScale

  return (
    <Group
      id={element.id}
      name="element"
      x={geometry.center.x}
      y={geometry.center.y}
      rotation={geometry.angle}
      opacity={element.opacity}
      visible={!element.hidden}
      listening={interactive && !element.locked}
      onMouseDown={onPointerDown}
      onTouchStart={onPointerDown}
    >
      {selected && (
        <Rect
          x={cut.x}
          y={cut.y}
          width={cut.width}
          height={cut.height}
          stroke="#6366f1"
          strokeWidth={8 / viewScale}
          opacity={0.45}
          listening={false}
        />
      )}
      {/* Découpe du mur ; sert aussi de zone de clic. */}
      <Rect x={cut.x} y={cut.y} width={cut.width} height={cut.height} fill={background} />
      {symbol.lines.map((points, index) => (
        <Line
          key={index}
          points={points}
          stroke={COLOR}
          strokeWidth={stroke}
          lineJoin="miter"
          listening={false}
        />
      ))}
    </Group>
  )
}
