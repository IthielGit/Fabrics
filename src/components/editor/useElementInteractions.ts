import type Konva from 'konva'
import { useCallback, useMemo, useRef } from 'react'
import type { Point } from '../../features/geometry/viewport'
import { useEditorStore } from '../../stores/editorStore'
import type { ShapeInteraction } from './shapes/shapeTypes'

type Handlers = Pick<
  ShapeInteraction,
  'onPointerDown' | 'onDragStart' | 'onDragMove' | 'onDragEnd' | 'onDoubleClick'
>

/**
 * Sélection par clic (Maj = ajouter / retirer) et déplacement des éléments.
 * Quand plusieurs éléments sont sélectionnés, ils se déplacent ensemble.
 * Les positions ne sont écrites dans le document qu'à la fin du geste : un seul état d'historique.
 */
export function useElementInteractions(): Handlers {
  const origins = useRef(new Map<string, Point>())

  const onPointerDown = useCallback((event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    event.cancelBubble = true // empêche le rectangle de sélection de démarrer
    const id = event.target.id()
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
    const locked = new Set(project?.document.elements.filter((el) => el.locked).map((el) => el.id))
    const ids = new Set([...selectedIds, event.target.id()])
    origins.current = new Map()
    for (const id of ids) {
      const node = stage.findOne(`#${id}`)
      if (node && !locked.has(id)) origins.current.set(id, { x: node.x(), y: node.y() })
    }
  }, [])

  const onDragMove = useCallback((event: Konva.KonvaEventObject<DragEvent>) => {
    const stage = event.target.getStage()
    const draggedId = event.target.id()
    const origin = origins.current.get(draggedId)
    if (!stage || !origin) return
    const dx = event.target.x() - origin.x
    const dy = event.target.y() - origin.y
    for (const [id, start] of origins.current) {
      if (id === draggedId) continue
      stage.findOne(`#${id}`)?.position({ x: start.x + dx, y: start.y + dy })
    }
  }, [])

  const onDragEnd = useCallback((event: Konva.KonvaEventObject<DragEvent>) => {
    const stage = event.target.getStage()
    const { project, replaceElements } = useEditorStore.getState()
    if (!stage || !project) return
    const byId = new Map(project.document.elements.map((el) => [el.id, el]))
    const updated = [...origins.current.keys()].flatMap((id) => {
      const node = stage.findOne(`#${id}`)
      const element = byId.get(id)
      return node && element ? [{ ...element, x: node.x(), y: node.y() }] : []
    })
    origins.current = new Map()
    replaceElements(updated)
  }, [])

  // Double-clic sur un texte : on passe en édition.
  const onDoubleClick = useCallback((event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const { project, startEditingText } = useEditorStore.getState()
    const id = event.target.id()
    if (project?.document.elements.some((el) => el.id === id && el.type === 'text')) {
      startEditingText(id)
    }
  }, [])

  return useMemo(
    () => ({ onPointerDown, onDragStart, onDragMove, onDragEnd, onDoubleClick }),
    [onPointerDown, onDragStart, onDragMove, onDragEnd, onDoubleClick],
  )
}
