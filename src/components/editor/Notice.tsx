import { X } from 'lucide-react'
import { useEffect } from 'react'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'

const AUTO_DISMISS_MS = 8000

/** Bandeau d'information (par exemple « fichier refusé »), qui se ferme tout seul. */
export default function Notice() {
  const notice = useEditorStore((state) => state.notice)
  const setNotice = useEditorStore((state) => state.setNotice)

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [notice, setNotice])

  if (!notice) return null

  return (
    <div
      role="alert"
      className="absolute left-1/2 top-3 z-20 flex max-w-lg -translate-x-1/2 items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow"
    >
      <p>{notice}</p>
      <button
        type="button"
        onClick={() => setNotice(null)}
        aria-label={fr.notices.dismiss}
        className="rounded p-0.5 hover:bg-amber-100"
      >
        <X size={16} />
      </button>
    </div>
  )
}
