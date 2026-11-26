import { Plus, Search } from 'lucide-react'
import type { MoneyInputError } from '../../features/pricing/money'
import type { PricingRepository } from '../../features/pricing/repository'
import type { PriceItemError, PriceItemWarning } from '../../features/pricing/validate'
import { useT } from '../../i18n/useT'
import Button from '../ui/Button'
import ConfirmDialog from './ConfirmDialog'
import HistoryDialog from './HistoryDialog'
import { FIELD_INPUT, LINK_BUTTON } from './styles'

// Morceaux communs aux listes « lignes de prix » et « postes de travaux » (M23, 23.1).

interface ListToolbarProps {
  query: string
  onQuery: (query: string) => void
  shown: number
  total: number
  matchCount: number
  addLabel: string | null
  onAdd: () => void
}

/** Recherche, compteur, bouton d'ajout, et messages « vide » / « aucune correspondance ». */
export function ListToolbar({ query, onQuery, shown, total, matchCount, addLabel, onAdd }: ListToolbarProps) {
  const t = useT()
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="relative min-w-64 flex-1">
          <span className="sr-only">{t('pricing.search')}</span>
          <Search size={14} aria-hidden="true" className="absolute left-2.5 top-2.5 text-muted-foreground" />
          <input
            type="search"
            className={`${FIELD_INPUT} pl-8`}
            placeholder={t('pricing.search')}
            value={query}
            onChange={(event) => onQuery(event.target.value)}
          />
        </label>
        <span className="text-xs text-muted-foreground">{t('pricing.count', { shown, total })}</span>
        {addLabel && (
          <Button variant="primary" onClick={onAdd}>
            <Plus size={14} aria-hidden="true" />
            {addLabel}
          </Button>
        )}
      </div>
      {total === 0 && <p className="py-8 text-center text-sm text-muted-foreground">{t('pricing.empty')}</p>}
      {total > 0 && matchCount === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">{t('pricing.noMatch')}</p>
      )}
    </>
  )
}

/** Boutons d'une ligne : modifier et supprimer (admins), historique (tous). */
export function RowActions({
  canEdit,
  onEdit,
  onHistory,
  onDelete,
}: {
  canEdit: boolean
  onEdit: () => void
  onHistory: () => void
  onDelete: () => void
}) {
  const t = useT()
  return (
    <>
      {canEdit && (
        <button type="button" className={LINK_BUTTON} onClick={onEdit}>
          {t('pricing.edit')}
        </button>
      )}
      <button type="button" className={LINK_BUTTON} onClick={onHistory}>
        {t('pricing.history')}
      </button>
      {canEdit && (
        <button type="button" className={LINK_BUTTON} onClick={onDelete}>
          {t('pricing.delete')}
        </button>
      )}
    </>
  )
}

export type RowDialog<T> = { type: 'edit'; item: T | null } | { type: 'history'; item: T } | { type: 'delete'; item: T }

/** Fenêtres « historique » et « supprimer » d'une ligne. */
export function RowDialogs<T extends { id: string; designation: string }>({
  dialog,
  repository,
  onDelete,
  onClose,
}: {
  dialog: RowDialog<T> | null
  repository: PricingRepository | null
  onDelete: (id: string) => Promise<void>
  onClose: () => void
}) {
  const t = useT()
  if (dialog?.type === 'history' && repository) {
    return <HistoryDialog repository={repository} itemId={dialog.item.id} name={dialog.item.designation} onClose={onClose} />
  }
  if (dialog?.type === 'delete') {
    return (
      <ConfirmDialog
        title={t('pricing.deleteTitle')}
        message={t('pricing.deleteMessage', { name: dialog.item.designation })}
        confirmLabel={t('pricing.delete')}
        onConfirm={() => {
          const id = dialog.item.id
          onClose()
          void onDelete(id).catch((error: unknown) => console.error('Suppression dans la bibliothèque :', error))
        }}
        onClose={onClose}
      />
    )
  }
  return null
}

/** Erreurs bloquantes et avertissements d'un formulaire de prix, puis Annuler / Enregistrer. */
export function FormFooter({
  moneyError,
  errors,
  warnings,
  saveError,
  disabled,
  onCancel,
}: {
  moneyError: MoneyInputError | null
  errors: readonly PriceItemError[]
  warnings: readonly PriceItemWarning[]
  saveError: boolean
  disabled: boolean
  onCancel: () => void
}) {
  const t = useT()
  return (
    <>
      <ul className="space-y-1 text-xs" aria-live="polite">
        {moneyError && <li className="text-red-600">{t(`pricing.money.${moneyError}`)}</li>}
        {errors.map((error) => (
          <li key={error} className="text-red-600">
            {t(`pricing.error.${error}`)}
          </li>
        ))}
        {!moneyError &&
          warnings.map((warning) => (
            <li key={warning} className="text-amber-600">
              {t(`pricing.warning.${warning}`)}
            </li>
          ))}
        {saveError && <li className="text-red-600">{t('pricing.saveError')}</li>}
      </ul>
      <div className="mt-2 flex justify-end gap-2">
        <Button onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit" variant="primary" disabled={disabled}>
          {t('common.save')}
        </Button>
      </div>
    </>
  )
}
