import { useViewer } from '@pascal-app/viewer'
import { InlineCommentComposer } from '../components/editor/CommentComposerOverlay'
import CommentsPanel from '../components/editor/CommentsPanel'
import { commentDraftTarget } from '../features/scene/commentDraft'
import { useCommentsStore } from '../stores/commentsStore'
import { useEditorStore } from '../stores/editorStore'

/** Ouvre un brouillon de commentaire sur l'objet sélectionné dans Pascal (ou au milieu du plan). */
function openDraftFromPascalSelection(): void {
  const { project, activeLevelId } = useEditorStore.getState()
  if (!project) return
  const selected = useViewer.getState().selection.selectedIds[0] ?? null
  useCommentsStore.getState().openDraft(commentDraftTarget(project.document, selected, activeLevelId))
}

/** Onglet « Commentaires » de l'éditeur de Pascal (M19 A2c) : liste, fils, réponses, nouveau commentaire. */
export default function PascalCommentsTab() {
  return (
    <div className="fabrics-on-dark h-full min-h-0 overflow-y-auto">
      <CommentsPanel onNew={openDraftFromPascalSelection} composer={<InlineCommentComposer />} />
    </div>
  )
}
