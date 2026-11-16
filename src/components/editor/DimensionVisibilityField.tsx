import { useId } from 'react'
import { fr } from '../../i18n/fr'
import type { DimensionElement } from '../../types/document'

type Choice = 'both' | 'client' | 'execution'
const CHOICES: readonly Choice[] = ['both', 'client', 'execution']

/**
 * Champ « Visible en : Les deux / Client / Exécution » d'une cote tracée à la main (M10 ter lot B).
 * `'mixed'` : plusieurs cotes sélectionnées aux réglages différents.
 */
export default function DimensionVisibilityField({
  value,
  onChange,
}: {
  value: DimensionElement['visibleIn'] | 'mixed'
  onChange: (visibleIn: DimensionElement['visibleIn']) => void
}) {
  const id = useId()
  return (
    <div className="flex items-center justify-between gap-2" title={fr.dimensioning.visibleInTitle}>
      <label htmlFor={id} className="text-sm text-slate-600">
        {fr.dimensioning.visibleIn}
      </label>
      <select
        id={id}
        value={value ?? 'both'}
        onChange={(event) => {
          const choice = event.target.value as Choice
          onChange(choice === 'both' ? undefined : choice)
        }}
        className="w-36 rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-900"
      >
        {value === 'mixed' && (
          <option value="mixed" disabled>
            {fr.properties.mixedValues}
          </option>
        )}
        {CHOICES.map((choice) => (
          <option key={choice} value={choice}>
            {fr.dimensioning.visibleInOptions[choice]}
          </option>
        ))}
      </select>
    </div>
  )
}
