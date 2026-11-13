import clsx from 'clsx'
import { AlertTriangle, Check, CloudOff, Loader2 } from 'lucide-react'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import { useSyncStore } from '../../stores/syncStore'

export default function SaveIndicator() {
  const status = useEditorStore((state) => state.saveStatus)
  const pending = useSyncStore((state) => state.pending)
  // Réseau coupé : l'enregistrement a réussi sur l'appareil, mais pas encore dans le compte.
  const offline = pending > 0 && status !== 'error'

  return (
    <span
      role="status"
      title={status === 'error' ? fr.editor.saveErrorHint : offline ? fr.auth.sync.pendingHint : undefined}
      className={clsx(
        'flex items-center gap-1.5 text-sm',
        status === 'error' ? 'text-red-600' : offline ? 'text-amber-700' : 'text-slate-500',
      )}
    >
      {status === 'saving' && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
      {status === 'saved' && !offline && <Check size={14} aria-hidden="true" />}
      {offline && status !== 'saving' && <CloudOff size={14} aria-hidden="true" />}
      {status === 'error' && <AlertTriangle size={14} aria-hidden="true" />}
      <span className="max-sm:sr-only">
        {status === 'saving' && fr.editor.saving}
        {status === 'saved' && (offline ? fr.auth.sync.pending : fr.editor.saved)}
        {status === 'error' && fr.editor.saveError}
      </span>
    </span>
  )
}
