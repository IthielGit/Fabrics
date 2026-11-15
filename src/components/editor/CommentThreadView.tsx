import { ArrowLeft, CheckCircle2, Pencil, RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { colorForUser } from '../../features/collab/presence'
import { deleteComment, editComment, setCommentResolved } from '../../features/comments/commentsApi'
import {
  canDeleteComment,
  canEditComment,
  levelNameOf,
  MAX_COMMENT_LENGTH,
  normalizeCommentBody,
  pinPosition,
  type Comment,
  type CommentThread,
} from '../../features/comments/commentsLogic'
import { fr } from '../../i18n/fr'
import { useAuthStore } from '../../stores/authStore'
import { useCommentsStore } from '../../stores/commentsStore'
import { useEditorStore } from '../../stores/editorStore'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import UserAvatar from '../ui/UserAvatar'
import CommentReplyBox from './CommentReplyBox'
import { focusThread } from './focusThread'

interface CommentThreadViewProps {
  thread: CommentThread
  onBack: () => void
}

const ICON_BUTTON =
  'rounded p-1 text-slate-500 hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-40'

/** Un fil ouvert dans le panneau (M16, lot C) : commentaire, réponses, résoudre, modifier, supprimer, répondre. */
export default function CommentThreadView({ thread, onBack }: CommentThreadViewProps) {
  const projectId = useEditorStore((state) => state.project?.id)
  const elements = useEditorStore((state) => state.project?.document.elements)
  const levels = useEditorStore((state) => state.project?.document.levels)
  const userId = useAuthStore((state) => state.user?.id ?? null)
  const role = useCommentsStore((state) => state.myRole)
  const people = useCommentsStore((state) => state.people)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<Comment | null>(null)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  if (!projectId) return null
  const { root } = thread
  const orphaned = elements ? (pinPosition(root, elements)?.orphaned ?? false) : false
  const levelName = (levels?.length ?? 0) > 1 ? levelNameOf(levels, root.levelId) : null
  const resolver = root.resolvedBy ? (people.get(root.resolvedBy)?.name ?? fr.history.unknownAuthor) : null

  const run = async (action: () => Promise<void>) => {
    setBusy(true)
    setFailed(false)
    try {
      await action()
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  const toggleResolved = () =>
    run(async () => {
      const resolve = !thread.resolved
      await setCommentResolved(root.id, resolve)
      useCommentsStore.getState().replaceComment({
        ...root,
        resolvedBy: resolve ? userId : null,
        resolvedAt: resolve ? new Date().toISOString() : null,
      })
    })

  const confirmDelete = () => {
    const target = deleting
    if (!target) return
    return run(async () => {
      await deleteComment(target.id)
      useCommentsStore.getState().removeComment(target.id)
      setDeleting(null)
    })
  }

  const author = (comment: Comment) =>
    people.get(comment.authorId) ?? {
      id: comment.authorId,
      name: fr.history.unknownAuthor,
      color: colorForUser(comment.authorId),
      avatarUrl: undefined,
    }

  return (
    <section aria-label={fr.comments.threadLabel(thread.number)} className="p-4">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 rounded text-sm font-medium text-indigo-700 hover:underline focus-visible:outline-2 focus-visible:outline-indigo-600"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          {fr.comments.backToList}
        </button>
        <Button onClick={toggleResolved} disabled={busy} className="px-2 py-1 text-xs">
          {thread.resolved ? (
            <RotateCcw size={14} aria-hidden="true" />
          ) : (
            <CheckCircle2 size={14} aria-hidden="true" />
          )}
          {thread.resolved ? fr.comments.reopen : fr.comments.resolve}
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
        <button
          type="button"
          onClick={() => focusThread(thread)}
          title={fr.comments.locate}
          className="rounded-full px-2 py-0.5 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          style={{ backgroundColor: author(root).color }}
        >
          {fr.comments.number(thread.number)}
        </button>
        {levelName && <span>{levelName}</span>}
        {orphaned && <span className="text-amber-800">{fr.comments.elementDeleted}</span>}
        {thread.resolved && (
          <span className="font-medium text-emerald-800">
            {resolver ? fr.comments.resolvedBy(resolver) : fr.comments.resolved}
          </span>
        )}
      </div>

      <ul className="mt-3 space-y-3">
        {[root, ...thread.replies].map((comment) => {
          const person = author(comment)
          const editing = editingId === comment.id
          return (
            <li key={comment.id} className="rounded-md border border-slate-200 p-3">
              <div className="flex items-center gap-2">
                <UserAvatar size="sm" name={person.name} color={person.color} avatarUrl={person.avatarUrl} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{person.name}</p>
                  <p className="text-xs text-slate-600">
                    {fr.comments.when(comment.createdAt)}
                    {comment.editedAt && ` · ${fr.comments.edited}`}
                  </p>
                </div>
                {!editing && canEditComment(comment, userId) && (
                  <button
                    type="button"
                    title={fr.comments.edit}
                    aria-label={fr.comments.edit}
                    onClick={() => setEditingId(comment.id)}
                    className={ICON_BUTTON}
                  >
                    <Pencil size={14} aria-hidden="true" />
                  </button>
                )}
                {!editing && canDeleteComment(comment, userId, role) && (
                  <button
                    type="button"
                    title={fr.comments.delete}
                    aria-label={fr.comments.delete}
                    onClick={() => setDeleting(comment)}
                    className={ICON_BUTTON}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                )}
              </div>
              {editing ? (
                <EditBox
                  comment={comment}
                  onDone={() => setEditingId(null)}
                  onError={() => setFailed(true)}
                />
              ) : (
                <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-800">{comment.body}</p>
              )}
            </li>
          )
        })}
      </ul>

      {failed && (
        <p role="alert" className="mt-2 text-xs text-red-700">
          {fr.comments.actionError}
        </p>
      )}

      <CommentReplyBox projectId={projectId} parentId={root.id} />

      {deleting && (
        <Modal title={fr.comments.deleteTitle} onClose={() => setDeleting(null)}>
          <p className="text-sm text-slate-700">
            {deleting.id === root.id && thread.replies.length > 0
              ? fr.comments.deleteThreadText(thread.replies.length)
              : fr.comments.deleteText}
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button onClick={() => setDeleting(null)} disabled={busy}>
              {fr.common.cancel}
            </Button>
            <Button variant="danger" onClick={() => void confirmDelete()} disabled={busy}>
              {fr.comments.delete}
            </Button>
          </div>
        </Modal>
      )}
    </section>
  )
}

/** Modification du texte d'un commentaire, sur place. */
function EditBox({ comment, onDone, onError }: { comment: Comment; onDone: () => void; onError: () => void }) {
  const [text, setText] = useState(comment.body)
  const [saving, setSaving] = useState(false)
  const body = normalizeCommentBody(text)

  const save = async () => {
    if (!body || saving) return
    if (body === comment.body) {
      onDone()
      return
    }
    setSaving(true)
    try {
      const updated = await editComment(comment.id, body)
      useCommentsStore.getState().replaceComment(updated)
      onDone()
    } catch {
      onError()
      setSaving(false)
    }
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      <textarea
        autoFocus
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            onDone()
          } else if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault()
            void save()
          }
        }}
        maxLength={MAX_COMMENT_LENGTH}
        rows={3}
        aria-label={fr.comments.textLabel}
        disabled={saving}
        className="w-full resize-none rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
      />
      <div className="flex justify-end gap-2">
        <Button onClick={onDone} disabled={saving} className="px-3 py-1">
          {fr.common.cancel}
        </Button>
        <Button variant="primary" onClick={() => void save()} disabled={!body || saving} className="px-3 py-1">
          {fr.common.save}
        </Button>
      </div>
    </div>
  )
}
