import type Konva from 'konva'
import { useEffect, useRef, useState } from 'react'
import { Ellipse, Layer, Line, Rect, Stage } from 'react-konva'
import {
  createEllipseElement,
  createLineElement,
  createRectElement,
  createTextElement,
  defaultFontSize,
  defaultShapeSize,
  defaultStrokeWidth,
  nextElementName,
} from '../../features/documents/elements'
import { boxesIntersect, distance, normalizeBox, type Box } from '../../features/geometry/box'
import { screenToDocument, zoomAtPoint, type Point } from '../../features/geometry/viewport'
import { pxPerUnit } from '../../features/units/scale'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import AlignmentGuides from './AlignmentGuides'
import ElementNode from './ElementNode'
import { importImageFiles } from './importImages'
import { isTypingTarget } from './isTypingTarget'
import SelectionTransformer from './SelectionTransformer'
import TextEditorOverlay from './TextEditorOverlay'
import { useContainerSize } from './useContainerSize'
import { useElementInteractions } from './useElementInteractions'

const WHEEL_ZOOM_STEP = 1.1
/** En dessous de cette taille (px écran), un tracé ou une sélection est un simple clic. */
const MIN_DRAG_PX = 4

type PointerEvent = Konva.KonvaEventObject<MouseEvent | TouchEvent>

interface Gesture {
  start: Point
  current: Point
  /** Maj enfoncée au départ : le rectangle de sélection s'ajoute à la sélection existante. */
  additive: boolean
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
  const setSelection = useEditorStore((state) => state.setSelection)
  const editingTextId = useEditorStore((state) => state.editingTextId)
  const startEditingText = useEditorStore((state) => state.startEditingText)
  const commitTextEdit = useEditorStore((state) => state.commitTextEdit)
  const stopEditingText = useEditorStore((state) => state.stopEditingText)
  const elementHandlers = useElementInteractions()

  const { ref: containerRef, size } = useContainerSize<HTMLDivElement>()
  const [spaceDown, setSpaceDown] = useState(false)
  // Tracé d'une forme (outils rectangle / ellipse)
  const [draft, setDraft] = useState<Gesture | null>(null)
  // Rectangle de sélection (outil Sélection)
  const [band, setBand] = useState<Gesture | null>(null)
  const fittedProjectId = useRef<string | null>(null)

  const projectId = project?.id ?? null
  const drawing = activeTool !== 'select'
  const selecting = activeTool === 'select' && !spaceDown

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
        setBand(null)
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

  const pointerInDocument = (event: PointerEvent) =>
    event.target.getStage()?.getRelativePointerPosition() ?? null

  const handlePointerDown = (event: PointerEvent) => {
    if (spaceDown) return
    if (event.evt instanceof MouseEvent && event.evt.button !== 0) return
    const point = pointerInDocument(event)
    if (!point) return

    if (drawing) {
      setDraft({ start: point, current: point, additive: false })
    } else if (activeTool === 'select') {
      // Un clic sur un élément est géré par l'élément lui-même ; un clic sur une poignée du
      // transformateur ne doit pas non plus démarrer de sélection : seul le vide compte.
      const onEmptyArea =
        event.target === event.target.getStage() || event.target.name() === 'page'
      if (!onEmptyArea) return
      setBand({ start: point, current: point, additive: event.evt.shiftKey })
    }
  }

  const handlePointerMove = (event: PointerEvent) => {
    if (!draft && !band) return
    const point = pointerInDocument(event)
    if (!point) return
    if (draft) setDraft({ ...draft, current: point })
    if (band) setBand({ ...band, current: point })
  }

  const finishDraft = (gesture: Gesture) => {
    if (activeTool === 'text') {
      // Un clic pose un texte à cet endroit et ouvre directement la saisie.
      const fontSize = defaultFontSize(unit)
      const text = createTextElement(
        nextElementName(fr.elements.text, 'text', elements),
        gesture.start.x,
        gesture.start.y,
        fr.elements.defaultText,
        fontSize,
      )
      addElement(text)
      startEditingText(text.id)
      return
    }
    if (activeTool === 'line') {
      const isClick = distance(gesture.start, gesture.current) * scale < MIN_DRAG_PX
      const side = defaultShapeSize(unit)
      const dx = isClick ? side : gesture.current.x - gesture.start.x
      const dy = isClick ? 0 : gesture.current.y - gesture.start.y
      addElement(
        createLineElement(
          nextElementName(fr.elements.line, 'line', elements),
          gesture.start.x,
          gesture.start.y,
          dx,
          dy,
          defaultStrokeWidth(unit),
        ),
      )
      setTool('select')
      return
    }
    if (activeTool !== 'rect' && activeTool !== 'ellipse') return
    const dragged = normalizeBox(gesture.start, gesture.current)
    const isClick = Math.min(dragged.width, dragged.height) * scale < MIN_DRAG_PX
    const side = defaultShapeSize(unit)
    const box: Box = isClick
      ? {
          x: gesture.start.x - side / 2,
          y: gesture.start.y - side / 2,
          width: side,
          height: side,
        }
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
    addElement(element) // l'élément créé devient la sélection
    setTool('select')
  }

  const finishBand = (gesture: Gesture, stage: Konva.Stage) => {
    const { selectedIds } = useEditorStore.getState()
    if (distance(gesture.start, gesture.current) * scale < MIN_DRAG_PX) {
      // Simple clic dans le vide : on désélectionne (sauf avec Maj).
      if (!gesture.additive) setSelection([])
      return
    }
    const bandBox = normalizeBox(gesture.start, gesture.current)
    const hitIds = Array.from(stage.find('.element'))
      .filter((node) => node.isVisible() && node.listening())
      .filter((node) =>
        boxesIntersect(bandBox, node.getClientRect({ relativeTo: node.getLayer() ?? undefined })),
      )
      .map((node) => node.id())
    setSelection(gesture.additive ? [...new Set([...selectedIds, ...hitIds])] : hitIds)
  }

  const handlePointerUp = (event: PointerEvent) => {
    const stage = event.target.getStage()
    if (draft) {
      setDraft(null)
      finishDraft(draft)
    }
    if (band) {
      setBand(null)
      if (stage) finishBand(band, stage)
    }
  }

  const editingElement = elements.find((el) => el.id === editingTextId)
  const draftBox = draft ? normalizeBox(draft.start, draft.current) : null
  const bandBox = band ? normalizeBox(band.start, band.current) : null
  const cursor = spaceDown ? 'grab' : drawing ? 'crosshair' : 'default'

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden bg-slate-200"
      style={{ cursor }}
      onDragOver={(event) => {
        // Autorise le dépôt de fichiers (sans cela le navigateur ouvrirait l'image).
        if (event.dataTransfer.types.includes('Files')) event.preventDefault()
      }}
      onDrop={(event) => {
        if (event.dataTransfer.files.length === 0) return
        event.preventDefault()
        const bounds = event.currentTarget.getBoundingClientRect()
        const dropPoint = screenToDocument(
          { x: event.clientX - bounds.left, y: event.clientY - bounds.top },
          { zoom, x: stagePosition.x, y: stagePosition.y },
          unitScale,
        )
        void importImageFiles(Array.from(event.dataTransfer.files), dropPoint)
      }}
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
          onMouseUp={handlePointerUp}
          onTouchEnd={handlePointerUp}
          onMouseLeave={handlePointerUp}
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
              <ElementNode
                key={element.id}
                element={element}
                interactive={selecting}
                viewScale={scale}
                editing={element.id === editingTextId}
                {...elementHandlers}
              />
            ))}
            <SelectionTransformer enabled={selecting && editingTextId === null} />
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
            {draft && activeTool === 'line' && (
              <Line
                points={[draft.start.x, draft.start.y, draft.current.x, draft.current.y]}
                stroke="#4f46e5"
                strokeWidth={2 / scale}
                dash={[6 / scale, 4 / scale]}
              />
            )}
            <AlignmentGuides pageWidth={page.width} pageHeight={page.height} scale={scale} />
            {bandBox && (
              <Rect
                {...bandBox}
                fill="rgba(79,70,229,0.08)"
                stroke="#4f46e5"
                strokeWidth={1 / scale}
              />
            )}
          </Layer>
        </Stage>
      )}
      {editingElement?.type === 'text' && (
        <TextEditorOverlay
          key={editingElement.id}
          element={editingElement}
          scale={scale}
          stagePosition={stagePosition}
          onCommit={(text) => commitTextEdit(editingElement.id, text)}
          onCancel={() => {
            // Échap : on abandonne la saisie ; un texte tout juste créé garde son texte par défaut.
            stopEditingText()
          }}
        />
      )}
    </div>
  )
}
