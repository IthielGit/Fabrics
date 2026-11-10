import type Konva from 'konva'
import { useEffect, useRef, useState } from 'react'
import { Layer, Rect, Stage } from 'react-konva'
import { zoomAtPoint } from '../../features/geometry/viewport'
import { pxPerUnit } from '../../features/units/scale'
import { useEditorStore } from '../../stores/editorStore'
import { isTypingTarget } from './isTypingTarget'
import { useContainerSize } from './useContainerSize'

const WHEEL_ZOOM_STEP = 1.1

export default function EditorStage() {
  const project = useEditorStore((state) => state.project)
  const zoom = useEditorStore((state) => state.zoom)
  const stagePosition = useEditorStore((state) => state.stagePosition)
  const setView = useEditorStore((state) => state.setView)
  const setViewportSize = useEditorStore((state) => state.setViewportSize)
  const fitView = useEditorStore((state) => state.fitView)

  const { ref: containerRef, size } = useContainerSize<HTMLDivElement>()
  const [spaceDown, setSpaceDown] = useState(false)
  const fittedProjectId = useRef<string | null>(null)

  const projectId = project?.id ?? null

  // Communique la taille de la zone au store, et ajuste la page à l'écran à l'ouverture.
  useEffect(() => {
    setViewportSize(size)
    if (projectId && size.width > 0 && fittedProjectId.current !== projectId) {
      fittedProjectId.current = projectId
      fitView()
    }
  }, [size, projectId, setViewportSize, fitView])

  // Espace + glisser = déplacer la vue.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || isTypingTarget(event.target)) return
      event.preventDefault()
      setSpaceDown(true)
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
  const { page, unit } = project.document
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

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden bg-slate-200"
      style={{ cursor: spaceDown ? 'grab' : 'default' }}
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
              strokeScaleEnabled={false}
            />
          </Layer>
        </Stage>
      )}
    </div>
  )
}
