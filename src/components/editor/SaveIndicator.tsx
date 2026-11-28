import clsx from 'clsx'
import { AlertTriangle, Check, CloudOff, Loader2 } from 'lucide-react'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import { useSaveRecoveryStore } from '../../stores/saveRecoveryStore'
import { useSyncStore } from '../../stores/syncStore'
import { downloadProjectBackup } from './backupActions'

export default function SaveIndicator() {
  const status = useEditorStore((state) => state.saveStatus)
  const pending = useSyncStore((state) => state.pending)
  // Réseau coupé : l'enregistrement a réussi sur l'appareil, mais pas encore dans le compte.
  const offline = pending > 0 && status !== 'error'
  const refusal = useSaveRecoveryStore()

  // Refus (droits, données) : la raison, et de quoi ne rien perdre (D24-8).
  if (status === 'error' && refusal.reason && refusal.failed) {
    const failed = refusal.failed
    return (
      <span role="alert" className="flex flex-wrap items-center gap-1.5 text-sm text-red-600">
        <AlertTriangle size={14} aria-hidden="true" />
        <span className="max-w-[22rem] truncate" title={fr.editor.saveRefused[refusal.reason]}>
          {fr.editor.saveRefused[refusal.reason]}
        </span>
        <button type="button" className="rounded border border-current px-1.5 text-xs font-medium" onClick={() => void refusal.retry?.()}>
          {fr.editor.saveRefused.retry}
        </button>
        <button
          type="button"
          className="rounded border border-current px-1.5 text-xs font-medium"
          onClick={() => void downloadProjectBackup(failed, { withEstimate: false }).catch((error: unknown) => console.error('Copie :', error))}
        >
          {fr.editor.saveRefused.download}
        </button>
      </span>
    )
  }

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
