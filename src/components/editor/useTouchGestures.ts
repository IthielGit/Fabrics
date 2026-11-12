import { useEffect, type RefObject } from 'react'
import { pinchView, type TouchPair } from '../../features/geometry/navigation'
import { useEditorStore } from '../../stores/editorStore'

/**
 * Tablette : deux doigts déplacent la vue et zooment (pincement). Dès qu'un second doigt se pose, le
 * geste en cours d'un seul doigt est annulé (`onStart`), et tant qu'un doigt reste posé les événements
 * ne parviennent plus aux outils de dessin : on ne trace rien par erreur en faisant glisser la vue.
 */
export function useTouchGestures(
  containerRef: RefObject<HTMLElement | null>,
  pxPerUnit: number,
  onStart: () => void,
) {
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let suppress = false
    let last: TouchPair | null = null

    const pairOf = (touches: TouchList): TouchPair => {
      const bounds = container.getBoundingClientRect()
      const at = (touch: Touch) => ({ x: touch.clientX - bounds.left, y: touch.clientY - bounds.top })
      return { a: at(touches[0]), b: at(touches[1]) }
    }

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length >= 2) {
        if (!suppress) onStart()
        suppress = true
        last = pairOf(event.touches)
      }
      if (suppress) event.stopPropagation()
    }
    const onTouchMove = (event: TouchEvent) => {
      if (!suppress) return
      event.preventDefault()
      event.stopPropagation()
      if (event.touches.length < 2 || !last) return
      const next = pairOf(event.touches)
      const { zoom, stagePosition, setView } = useEditorStore.getState()
      const view = pinchView({ zoom, x: stagePosition.x, y: stagePosition.y }, last, next, pxPerUnit)
      setView({ zoom: view.zoom, stagePosition: { x: view.x, y: view.y } })
      last = next
    }
    const onTouchEnd = (event: TouchEvent) => {
      if (!suppress) return
      event.stopPropagation()
      if (event.touches.length === 0) suppress = false
      last = event.touches.length >= 2 ? pairOf(event.touches) : null
    }

    const options = { capture: true, passive: false } as const
    container.addEventListener('touchstart', onTouchStart, options)
    container.addEventListener('touchmove', onTouchMove, options)
    container.addEventListener('touchend', onTouchEnd, options)
    container.addEventListener('touchcancel', onTouchEnd, options)
    return () => {
      container.removeEventListener('touchstart', onTouchStart, options)
      container.removeEventListener('touchmove', onTouchMove, options)
      container.removeEventListener('touchend', onTouchEnd, options)
      container.removeEventListener('touchcancel', onTouchEnd, options)
    }
  }, [containerRef, pxPerUnit, onStart])
}
