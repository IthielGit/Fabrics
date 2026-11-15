import { Loader2, SendHorizontal } from 'lucide-react'
import { useState, type KeyboardEvent } from 'react'
import { createReply } from '../../features/comments/commentsApi'
import { MAX_COMMENT_LENGTH, normalizeCommentBody } from '../../features/comments/commentsLogic'
import { fr } from '../../i18n/fr'
import { useCommentsStore } from '../../stores/commentsStore'
import Button from '../ui/Button'

interface CommentReplyBoxProps {
  projectId: string
  /** Commentaire de premier niveau auquel on répond. */
  parentId: string
}

/** Zone de réponse sous un fil (M16, lot C). Entrée envoie, Maj + Entrée fait un retour à la ligne. */
export default function CommentReplyBox({ projectId, parentId }: CommentReplyBoxProps) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [failed, setFailed] = useState(false)
  const body = normalizeCommentBody(text)

  const send = async () => {
    if (!body || sending) return
    setSending(true)
    setFailed(false)
    try {
      const reply = await createReply(projectId, parentId, body)
      useCommentsStore.getState().addComment(reply)
      setText('')
    } catch {
      setFailed(true)
    } finally {
      setSending(false)
    }
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      void send()
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        void send()
      }}
      className="mt-3 flex flex-col gap-2"
    >
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={onKeyDown}
        maxLength={MAX_COMMENT_LENGTH}
        rows={2}
        placeholder={fr.comments.replyPlaceholder}
        aria-label={fr.comments.replyLabel}
        disabled={sending}
        className="w-full resize-none rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
      />
      {failed && (
        <p role="alert" className="text-xs text-red-700">
          {fr.comments.sendError}
        </p>
      )}
      <Button type="submit" variant="primary" disabled={!body || sending} className="self-end px-3 py-1.5">
        {sending ? (
          <Loader2 size={14} className="animate-spin" aria-hidden="true" />
        ) : (
          <SendHorizontal size={14} aria-hidden="true" />
        )}
        {fr.comments.reply}
      </Button>
    </form>
  )
}
