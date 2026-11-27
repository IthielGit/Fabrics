import type { QuantityOverride } from '../../features/pricing/rules'
import { fr } from '../../i18n/fr'
import { useT } from '../../i18n/useT'
import { LINK_BUTTON } from './styles'

/** Corrections à la main du devis (D23-15), visibles et annulables. */
export default function DqeOverrides({
  overrides,
  canEdit,
  onUndo,
}: {
  overrides: readonly QuantityOverride[]
  canEdit: boolean
  onUndo: (id: string) => void
}) {
  const t = useT()
  if (overrides.length === 0) return null
  return (
    <section className="space-y-1 text-xs">
      <h3 className="font-semibold uppercase text-muted-foreground">{t('dqe.overrides')}</h3>
      <ul className="space-y-0.5">
        {overrides.map((override) => {
          const code = override.quantityKey.split(':')[1] as keyof typeof fr.measurements.quantities.codes
          return (
            <li key={override.id}>
              {t('dqe.overrideRemoved', { code: override.note || '—', quantity: fr.measurements.quantities.codes[code] ?? code })}
              {canEdit && (
                <button type="button" className={`${LINK_BUTTON} ml-1`} onClick={() => onUndo(override.id)}>
                  {t('dqe.overrideUndo')}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
