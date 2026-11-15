import clsx from 'clsx'
import { Loader2, Radio, WifiOff } from 'lucide-react'
import { fr } from '../../i18n/fr'
import { useCollabStore } from '../../stores/collabStore'

/** État de la collaboration temps réel dans l'en-tête (M14) ; rien quand elle n'est pas utilisée. */
export default function CollabIndicator() {
  const status = useCollabStore((state) => state.status)
  if (status === 'off') return null

  const label = fr.realtime.status[status]
  return (
    <span
      role="status"
      title={fr.realtime.hint[status]}
      className={clsx(
        'flex items-center gap-1.5 text-sm',
        status === 'live' ? 'text-emerald-700' : status === 'offline' ? 'text-amber-700' : 'text-slate-500',
      )}
    >
      {status === 'connecting' && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
      {status === 'live' && <Radio size={14} aria-hidden="true" />}
      {status === 'offline' && <WifiOff size={14} aria-hidden="true" />}
      <span className="max-md:sr-only">{label}</span>
    </span>
  )
}
