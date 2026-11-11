import type Konva from 'konva'
import { useRef } from 'react'
import { Group, Line, Rect } from 'react-konva'
import { pointerOffset, slideOpening } from '../../../features/geometry/openingPlacement'
import { openingGeometry } from '../../../features/geometry/openings'
import { openingSymbol } from '../../../features/geometry/openingSymbol'
import { useEditorStore } from '../../../stores/editorStore'
import type { OpeningElement, WallElement } from '../../../types/document'
import type { ShapeInteraction } from './shapeTypes'

interface OpeningShapeProps extends ShapeInteraction {
  element: OpeningElement
}

const COLOR = '#334155'

/**
 * Une porte, une fenêtre ou une baie : le mur est « découpé » par un rectangle de la couleur du
 * fond de page, puis le symbole est tracé dessus. L'ouverture est dessinée après son mur
 * (elle est ajoutée à la fin du document). Elle se glisse uniquement le long de son mur.
 */
export default function OpeningShape({
  element,
  interactive,
  viewScale,
  onPointerDown,
}: OpeningShapeProps) {
  const selected = useEditorStore((state) => state.selectedIds.includes(element.id))
  // Écart entre le curseur et le centre de l'ouverture au moment de la saisie (mm).
  const grab = useRef(0)
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

  const pointer = (event: Konva.KonvaEventObject<DragEvent>) =>
    event.target.getStage()?.getRelativePointerPosition() ?? null

  /** Remet le nœud exactement sur la position bornée (Konva le suit sinon au pixel près du curseur). */
  const place = (event: Konva.KonvaEventObject<DragEvent>, opening: OpeningElement, owner: WallElement) => {
    const at = openingGeometry(opening, owner)
    if (at) event.target.position(at.center)
  }

  const handleDragStart = (event: Konva.KonvaEventObject<DragEvent>) => {
    event.cancelBubble = true // le déplacement générique des éléments ne doit pas s'en mêler
    const point = pointer(event)
    grab.current = point ? (pointerOffset(point, wall, element.segmentIndex) ?? 0) - element.offset : 0
    useEditorStore.getState().beginLiveEdit()
  }

  const handleDragMove = (event: Konva.KonvaEventObject<DragEvent>) => {
    event.cancelBubble = true
    const point = pointer(event)
    if (!point) return
    const store = useEditorStore.getState()
    const current = store.project?.document.elements.find((el) => el.id === element.id)
    if (current?.type !== 'opening') return
    const openings = (store.project?.document.elements ?? []).filter(
      (el): el is OpeningElement => el.type === 'opening',
    )
    const next = slideOpening(current, wall, openings, point, grab.current)
    if (next !== current) store.liveReplaceElements([next])
    place(event, next, wall)
  }

  const handleDragEnd = (event: Konva.KonvaEventObject<DragEvent>) => {
    event.cancelBubble = true
    const store = useEditorStore.getState()
    store.endLiveEdit() // un seul état d'historique pour tout le glissement
    const current = store.project?.document.elements.find((el) => el.id === element.id)
    if (current?.type === 'opening') place(event, current, wall)
  }

  return (
    <Group
      id={element.id}
      name="element"
      x={geometry.center.x}
      y={geometry.center.y}
      rotation={geometry.angle}
      opacity={element.opacity}
      visible={!element.hidden && !wall.hidden}
      listening={interactive && !element.locked}
      draggable={interactive && !element.locked}
      onMouseDown={onPointerDown}
      onTouchStart={onPointerDown}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
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
      {symbol.dashed.map((points, index) => (
        <Line
          key={`dashed-${index}`}
          points={points}
          stroke={COLOR}
          strokeWidth={stroke * 0.8}
          dash={[60, 40]}
          listening={false}
        />
      ))}
    </Group>
  )
}
