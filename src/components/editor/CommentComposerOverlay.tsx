import { Loader2 } from 'lucide-react'
import { useState, type KeyboardEvent } from 'react'
import { createComment } from '../../features/comments/commentsApi'
import { MAX_COMMENT_LENGTH, normalizeCommentBody } from '../../features/comments/commentsLogic'
import { fr } from '../../i18n/fr'
import { useCommentsStore, type CommentDraft } from '../../stores/commentsStore'
import { useEditorStore } from '../../stores/editorStore'
import Button from '../ui/Button'

interface CommentComposerOverlayProps {
  /** Pixels écran par unité du document. */
  scale: number
  stagePosition: { x: number; y: number }
  /** Taille de la zone du canevas (la bulle reste dedans). */
  size: { width: number; height: number }
}

const WIDTH = 288
const HEIGHT = 190
const GAP = 14
const EDGE = 8
/** Le compteur n'apparaît qu'à l'approche de la limite. */
const COUNTER_FROM = MAX_COMMENT_LENGTH - 200

/**
 * Bulle de saisie d'un commentaire, posée au point cliqué (M16, lot B). Entrée envoie, Maj+Entrée fait
 * un retour à la ligne, Échap annule. Le commentaire n'entre pas dans l'historique d'annulation du plan.
 */
export default function CommentComposerOverlay({ scale, stagePosition, size }: CommentComposerOverlayProps) {
  const draft = useCommentsStore((state) => state.draft)
  const projectId = useEditorStore((state) => state.project?.id)
  if (!draft || !projectId) return null
  // Un autre clic = une nouvelle bulle, avec un texte vide (composant recréé).
  const key = `${draft.x}|${draft.y}|${draft.elementId ?? ''}`
  return (
    <Composer key={key} draft={draft} projectId={projectId} scale={scale} stagePosition={stagePosition} size={size} />
  )
}

interface ComposerProps extends CommentComposerOverlayProps {
  draft: CommentDraft
  projectId: string
}

function Composer({ draft, projectId, scale, stagePosition, size }: ComposerProps) {
  const closeDraft = useCommentsStore((state) => state.closeDraft)
  const targetName = useEditorStore((state) =>
    draft.elementId ? (state.project?.document.elements.find((el) => el.id === draft.elementId)?.name ?? null) : null,
  )
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [failed, setFailed] = useState(false)

  const left = Math.max(EDGE, Math.min(size.width - WIDTH - EDGE, draft.x * scale + stagePosition.x + GAP))
  const top = Math.max(EDGE, Math.min(size.height - HEIGHT - EDGE, draft.y * scale + stagePosition.y + GAP))
  const body = normalizeCommentBody(text)

  const send = async () => {
    if (!body || sending) return
    setSending(true)
    setFailed(false)
    try {
      const created = await createComment({
        projectId,
        body,
        levelId: draft.levelId,
        elementId: draft.elementId,
        x: draft.x,
        y: draft.y,
      })
      useCommentsStore.getState().addComment(created)
      closeDraft()
      // Un commentaire posé : retour à la sélection (l'outil ne reste pas actif).
      useEditorStore.getState().setTool('select')
    } catch {
      setFailed(true)
    } finally {
      setSending(false)
    }
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      closeDraft()
    } else if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      void send()
    }
  }

  return (
    <form
      aria-label={fr.comments.composerLabel}
      onSubmit={(event) => {
        event.preventDefault()
        void send()
      }}
      className="absolute z-20 flex flex-col gap-2 rounded-lg border border-slate-300 bg-white p-3 shadow-xl"
      style={{ left, top, width: WIDTH }}
    >
      {targetName && <p className="truncate text-xs text-slate-600">{fr.comments.onElement(targetName)}</p>}
      <textarea
        autoFocus
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={onKeyDown}
        maxLength={MAX_COMMENT_LENGTH}
        rows={3}
        placeholder={fr.comments.placeholder}
        aria-label={fr.comments.textLabel}
        disabled={sending}
        className="w-full resize-none rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
      />
      {text.length >= COUNTER_FROM && (
        <p className="text-right text-xs text-slate-600">{fr.comments.counter(text.length, MAX_COMMENT_LENGTH)}</p>
      )}
      {failed && (
        <p role="alert" className="text-xs text-red-700">
          {fr.comments.sendError}
        </p>
      )}
      <div className="flex items-center justify-end gap-2">
        <Button onClick={closeDraft} disabled={sending} className="px-3 py-1.5">
          {fr.common.cancel}
        </Button>
        <Button type="submit" variant="primary" disabled={!body || sending} className="px-3 py-1.5">
          {sending && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
          {fr.comments.send}
        </Button>
      </div>
      <p className="text-xs text-slate-500">{fr.comments.keysHint}</p>
    </form>
  )
}
