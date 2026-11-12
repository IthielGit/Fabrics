import type Konva from 'konva'
import { useRef } from 'react'
import { Circle } from 'react-konva'
import type { AxisSegment } from '../../features/geometry/axes'
import {
  collectBackgroundSegments,
  type BackgroundSegment,
} from '../../features/geometry/backgroundSnap'
import {
  collectAlignTargets,
  collectOpeningSnapPoints,
  collectSnapAxes,
  collectSnapVertices,
  collectSnapWallAxes,
  preferredVertexKinds,
  snapPoint,
  type SnapVertex,
  type WallAxisSegment,
} from '../../features/geometry/snapping'
import {
  canRemoveVertex,
  getSegmentMidpoints,
  getVertices,
  insertVertexAtMidpoint,
  moveVertex,
  removeVertex,
} from '../../features/geometry/transform'
import type { Point } from '../../features/geometry/viewport'
import { selectActiveElements, selectSnapElements, useEditorStore } from '../../stores/editorStore'

interface VertexHandlesProps {
  /** Faux quand un outil de tracé est actif ou pendant la saisie d'un texte. */
  enabled: boolean
  /** Pixels écran par unité du document. */
  scale: number
}

/** Distance d'accroche, en pixels écran. */
const SNAP_THRESHOLD_PX = 8

/**
 * Poignées sur les sommets d'un mur, d'une pièce ou d'une cote sélectionné : on les glisse pour
 * modifier la forme. Elles s'aimantent aux autres sommets, aux angles de faces et à la grille ;
 * `Maj` contraint la direction depuis le sommet voisin. Un geste = un seul état d'historique.
 */
export default function VertexHandles({ enabled, scale }: VertexHandlesProps) {
  const element = useEditorStore((state) => {
    if (state.selectedIds.length !== 1) return null
    const selected = state.project?.document.elements.find((el) => el.id === state.selectedIds[0])
    return selected && !selected.locked && !selected.hidden ? selected : null
  })
  const plan = useEditorStore((state) => state.project?.document.plan)
  // Sommets sur lesquels s'aimanter, calculés une fois au début du geste.
  const snapVertices = useRef<SnapVertex[]>([])
  const snapAxes = useRef<AxisSegment[]>([])
  const snapWallAxes = useRef<WallAxisSegment[]>([])
  const snapAlign = useRef<Point[]>([])
  const snapOpenings = useRef<Point[]>([])
  const snapBackground = useRef<BackgroundSegment[]>([])

  if (!enabled || !element) return null
  const vertices = getVertices(element)
  if (vertices.length === 0) return null

  const handleDragStart = (event: Konva.KonvaEventObject<DragEvent>) => {
    event.cancelBubble = true
    const store = useEditorStore.getState()
    store.beginLiveEdit()
    // Éléments qui attirent : le niveau actif, plus le niveau du dessous s'il est affiché.
    const attracting = selectSnapElements(store)
    snapVertices.current = collectSnapVertices(attracting, new Set([element.id]))
    snapBackground.current = collectBackgroundSegments(attracting)
    snapAxes.current = collectSnapAxes(store.project?.document.elements ?? [], new Set([element.id]))
    // Le sommet d'un mur se raccorde à l'axe des autres murs.
    snapWallAxes.current =
      element.type === 'wall' ? collectSnapWallAxes(attracting, new Set([element.id])) : []
    // Guides d'alignement : un mur s'aligne sur les points d'axe des autres éléments, une pièce ou
    // une cote aussi sur les angles des faces de murs.
    // Une extrémité de cote s'aimante aussi aux bords et au milieu des ouvertures.
    snapOpenings.current =
      element.type === 'dimension'
        ? collectOpeningSnapPoints(selectActiveElements(store))
        : []
    snapAlign.current =
      element.type === 'wall'
        ? collectAlignTargets(attracting, new Set([element.id]))
        : [...snapVertices.current, ...snapOpenings.current]
  }

  const handleDragMove = (index: number) => (event: Konva.KonvaEventObject<DragEvent>) => {
    event.cancelBubble = true
    const store = useEditorStore.getState()
    const current = store.project?.document.elements.find((el) => el.id === element.id)
    if (!current) return

    const all = getVertices(current)
    // Voisin pour la contrainte d'angle : le sommet précédent (le suivant pour le premier).
    const neighbour =
      current.type === 'room' || current.type === 'platform' || current.type === 'roof'
        ? all[(index - 1 + all.length) % all.length]
        : (all[index - 1] ?? all[index + 1] ?? null)

    const node = event.target
    // Les autres sommets du même élément servent aussi de repères d'alignement.
    const own = all.filter((_, i) => i !== index)
    const { point, guides } = snapPoint(
      { x: node.x(), y: node.y() },
      {
        vertices: snapVertices.current,
        // Comme pendant le tracé : un sommet de mur attrape d'abord les axes, un sommet de pièce
        // les faces intérieures, une extrémité de cote les faces.
        preferredVertices:
          current.type === 'wall' ||
          current.type === 'room' ||
          current.type === 'platform' ||
          current.type === 'roof' ||
          current.type === 'dimension' ||
          current.type === 'axis' ||
          current.type === 'section'
            ? preferredVertexKinds(current.type)
            : undefined,
        openingPoints: snapOpenings.current,
        axes: snapAxes.current,
        background: event.evt.altKey ? undefined : snapBackground.current,
        wallAxes: event.evt.altKey ? undefined : snapWallAxes.current,
        alignTargets: event.evt.altKey ? undefined : [...snapAlign.current, ...own],
        gridSize: plan?.snapToGrid ? plan.gridSize : null,
        threshold: SNAP_THRESHOLD_PX / scale,
        from: neighbour ?? null,
        constrain: event.evt.shiftKey,
        softAlign: !event.evt.altKey,
      },
    )
    node.position(point)
    if (guides || store.guides.length > 0) store.setGuides(guides ?? [])
    store.liveReplaceElements([moveVertex(current, index, point)])
  }

  const handleDragEnd = (event: Konva.KonvaEventObject<DragEvent>) => {
    event.cancelBubble = true
    const store = useEditorStore.getState()
    store.setGuides([])
    store.endLiveEdit()
  }

  const setCursor = (event: Konva.KonvaEventObject<Event>, cursor: string) => {
    const container = event.target.getStage()?.container()
    if (container) container.style.cursor = cursor
  }

  // Double-clic sur un sommet : on le retire (sauf au nombre minimal de sommets).
  const handleRemove = (index: number) => (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    event.cancelBubble = true
    const store = useEditorStore.getState()
    const current = store.project?.document.elements.find((el) => el.id === element.id)
    if (!current || !canRemoveVertex(current)) return
    store.replaceElements([removeVertex(current, index)])
    setCursor(event, '')
  }

  // Clic sur un « + » : on ajoute un sommet au milieu du côté (un seul état d'historique).
  const handleInsert = (index: number) => (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    event.cancelBubble = true
    const store = useEditorStore.getState()
    const current = store.project?.document.elements.find((el) => el.id === element.id)
    if (!current) return
    store.replaceElements([insertVertexAtMidpoint(current, index)])
    setCursor(event, '')
  }

  const midpoints = getSegmentMidpoints(element)

  return (
    <>
      {midpoints.map((middle, index) => (
        <Circle
          key={`${element.id}-mid-${index}`}
          x={middle.x}
          y={middle.y}
          radius={4 / scale}
          fill="#c7d2fe"
          stroke="#4f46e5"
          strokeWidth={1 / scale}
          hitStrokeWidth={8 / scale}
          opacity={0.85}
          onClick={handleInsert(index)}
          onTap={handleInsert(index)}
          onMouseEnter={(event) => setCursor(event, 'copy')}
          onMouseLeave={(event) => setCursor(event, '')}
        />
      ))}
      {vertices.map((vertex, index) => (
        <Circle
          key={`${element.id}-${index}`}
          x={vertex.x}
          y={vertex.y}
          radius={6 / scale}
          fill="#ffffff"
          stroke="#4f46e5"
          strokeWidth={2 / scale}
          hitStrokeWidth={8 / scale}
          draggable
          onDragStart={handleDragStart}
          onDragMove={handleDragMove(index)}
          onDragEnd={handleDragEnd}
          onDblClick={handleRemove(index)}
          onDblTap={handleRemove(index)}
          onMouseEnter={(event) => setCursor(event, 'move')}
          onMouseLeave={(event) => setCursor(event, '')}
        />
      ))}
    </>
  )
}
