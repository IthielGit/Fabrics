import clsx from 'clsx'
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'

const AUTO_DISMISS_MS = 8000

const TONES = {
  success: { box: 'border-emerald-300 bg-emerald-50 text-emerald-900', hover: 'hover:bg-emerald-100', icon: CircleCheck },
  info: { box: 'border-amber-300 bg-amber-50 text-amber-900', hover: 'hover:bg-amber-100', icon: Info },
  error: { box: 'border-red-300 bg-red-50 text-red-900', hover: 'hover:bg-red-100', icon: CircleAlert },
} as const

/**
 * Bandeau d'information : vert pour une confirmation, ambre pour une information, rouge pour un échec.
 * Il se ferme seul (sauf un échec, qu'on ne veut pas rater) et s'arrête quand on le survole.
 */
export default function Notice() {
  const notice = useEditorStore((state) => state.notice)
  const tone = useEditorStore((state) => state.noticeTone)
  const setNotice = useEditorStore((state) => state.setNotice)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (!notice || paused || tone === 'error') return
    const timer = setTimeout(() => setNotice(null), AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [notice, tone, paused, setNotice])

  if (!notice) return null
  const { box, hover, icon: Icon } = TONES[tone]

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={clsx('absolute left-1/2 top-3 z-20 flex max-w-lg -translate-x-1/2 items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow', box)}
    >
      <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <p>{notice}</p>
      <button
        type="button"
        onClick={() => setNotice(null)}
        aria-label={fr.notices.dismiss}
        className={clsx('rounded p-0.5', hover)}
      >
        <X size={16} />
      </button>
    </div>
  )
}
