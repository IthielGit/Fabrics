import { formatAriary } from '../../features/pricing/money'
import { useT } from '../../i18n/useT'
import { TABLE_CELL, TABLE_HEAD } from './styles'

/** Nombre de lignes affichées au plus dans une liste ; la recherche permet d'aller plus loin. */
export const DISPLAY_LIMIT = 300

/** Cellule « prix HT » : le prix, ou « Sans prix » en évidence. */
export function PriceCell({ value }: { value: bigint | null }) {
  const t = useT()
  return (
    <td className={`${TABLE_CELL} whitespace-nowrap text-right tabular-nums`}>
      {value === null ? <span className="text-amber-600">{t('pricing.noPrice')}</span> : formatAriary(value)}
    </td>
  )
}

/**
 * En-tête d'une liste de la bibliothèque : Code, Désignation, Unité, colonnes propres à la liste
 * (`[libellé, à droite ?]`), puis la colonne des actions.
 */
export function ListHead({ columns }: { columns: readonly (readonly [string, boolean])[] }) {
  const t = useT()
  return (
    <thead>
      <tr>
        <th className={TABLE_HEAD}>{t('pricing.col.code')}</th>
        <th className={TABLE_HEAD}>{t('pricing.col.designation')}</th>
        <th className={TABLE_HEAD}>{t('pricing.col.unit')}</th>
        {columns.map(([label, right]) => (
          <th key={label} className={right ? `${TABLE_HEAD} text-right` : TABLE_HEAD}>
            {label}
          </th>
        ))}
        <th className={TABLE_HEAD}>
          <span className="sr-only">{t('pricing.col.actions')}</span>
        </th>
      </tr>
    </thead>
  )
}
