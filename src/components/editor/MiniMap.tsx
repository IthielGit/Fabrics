import { useMemo, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { elementBounds } from '../../features/export/bounds'
import type { Box } from '../../features/geometry/box'
import {
  centerViewOn,
  minimapLayout,
  minimapToDocument,
  visibleBox,
  type MinimapLayout,
} from '../../features/geometry/navigation'
import { pxPerUnit } from '../../features/units/scale'
import { fr } from '../../i18n/fr'
import { selectActiveElements, useEditorStore } from '../../stores/editorStore'
import { useMinimapStore } from '../../stores/minimapStore'

/** Taille du dessin de la mini-carte, en pixels. */
const MAP_WIDTH = 176
const MAP_HEIGHT = 120
/** Au-delà, on ne dessine plus les éléments un par un (la page et la zone visible restent). */
const MAX_DRAWN_ELEMENTS = 2000

/**
 * Mini-carte en bas à droite : la page, les éléments du niveau actif et un cadre qui montre la zone
 * visible. Un clic ou un glissement déplace la vue à cet endroit.
 */
export default function MiniMap() {
  const visible = useMinimapStore((state) => state.visible)
  const project = useEditorStore((state) => state.project)
  const zoom = useEditorStore((state) => state.zoom)
  const stagePosition = useEditorStore((state) => state.stagePosition)
  const viewportSize = useEditorStore((state) => state.viewportSize)
  const elements = useEditorStore(selectActiveElements)
  const setView = useEditorStore((state) => state.setView)
  const svgRef = useRef<SVGSVGElement>(null)
  // Pendant un glissement, la zone représentée reste celle du départ : sinon elle bougerait avec
  // la vue et la carte « fuirait » sous le curseur.
  const frozen = useRef<MinimapLayout | null>(null)

  // Boîtes des éléments (en unités du document), recalculées seulement quand les éléments changent.
  const boxes = useMemo(() => {
    const result: Box[] = []
    for (const element of elements) {
      if (element.hidden || result.length >= MAX_DRAWN_ELEMENTS) continue
      const box = elementBounds(element)
      if (box) result.push(box)
    }
    return result
  }, [elements])

  if (!visible || !project || viewportSize.width === 0 || viewportSize.height === 0) return null
  const { page, unit } = project.document
  const unitScale = pxPerUnit(unit)
  const pageBox: Box = { x: 0, y: 0, width: page.width, height: page.height }
  const view = { zoom, x: stagePosition.x, y: stagePosition.y }
  const visibleArea = visibleBox(view, viewportSize, unitScale)
  const layout = minimapLayout(pageBox, visibleArea, { width: MAP_WIDTH, height: MAP_HEIGHT }, 0)
  const { world } = layout

  const goTo = (event: ReactPointerEvent<SVGSVGElement>, using: MinimapLayout) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const target = minimapToDocument(using, {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    })
    const next = centerViewOn(target, viewportSize, zoom, unitScale)
    setView({ zoom, stagePosition: { x: next.x, y: next.y } })
  }

  return (
    <div
      className="max-md:hidden absolute right-5 bottom-5 rounded-md border border-slate-200 bg-white/95 p-1 shadow"
      title={fr.editor.minimapHelp}
    >
      <svg
        ref={svgRef}
        role="img"
        aria-label={fr.editor.minimap}
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
        viewBox={`${world.x} ${world.y} ${world.width} ${world.height}`}
        style={{ touchAction: 'none', cursor: 'pointer', display: 'block' }}
        className="rounded bg-slate-50"
        onPointerDown={(event) => {
          event.preventDefault()
          event.currentTarget.setPointerCapture(event.pointerId)
          frozen.current = layout
          goTo(event, layout)
        }}
        onPointerMove={(event) => {
          if (frozen.current) goTo(event, frozen.current)
        }}
        onPointerUp={(event) => {
          frozen.current = null
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
          }
        }}
        onPointerCancel={() => {
          frozen.current = null
        }}
      >
        <rect
          x={pageBox.x}
          y={pageBox.y}
          width={pageBox.width}
          height={pageBox.height}
          fill="#ffffff"
          stroke="#94a3b8"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
        {boxes.map((box, index) => (
          <rect
            key={index}
            x={box.x}
            y={box.y}
            width={box.width}
            height={box.height}
            fill="rgba(71, 85, 105, 0.35)"
            stroke="#475569"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <rect
          x={visibleArea.x}
          y={visibleArea.y}
          width={visibleArea.width}
          height={visibleArea.height}
          fill="rgba(79, 70, 229, 0.12)"
          stroke="#4f46e5"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  )
}
