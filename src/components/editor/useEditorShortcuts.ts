import { useEffect } from 'react'
import { rotateSelectionQuarterTurn } from '../../features/geometry/rotateSelection'
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
        case 'tool-wall':
          store.setTool('wall') // sans effet dans un visuel
          break
        case 'tool-room':
          store.setTool('room')
          break
        case 'tool-dimension':
          store.setTool('dimension')
          break
        case 'tool-axis':
          store.setTool('axis')
          break
        case 'tool-door':
          store.setTool('door')
          break
        case 'tool-window':
          store.setTool('window')
          break
        case 'escape':
          // Annule d'abord l'outil de tracé, puis désélectionne.
          if (store.activeTool !== 'select') store.setTool('select')
          else store.setSelection([])
          break
        case 'rotate': {
          // Maj + R : quart de tour des éléments sélectionnés (non verrouillés), en un seul pas d'historique.
          const doc = store.project?.document
          if (!doc) break
          // Toute la sélection tourne autour du centre de son emprise commune.
          const rotated = rotateSelectionQuarterTurn(
            doc.elements.filter((el) => store.selectedIds.includes(el.id)),
          )
          if (rotated.length > 0) store.replaceElements(rotated)
          break
        }
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
        case 'copy':
          store.copySelection()
          break
        case 'paste':
          event.preventDefault()
          store.pasteClipboard()
          break
        case 'select-all':
          event.preventDefault() // sinon le navigateur sélectionne le texte de la page
          store.selectAll()
          break
        case 'nudge-left':
        case 'nudge-right':
        case 'nudge-up':
        case 'nudge-down': {
          event.preventDefault()
          const step = event.shiftKey ? 10 : 1 // « unités d'affichage » : px, ou mm sur un plan
          const dx = action === 'nudge-left' ? -step : action === 'nudge-right' ? step : 0
          const dy = action === 'nudge-up' ? -step : action === 'nudge-down' ? step : 0
          store.nudgeSelection(dx, dy)
          break
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
