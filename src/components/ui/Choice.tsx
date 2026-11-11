import clsx from 'clsx'

const OPTION =
  'flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50'

interface ChoiceProps {
  name: string
  checked: boolean
  disabled?: boolean
  onSelect: () => void
  children: React.ReactNode
}

/** Une option d'un groupe de boutons radio, présentée comme une pastille. */
export default function Choice({ name, checked, disabled, onSelect, children }: ChoiceProps) {
  return (
    <label
      className={clsx(
        OPTION,
        checked ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-slate-300 text-slate-700',
      )}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
        className="accent-indigo-600"
      />
      {children}
    </label>
  )
}
