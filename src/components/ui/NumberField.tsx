import { useId, useState, type KeyboardEvent } from 'react'
import { formatNumber, parseNumber } from '../../lib/numberFormat'

interface NumberFieldProps {
  label: string
  /** Valeur actuelle ; `null` si elle diffère d'un élément à l'autre. */
  value: number | null
  suffix?: string
  /** Pas des flèches ↑ ↓ (×10 avec Maj). */
  step?: number
  onCommit: (value: number) => void
}

/**
 * Champ numérique : la valeur n'est validée qu'à la sortie du champ ou avec Entrée
 * (un seul état d'historique par modification, pas un par frappe).
 */
export default function NumberField({ label, value, suffix, step = 1, onCommit }: NumberFieldProps) {
  const id = useId()
  const [draft, setDraft] = useState<string | null>(null)

  const shown = draft ?? (value === null ? '' : formatNumber(value))

  const commit = (text: string) => {
    const parsed = parseNumber(text)
    setDraft(null)
    if (parsed !== null && parsed !== value) onCommit(parsed)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      commit(event.currentTarget.value)
      event.currentTarget.blur()
    } else if (event.key === 'Escape') {
      setDraft(null)
      event.currentTarget.blur()
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault()
      const base = parseNumber(event.currentTarget.value) ?? value ?? 0
      const delta = (event.shiftKey ? step * 10 : step) * (event.key === 'ArrowUp' ? 1 : -1)
      const next = base + delta
      setDraft(null)
      onCommit(next)
    }
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <label htmlFor={id} className="text-sm text-slate-600">
        {label}
      </label>
      <div className="flex items-center gap-1">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={shown}
          onFocus={(event) => event.target.select()}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={(event) => commit(event.target.value)}
          onKeyDown={handleKeyDown}
          className="w-20 rounded-md border border-slate-300 px-2 py-1 text-right text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
        />
        <span className="w-6 text-xs text-slate-500">{suffix}</span>
      </div>
    </div>
  )
}
