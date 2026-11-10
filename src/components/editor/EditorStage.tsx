import type Konva from 'konva'
import { useEffect, useRef, useState } from 'react'
import { Ellipse, Layer, Rect, Stage } from 'react-konva'
import {
  createEllipseElement,
  createRectElement,
  defaultShapeSize,
  nextElementName,
} from '../../features/documents/elements'
import { distance, normalizeBox, type Box } from '../../features/geometry/box'
import { zoomAtPoint, type Point } from '../../features/geometry/viewport'
import { pxPerUnit } from '../../features/units/scale'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import ElementNode from './ElementNode'
import { isTypingTarget } from './isTypingTarget'
import { useContainerSize } from './useContainerSize'

const WHEEL_ZOOM_STEP = 1.1
/** En dessous de cette taille (px écran), un tracé est considéré comme un simple clic. */
const MIN_DRAW_SIDE_PX = 4

interface Draft {
  start: Point
  current: Point
}

export default function EditorStage() {
  const project = useEditorStore((state) => state.project)
  const zoom = useEditorStore((state) => state.zoom)
  const stagePosition = useEditorStore((state) => state.stagePosition)
  const activeTool = useEditorStore((state) => state.activeTool)
  const setView = useEditorStore((state) => state.setView)
  const setViewportSize = useEditorStore((state) => state.setViewportSize)
  const fitView = useEditorStore((state) => state.fitView)
  const addElement = useEditorStore((state) => state.addElement)
  const setTool = useEditorStore((state) => state.setTool)

  const { ref: containerRef, size } = useContainerSize<HTMLDivElement>()
  const [spaceDown, setSpaceDown] = useState(false)
  const [draft, setDraft] = useState<Draft | null>(null)
  const fittedProjectId = useRef<string | null>(null)

  const projectId = project?.id ?? null
  const drawing = activeTool === 'rect' || activeTool === 'ellipse'

  // Communique la taille de la zone au store, et ajuste la page à l'écran à l'ouverture.
  useEffect(() => {
    setViewportSize(size)
    if (projectId && size.width > 0 && fittedProjectId.current !== projectId) {
      fittedProjectId.current = projectId
      fitView()
    }
  }, [size, projectId, setViewportSize, fitView])

  // Espace + glisser = déplacer la vue. Échap annule un tracé en cours.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return
      if (event.code === 'Space') {
        event.preventDefault()
        setSpaceDown(true)
      } else if (event.key === 'Escape') {
        setDraft(null)
      }
    }
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') setSpaceDown(false)
    }
    const onBlur = () => setSpaceDown(false)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  if (!project) return null
  const { page, unit, elements } = project.document
  const unitScale = pxPerUnit(unit)
  const scale = zoom * unitScale

  const handleWheel = (event: Konva.KonvaEventObject<WheelEvent>) => {
    event.evt.preventDefault()
    const pointer = event.target.getStage()?.getPointerPosition()
    if (!pointer) return
    const factor = event.evt.deltaY < 0 ? WHEEL_ZOOM_STEP : 1 / WHEEL_ZOOM_STEP
    const next = zoomAtPoint(
      { zoom, x: stagePosition.x, y: stagePosition.y },
      pointer,
      zoom * factor,
      unitScale,
    )
    setView({ zoom: next.zoom, stagePosition: { x: next.x, y: next.y } })
  }

  const handleDragEnd = (event: Konva.KonvaEventObject<DragEvent>) => {
    // Les glissers d'éléments remontent jusqu'ici : seul le déplacement de la vue nous concerne.
    if (event.target !== event.target.getStage()) return
    setView({ zoom, stagePosition: { x: event.target.x(), y: event.target.y() } })
  }

  // --- Tracé d'une forme (rectangle, ellipse) ---

  const pointerInDocument = (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) =>
    event.target.getStage()?.getRelativePointerPosition() ?? null

  const handlePointerDown = (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!drawing || spaceDown) return
    if (event.evt instanceof MouseEvent && event.evt.button !== 0) return
    const point = pointerInDocument(event)
    if (point) setDraft({ start: point, current: point })
  }

  const handlePointerMove = (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!draft) return
    const point = pointerInDocument(event)
    if (point) setDraft({ ...draft, current: point })
  }

  const finishDraft = () => {
    if (!draft || (activeTool !== 'rect' && activeTool !== 'ellipse')) {
      setDraft(null)
      return
    }
    const dragged = normalizeBox(draft.start, draft.current)
    const isClick =
      distance(draft.start, draft.current) * scale < MIN_DRAW_SIDE_PX ||
      Math.min(dragged.width, dragged.height) * scale < MIN_DRAW_SIDE_PX
    const side = defaultShapeSize(unit)
    const box: Box = isClick
      ? { x: draft.start.x - side / 2, y: draft.start.y - side / 2, width: side, height: side }
      : dragged

    const element =
      activeTool === 'rect'
        ? createRectElement(
            nextElementName(fr.elements.rect, 'rect', elements),
            box.x,
            box.y,
            box.width,
            box.height,
          )
        : createEllipseElement(
            nextElementName(fr.elements.ellipse, 'ellipse', elements),
            box.x,
            box.y,
            box.width,
            box.height,
          )
    setDraft(null)
    addElement(element)
    setTool('select')
  }

  const draftBox = draft ? normalizeBox(draft.start, draft.current) : null

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden bg-slate-200"
      style={{ cursor: spaceDown ? 'grab' : drawing ? 'crosshair' : 'default' }}
    >
      {size.width > 0 && (
        <Stage
          width={size.width}
          height={size.height}
          x={stagePosition.x}
          y={stagePosition.y}
          scaleX={scale}
          scaleY={scale}
          draggable={spaceDown}
          onWheel={handleWheel}
          onDragEnd={handleDragEnd}
          onMouseDown={handlePointerDown}
          onTouchStart={handlePointerDown}
          onMouseMove={handlePointerMove}
          onTouchMove={handlePointerMove}
          onMouseUp={finishDraft}
          onTouchEnd={finishDraft}
          onMouseLeave={finishDraft}
        >
          <Layer>
            <Rect
              name="page"
              x={0}
              y={0}
              width={page.width}
              height={page.height}
              fill={page.background}
              stroke="#94a3b8"
              strokeWidth={1 / scale}
            />
            {elements.map((element) => (
              <ElementNode key={element.id} element={element} interactive={false} />
            ))}
          </Layer>
          <Layer listening={false}>
            {draftBox && activeTool === 'rect' && (
              <Rect
                {...draftBox}
                fill="rgba(99,102,241,0.15)"
                stroke="#4f46e5"
                strokeWidth={1 / scale}
                dash={[6 / scale, 4 / scale]}
              />
            )}
            {draftBox && activeTool === 'ellipse' && (
              <Ellipse
                x={draftBox.x + draftBox.width / 2}
                y={draftBox.y + draftBox.height / 2}
                radiusX={draftBox.width / 2}
                radiusY={draftBox.height / 2}
                fill="rgba(99,102,241,0.15)"
                stroke="#4f46e5"
                strokeWidth={1 / scale}
                dash={[6 / scale, 4 / scale]}
              />
            )}
          </Layer>
        </Stage>
      )}
    </div>
  )
}
