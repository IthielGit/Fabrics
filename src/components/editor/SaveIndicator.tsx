import clsx from 'clsx'
import { AlertTriangle, Check, Loader2 } from 'lucide-react'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'

export default function SaveIndicator() {
  const status = useEditorStore((state) => state.saveStatus)

  return (
    <span
      role="status"
      title={status === 'error' ? fr.editor.saveErrorHint : undefined}
      className={clsx(
        'flex items-center gap-1.5 text-sm',
        status === 'error' ? 'text-red-600' : 'text-slate-500',
      )}
    >
      {status === 'saving' && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
      {status === 'saved' && <Check size={14} aria-hidden="true" />}
      {status === 'error' && <AlertTriangle size={14} aria-hidden="true" />}
      {status === 'saving' && fr.editor.saving}
      {status === 'saved' && fr.editor.saved}
      {status === 'error' && fr.editor.saveError}
    </span>
  )
}
