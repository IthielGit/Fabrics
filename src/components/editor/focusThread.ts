import { centerViewOn } from '../../features/geometry/navigation'
import { pinPosition, type CommentThread } from '../../features/comments/commentsLogic'
import { pxPerUnit } from '../../features/units/scale'
import { useCommentsStore } from '../../stores/commentsStore'
import { useEditorStore } from '../../stores/editorStore'

/**
 * Ouvre un fil (M16, lot C) : le sélectionne dans le panneau « Commentaires », affiche son niveau et
 * centre la vue sur son épingle (sans changer le zoom).
 */
export function focusThread(thread: CommentThread): void {
  useCommentsStore.getState().selectThread(thread.root.id)
  const editor = useEditorStore.getState()
  const project = editor.project
  if (!project) return

  const { levelId } = thread.root
  if (levelId && levelId !== editor.activeLevelId && project.document.levels?.some((level) => level.id === levelId)) {
    editor.setActiveLevel(levelId)
  }

  const position = pinPosition(thread.root, project.document.elements)
  if (!position || editor.viewportSize.width === 0) return
  const view = centerViewOn(position, editor.viewportSize, editor.zoom, pxPerUnit(project.document.unit))
  editor.setView({ zoom: view.zoom, stagePosition: { x: view.x, y: view.y } })
}

/** Ouvre le panneau « Commentaires » sur un fil (clic sur une épingle du plan). */
export function openThreadInPanel(thread: CommentThread): void {
  const editor = useEditorStore.getState()
  editor.setSidePanelTab('comments')
  editor.setSidePanelOpen(true)
  useCommentsStore.getState().selectThread(thread.root.id)
}
