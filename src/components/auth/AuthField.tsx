import { useId } from 'react'

interface AuthFieldProps {
  label: string
  type: 'email' | 'password'
  value: string
  autoComplete: string
  hint?: string
  onChange: (value: string) => void
}

export default function AuthField({ label, type, value, autoComplete, hint, onChange }: AuthFieldProps) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-2 focus:outline-indigo-200"
      />
      {hint && (
        <span id={`${id}-hint`} className="text-xs text-slate-500">
          {hint}
        </span>
      )}
    </div>
  )
}
