import { useEffect, useRef } from 'react'

interface CheckboxFieldProps {
  label: string
  /** `'mixed'` : cochée pour certains éléments sélectionnés, pas pour d'autres (affiche un tiret). */
  checked: boolean | 'mixed'
  title?: string
  onChange: (checked: boolean) => void
}

/** Case à cocher avec libellé ; un clic sur l'état « mixte » coche tout. */
export default function CheckboxField({ label, checked, title, onChange }: CheckboxFieldProps) {
  const ref = useRef<HTMLInputElement>(null)
  const mixed = checked === 'mixed'

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = mixed
  }, [mixed])

  return (
    <label className="flex items-center gap-2 text-sm text-slate-600" title={title}>
      <input
        ref={ref}
        type="checkbox"
        checked={checked === true}
        onChange={() => onChange(mixed ? true : !checked)}
      />
      {label}
    </label>
  )
}
