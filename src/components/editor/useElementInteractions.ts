import type Konva from 'konva'
import { useCallback, useMemo, useRef } from 'react'
import { translateBox, unionBoxes, type Box } from '../../features/geometry/box'
import { computeSnap } from '../../features/geometry/guides'
import { hasAbsolutePoints, translateElement } from '../../features/geometry/transform'
import type { Point } from '../../features/geometry/viewport'
import { pxPerUnit } from '../../features/units/scale'
import { useEditorStore } from '../../stores/editorStore'
import type { ShapeInteraction } from './shapes/shapeTypes'

type Handlers = Pick<
  ShapeInteraction,
  'onPointerDown' | 'onDragStart' | 'onDragMove' | 'onDragEnd' | 'onDoubleClick'
>

/** Distance d'accroche des guides d'alignement, en pixels écran. */
const SNAP_THRESHOLD_PX = 8

interface DragSession {
  /** Position de départ de chaque élément déplacé. */
  origins: Map<string, Point>
  /** Boîte qui englobe tous les éléments déplacés, au départ du geste. */
  groupBox: Box | null
  /** Boîtes sur lesquelles on s'aimante : les autres éléments visibles et la page. */
  targets: Box[]
}

const EMPTY_SESSION: DragSession = { origins: new Map(), groupBox: null, targets: [] }

/**
 * Sélection par clic (Maj = ajouter / retirer) et déplacement des éléments.
 * Quand plusieurs éléments sont sélectionnés, ils se déplacent ensemble, aimantés sur les bords
 * et les centres des autres éléments et de la page (Alt enfoncée : pas d'aimantation).
 * Les positions ne sont écrites dans le document qu'à la fin du geste : un seul état d'historique.
 */
export function useElementInteractions(): Handlers {
  const session = useRef<DragSession>(EMPTY_SESSION)

  const onPointerDown = useCallback((event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    event.cancelBubble = true // empêche le rectangle de sélection de démarrer
    // `currentTarget` = l'élément du document (un groupe pour un mur, une pièce ou une cote),
    // alors que `target` serait la forme précise cliquée à l'intérieur.
    const id = event.currentTarget.id()
    const { selectedIds, setSelection } = useEditorStore.getState()
    if (event.evt.shiftKey) {
      setSelection(selectedIds.includes(id) ? selectedIds.filter((i) => i !== id) : [...selectedIds, id])
    } else if (!selectedIds.includes(id)) {
      setSelection([id])
    }
  }, [])

  const onDragStart = useCallback((event: Konva.KonvaEventObject<DragEvent>) => {
    const stage = event.target.getStage()
    if (!stage) return
    const { selectedIds, project } = useEditorStore.getState()
    // Verrouillés, et ouvertures (leur place vient de leur mur) : jamais déplacés ici.
    const locked = new Set(
      project?.document.elements
        .filter((el) => el.locked || el.type === 'opening')
        .map((el) => el.id),
    )
    const ids = new Set([...selectedIds, event.target.id()])

    const origins = new Map<string, Point>()
    const draggedNodes: Konva.Node[] = []
    for (const id of ids) {
      const node = stage.findOne(`#${id}`)
      if (node && !locked.has(id)) {
        origins.set(id, { x: node.x(), y: node.y() })
        draggedNodes.push(node)
      }
    }

    // Boîtes en coordonnées du document (le calque n'a pas de transformation propre).
    const layer = event.target.getLayer() ?? undefined
    const boxOf = (node: Konva.Node): Box => node.getClientRect({ relativeTo: layer })
    const targets = Array.from(stage.find('.element'))
      .filter((node) => node.isVisible() && !origins.has(node.id()))
      .map(boxOf)
    if (project) {
      const { width, height } = project.document.page
      targets.push({ x: 0, y: 0, width, height })
    }

    session.current = { origins, groupBox: unionBoxes(draggedNodes.map(boxOf)), targets }
  }, [])

  const onDragMove = useCallback((event: Konva.KonvaEventObject<DragEvent>) => {
    const stage = event.target.getStage()
    const draggedId = event.target.id()
    const { origins, groupBox, targets } = session.current
    const origin = origins.get(draggedId)
    if (!stage || !origin) return

    const store = useEditorStore.getState()
    let dx = event.target.x() - origin.x
    let dy = event.target.y() - origin.y

    if (groupBox && store.project && !event.evt.altKey) {
      const scale = store.zoom * pxPerUnit(store.project.document.unit)
      const snap = computeSnap(translateBox(groupBox, dx, dy), targets, SNAP_THRESHOLD_PX / scale)
      dx += snap.dx
      dy += snap.dy
      store.setGuides(snap.guides)
    } else if (store.guides.length > 0) {
      store.setGuides([])
    }

    event.target.position({ x: origin.x + dx, y: origin.y + dy })
    for (const [id, start] of origins) {
      if (id === draggedId) continue
      stage.findOne(`#${id}`)?.position({ x: start.x + dx, y: start.y + dy })
    }
  }, [])

  const onDragEnd = useCallback((event: Konva.KonvaEventObject<DragEvent>) => {
    const stage = event.target.getStage()
    const { project, replaceElements, setGuides } = useEditorStore.getState()
    setGuides([])
    if (!stage || !project) return
    const byId = new Map(project.document.elements.map((el) => [el.id, el]))
    const updated = [...session.current.origins.keys()].flatMap((id) => {
      const node = stage.findOne(`#${id}`)
      const element = byId.get(id)
      if (!node || !element) return []
      return [translateElement(element, node.x() - element.x, node.y() - element.y)]
    })
    session.current = EMPTY_SESSION
    replaceElements(updated)

    // Murs, pièces et cotes gardent leur position à 0 : ce sont leurs points qui ont bougé.
    // react-konva ne réécrit pas une position inchangée, on remet donc le nœud à sa place.
    for (const element of updated) {
      if (hasAbsolutePoints(element)) stage.findOne(`#${element.id}`)?.position({ x: element.x, y: element.y })
    }
  }, [])

  // Double-clic sur un texte : on passe en édition.
  const onDoubleClick = useCallback((event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const { project, startEditingText } = useEditorStore.getState()
    const id = event.currentTarget.id()
    if (project?.document.elements.some((el) => el.id === id && el.type === 'text')) {
      startEditingText(id)
    }
  }, [])

  return useMemo(
    () => ({ onPointerDown, onDragStart, onDragMove, onDragEnd, onDoubleClick }),
    [onPointerDown, onDragStart, onDragMove, onDragEnd, onDoubleClick],
  )
}
