import { useRef } from 'react'
import { MAX_VERSION_NAME, normalizeVersionName } from '../../features/versions/versionsLogic'

interface VersionNameInputProps {
  initial?: string
  label: string
  placeholder?: string
  /** Nom nettoyé (`null` si vidé). Entrée ou sortie du champ valident ; Échap annule. */
  onSubmit: (name: string | null) => void
  onCancel: () => void
}

/** Champ de saisie du nom d'une version (M15, lot B). */
export default function VersionNameInput({ initial = '', label, placeholder, onSubmit, onCancel }: VersionNameInputProps) {
  const done = useRef(false)
  const finish = (value: string | null) => {
    if (done.current) return
    done.current = true
    if (value === null) onCancel()
    else onSubmit(normalizeVersionName(value))
  }

  return (
    <input
      autoFocus
      defaultValue={initial}
      aria-label={label}
      placeholder={placeholder}
      maxLength={MAX_VERSION_NAME}
      onFocus={(event) => event.target.select()}
      onBlur={(event) => finish(event.target.value.trim() === initial.trim() ? null : event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') finish(event.currentTarget.value)
        else if (event.key === 'Escape') finish(null)
      }}
      onClick={(event) => event.stopPropagation()}
      className="w-full min-w-0 rounded border border-indigo-500 px-2 py-1 text-sm text-slate-900 focus:outline-none"
    />
  )
}
