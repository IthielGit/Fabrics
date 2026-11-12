import { Eye, EyeOff } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { fr } from '../../i18n/fr'

interface AuthFieldProps {
  label: string
  type: 'email' | 'password'
  value: string
  autoComplete: string
  hint?: string
  /** Lien ou action affiché à droite du libellé (ex. « Mot de passe oublié ? »). */
  labelAction?: ReactNode
  /** Le champ contient une erreur de saisie : bordure rouge et aria-invalid. */
  invalid?: boolean
  autoFocus?: boolean
  onChange: (value: string) => void
}

const INPUT_BASE =
  'w-full rounded-lg border bg-white px-3.5 py-2.5 text-base text-slate-900 caret-indigo-600 placeholder:text-slate-400 outline-none transition-[border-color,box-shadow] duration-150 ease-out focus:ring-4'

export default function AuthField({
  label,
  type,
  value,
  autoComplete,
  hint,
  labelAction,
  invalid = false,
  autoFocus = false,
  onChange,
}: AuthFieldProps) {
  const id = useId()
  const [revealed, setRevealed] = useState(false)
  const isPassword = type === 'password'
  const describedBy = hint ? `${id}-hint` : undefined

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-slate-800">
          {label}
        </label>
        {labelAction}
      </div>
      <div className="relative">
        <input
          id={id}
          type={isPassword && revealed ? 'text' : type}
          value={value}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          onChange={(event) => onChange(event.target.value)}
          className={`${INPUT_BASE} ${isPassword ? 'pr-12' : ''} ${
            invalid
              ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
              : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-100'
          }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((shown) => !shown)}
            aria-label={revealed ? fr.auth.hidePassword : fr.auth.showPassword}
            aria-pressed={revealed}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-slate-500 transition-colors duration-150 hover:text-slate-800 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600"
          >
            {revealed ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        )}
      </div>
      {hint && (
        <span id={`${id}-hint`} className="text-xs text-slate-500">
          {hint}
        </span>
      )}
    </div>
  )
}
