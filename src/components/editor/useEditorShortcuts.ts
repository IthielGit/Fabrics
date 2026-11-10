import { useEffect } from 'react'
import { useEditorStore } from '../../stores/editorStore'
import { isTypingTarget } from './isTypingTarget'

/** Raccourcis clavier de l'éditeur. Ignorés quand le focus est dans un champ de saisie. */
export function useEditorShortcuts() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return
      const store = useEditorStore.getState()
      const withModifier = event.ctrlKey || event.metaKey

      if (withModifier) {
        if (event.key === '0') {
          event.preventDefault()
          store.fitView()
        }
        return
      }
      if (event.altKey) return

      switch (event.key.toLowerCase()) {
        case 'v':
          store.setTool('select')
          break
        case 'r':
          store.setTool('rect')
          break
        case 'o':
          store.setTool('ellipse')
          break
        case 'escape':
          // Annule d'abord l'outil de tracé, puis désélectionne.
          if (store.activeTool !== 'select') store.setTool('select')
          else store.setSelection([])
          break
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
