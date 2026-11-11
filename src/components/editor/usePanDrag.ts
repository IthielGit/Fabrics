import { useCallback, useEffect, useRef, useState } from 'react'
import { useEditorStore } from '../../stores/editorStore'

/**
 * Déplacement de la vue au clic molette maintenu : `start` se branche sur l'appui du bouton du
 * milieu, le glissement est suivi sur toute la fenêtre (même si le curseur sort du canevas) et
 * s'arrête au relâchement.
 */
export function usePanDrag() {
  const [panning, setPanning] = useState(false)
  const stopRef = useRef<(() => void) | null>(null)

  const start = useCallback((event: MouseEvent) => {
    event.preventDefault() // pas de défilement automatique du navigateur
    stopRef.current?.()
    const origin = { x: event.clientX, y: event.clientY }
    const startPosition = useEditorStore.getState().stagePosition

    const onMove = (move: MouseEvent) => {
      const { zoom, setView } = useEditorStore.getState()
      setView({
        zoom,
        stagePosition: {
          x: startPosition.x + move.clientX - origin.x,
          y: startPosition.y + move.clientY - origin.y,
        },
      })
    }
    const stop = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', stop)
      stopRef.current = null
      setPanning(false)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', stop)
    stopRef.current = stop
    setPanning(true)
  }, [])

  // Un glissement encore en cours à la fermeture de l'éditeur ne doit pas laisser d'écouteurs.
  useEffect(() => () => stopRef.current?.(), [])

  return { panning, start }
}
