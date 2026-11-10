import { useEffect } from 'react'
import { useEditorStore } from '../../stores/editorStore'
import { isTypingTarget } from './isTypingTarget'
import { resolveShortcut } from './shortcuts'

/** Raccourcis clavier de l'éditeur. Ignorés quand le focus est dans un champ de saisie. */
export function useEditorShortcuts() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return
      const action = resolveShortcut(event)
      if (!action) return

      const store = useEditorStore.getState()
      switch (action) {
        case 'tool-select':
          store.setTool('select')
          break
        case 'tool-rect':
          store.setTool('rect')
          break
        case 'tool-ellipse':
          store.setTool('ellipse')
          break
        case 'tool-line':
          store.setTool('line')
          break
        case 'tool-text':
          store.setTool('text')
          break
        case 'escape':
          // Annule d'abord l'outil de tracé, puis désélectionne.
          if (store.activeTool !== 'select') store.setTool('select')
          else store.setSelection([])
          break
        case 'fit-view':
          event.preventDefault()
          store.fitView()
          break
        case 'undo':
          event.preventDefault() // sinon le navigateur annule dans la page
          store.undo()
          break
        case 'redo':
          event.preventDefault()
          store.redo()
          break
        case 'duplicate':
          event.preventDefault() // Ctrl+D ajoute un favori dans le navigateur
          store.duplicateElements(store.selectedIds)
          break
        case 'delete':
          event.preventDefault() // Retour arrière ne doit pas revenir à la page précédente
          store.removeElements(store.selectedIds)
          break
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
