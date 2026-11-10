import { useId, useState, type KeyboardEvent } from 'react'

interface TextFieldProps {
  label: string
  value: string
  maxLength?: number
  onCommit: (value: string) => void
}

/** Champ texte : la valeur n'est validée qu'à la sortie du champ ou avec Entrée (Échap annule). */
export default function TextField({ label, value, maxLength = 100, onCommit }: TextFieldProps) {
  const id = useId()
  const [draft, setDraft] = useState<string | null>(null)

  const commit = (text: string) => {
    setDraft(null)
    const trimmed = text.trim()
    // Un nom vide est refusé : on garde l'ancien.
    if (trimmed && trimmed !== value) onCommit(trimmed)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      commit(event.currentTarget.value)
      event.currentTarget.blur()
    } else if (event.key === 'Escape') {
      setDraft(null)
      event.currentTarget.blur()
    }
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <label htmlFor={id} className="text-sm text-slate-600">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={draft ?? value}
        maxLength={maxLength}
        onFocus={(event) => event.target.select()}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={(event) => commit(event.target.value)}
        onKeyDown={handleKeyDown}
        className="w-36 rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
      />
    </div>
  )
}
