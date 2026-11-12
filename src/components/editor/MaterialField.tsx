import { useId } from 'react'
import { fr } from '../../i18n/fr'

interface MaterialFieldProps<T extends string> {
  label: string
  options: readonly T[]
  optionLabels: Record<T, string>
  /** Valeur commune (`undefined` = aucun), ou `'mixed'` si la sélection n'est pas homogène. */
  value: T | undefined | 'mixed'
  /** Appelé avec le choix, ou `undefined` pour « Aucun ». */
  onChange: (value: T | undefined) => void
}

const NONE = ''
const MIXED = '__mixed__'

/** Liste déroulante d'un matériau ou d'une couverture, avec « Aucun » (rendu neutre) en tête. */
export default function MaterialField<T extends string>({
  label,
  options,
  optionLabels,
  value,
  onChange,
}: MaterialFieldProps<T>) {
  const id = useId()
  return (
    <div className="flex items-center justify-between gap-2">
      <label htmlFor={id} className="text-sm text-slate-600">
        {label}
      </label>
      <select
        id={id}
        value={value === 'mixed' ? MIXED : (value ?? NONE)}
        onChange={(event) => {
          const next = event.target.value
          if (next === MIXED) return
          onChange(next === NONE ? undefined : (next as T))
        }}
        className="w-36 rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-900"
      >
        {value === 'mixed' && (
          <option value={MIXED} disabled>
            {fr.materials.mixed}
          </option>
        )}
        <option value={NONE}>{fr.materials.none}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {optionLabels[option]}
          </option>
        ))}
      </select>
    </div>
  )
}
