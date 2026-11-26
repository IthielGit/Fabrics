import { useEffect, useState } from 'react'
import type { PriceHistoryEntry } from '../../features/pricing/model'
import { formatAriary } from '../../features/pricing/money'
import type { PricingRepository } from '../../features/pricing/repository'
import { useT } from '../../i18n/useT'
import Modal from '../ui/Modal'
import { TABLE_CELL, TABLE_HEAD } from './styles'

interface HistoryDialogProps {
  repository: PricingRepository
  itemId: string
  name: string
  onClose: () => void
}

function formatWhen(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleString('fr-BE', { dateStyle: 'short', timeStyle: 'short' })
}

/** Historique d'une ligne (D23-7) : auteur, date, ancien et nouveau prix. */
export default function HistoryDialog({ repository, itemId, name, onClose }: HistoryDialogProps) {
  const t = useT()
  const [entries, setEntries] = useState<PriceHistoryEntry[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    repository.listHistory(itemId).then(
      (list) => !cancelled && setEntries(list),
      (error: unknown) => {
        console.error('Historique des prix :', error)
        if (!cancelled) setFailed(true)
      },
    )
    return () => {
      cancelled = true
    }
  }, [repository, itemId])

  const price = (value: bigint | null) => (value === null ? '—' : formatAriary(value))

  return (
    <Modal title={t('pricing.historyTitle', { name })} onClose={onClose}>
      {failed && <p className="text-sm text-red-600">{t('pricing.loadError')}</p>}
      {!failed && entries === null && <p className="text-sm text-muted-foreground">{t('common.loading')}</p>}
      {entries?.length === 0 && <p className="text-sm text-muted-foreground">{t('pricing.historyEmpty')}</p>}
      {entries && entries.length > 0 && (
        <div className="max-h-96 overflow-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={TABLE_HEAD}>{t('pricing.historyCol.when')}</th>
                <th className={TABLE_HEAD}>{t('pricing.historyCol.who')}</th>
                <th className={TABLE_HEAD}>{t('pricing.historyCol.action')}</th>
                <th className={`${TABLE_HEAD} text-right`}>{t('pricing.historyCol.old')}</th>
                <th className={`${TABLE_HEAD} text-right`}>{t('pricing.historyCol.new')}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className={`${TABLE_CELL} whitespace-nowrap`}>{formatWhen(entry.changedAt)}</td>
                  <td className={`${TABLE_CELL} break-all`}>{entry.changedByEmail || '—'}</td>
                  <td className={TABLE_CELL}>{t(`pricing.historyAction.${entry.action}`)}</td>
                  <td className={`${TABLE_CELL} whitespace-nowrap text-right tabular-nums`}>{price(entry.oldPriceHt)}</td>
                  <td className={`${TABLE_CELL} whitespace-nowrap text-right tabular-nums`}>{price(entry.newPriceHt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  )
}
