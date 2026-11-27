import { useState } from 'react'
import type { PriceItem, PriceKind } from '../../features/pricing/model'
import { formatAriary } from '../../features/pricing/money'
import { searchItems } from '../../features/pricing/search'
import { useT } from '../../i18n/useT'
import { formatIsoDay } from '../../lib/date'
import { usePricingStore } from '../../stores/pricingStore'
import { ListToolbar, RowActions, RowDialogs, type RowDialog } from './ListParts'
import PriceItemDialog from './PriceItemDialog'
import { DISPLAY_LIMIT, ListHead, PriceCell } from './PriceCell'
import { TABLE_CELL } from './styles'

interface PriceItemsTableProps {
  kind: PriceKind
  canEdit: boolean
}

/** Matériaux, matériel ou main-d'œuvre : liste, recherche, et pour un admin ajout et modification. */
export default function PriceItemsTable({ kind, canEdit }: PriceItemsTableProps) {
  const t = useT()
  const allItems = usePricingStore((state) => state.priceItems)
  const library = usePricingStore((state) => state.library)
  const repository = usePricingStore((state) => state.repository)
  const savePriceItem = usePricingStore((state) => state.savePriceItem)
  const deletePriceItem = usePricingStore((state) => state.deletePriceItem)
  const [query, setQuery] = useState('')
  const [dialog, setDialog] = useState<RowDialog<PriceItem> | null>(null)

  const items = allItems.filter((item) => item.kind === kind)
  const { shown, matchCount } = searchItems(items, query, DISPLAY_LIMIT)

  return (
    <div>
      <ListToolbar
        query={query}
        onQuery={setQuery}
        shown={shown.length}
        total={items.length}
        matchCount={matchCount}
        addLabel={canEdit ? t('pricing.add') : null}
        onAdd={() => setDialog({ type: 'edit', item: null })}
      />

      {shown.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <ListHead
              columns={[
                [t('pricing.col.priceHt'), true],
                [t('pricing.col.source'), true],
                [t('pricing.col.supplier'), false],
                [t('pricing.field.date'), false],
              ]}
            />
            <tbody>
              {shown.map((item) => (
                <tr
                  key={item.id}
                  title={t('pricing.lastChange', { who: item.updatedByEmail || '—', when: formatIsoDay(item.updatedAt) })}
                >
                  <td className={`${TABLE_CELL} whitespace-nowrap tabular-nums`}>{item.code}</td>
                  <td className={TABLE_CELL}>
                    <span className="whitespace-pre-line">{item.designation}</span>
                    {item.category && <span className="block text-xs text-muted-foreground">{item.category}</span>}
                  </td>
                  <td className={TABLE_CELL}>{item.unit}</td>
                  <PriceCell value={item.priceHt} />
                  <td className={`${TABLE_CELL} whitespace-nowrap text-right text-xs text-muted-foreground tabular-nums`}>
                    {item.sourcePrice !== null && (
                      <>
                        {formatAriary(item.sourcePrice)}
                        <span className="block">{t(`pricing.basis.${item.sourceBasis}`)}</span>
                        {item.vatExempt && <span className="block text-amber-600">{t('pricing.vatExempt')}</span>}
                      </>
                    )}
                  </td>
                  <td className={`${TABLE_CELL} text-xs`}>{item.supplier}</td>
                  <td className={`${TABLE_CELL} whitespace-nowrap text-xs`}>
                    {item.effectiveDate ? formatIsoDay(item.effectiveDate) : ''}
                  </td>
                  <td className={`${TABLE_CELL} whitespace-nowrap text-right`}>
                    <RowActions
                      canEdit={canEdit}
                      onEdit={() => setDialog({ type: 'edit', item })}
                      onHistory={() => setDialog({ type: 'history', item })}
                      onDelete={() => setDialog({ type: 'delete', item })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {dialog?.type === 'edit' && library && (
        <PriceItemDialog
          item={dialog.item}
          kind={kind}
          vatRateBp={library.vatRateBp}
          onSave={(fields) => savePriceItem(fields, dialog.item?.id)}
          onClose={() => setDialog(null)}
        />
      )}
      <RowDialogs dialog={dialog} repository={repository} onDelete={deletePriceItem} onClose={() => setDialog(null)} />
    </div>
  )
}
