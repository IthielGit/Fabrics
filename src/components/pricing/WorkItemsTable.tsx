import { ChevronDown, ChevronRight } from 'lucide-react'
import { Fragment, useState } from 'react'
import type { WorkItem } from '../../features/pricing/model'
import { searchItems } from '../../features/pricing/search'
import { useT } from '../../i18n/useT'
import { formatIsoDay } from '../../lib/date'
import { usePricingStore } from '../../stores/pricingStore'
import { ListToolbar, RowActions, RowDialogs, type RowDialog } from './ListParts'
import { DISPLAY_LIMIT, ListHead, PriceCell } from './PriceCell'
import { TABLE_CELL } from './styles'
import WorkComponentsTable from './WorkComponentsTable'
import WorkItemDialog from './WorkItemDialog'

/** Postes de travaux (D23-11) : prix brut, sous-détail dépliable, historique. */
export default function WorkItemsTable({ canEdit }: { canEdit: boolean }) {
  const t = useT()
  const items = usePricingStore((state) => state.workItems)
  const repository = usePricingStore((state) => state.repository)
  const saveWorkItem = usePricingStore((state) => state.saveWorkItem)
  const deleteWorkItem = usePricingStore((state) => state.deleteWorkItem)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const [dialog, setDialog] = useState<RowDialog<WorkItem> | null>(null)

  const { shown, matchCount } = searchItems(items, query, DISPLAY_LIMIT)

  return (
    <div>
      <ListToolbar
        query={query}
        onQuery={setQuery}
        shown={shown.length}
        total={items.length}
        matchCount={matchCount}
        addLabel={canEdit ? t('pricing.addWork') : null}
        onAdd={() => setDialog({ type: 'edit', item: null })}
      />

      {shown.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <ListHead columns={[[t('pricing.work.price'), true]]} />
            <tbody>
              {shown.map((item) => {
                const expanded = open === item.id
                return (
                  <Fragment key={item.id}>
                    <tr title={t('pricing.lastChange', { who: item.updatedByEmail || '—', when: formatIsoDay(item.updatedAt) })}>
                      <td className={`${TABLE_CELL} whitespace-nowrap`}>
                        <button
                          type="button"
                          aria-expanded={expanded}
                          aria-label={t('pricing.work.showDetail', { code: item.code || item.designation })}
                          className="inline-flex items-center gap-1 tabular-nums hover:underline"
                          onClick={() => setOpen(expanded ? null : item.id)}
                        >
                          {expanded ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
                          {item.code}
                        </button>
                      </td>
                      <td className={TABLE_CELL}>
                        {item.designation}
                        {item.category && <span className="block text-xs text-muted-foreground">{item.category}</span>}
                      </td>
                      <td className={TABLE_CELL}>{item.unit}</td>
                      <PriceCell value={item.priceHt} />
                      <td className={`${TABLE_CELL} whitespace-nowrap text-right`}>
                        <RowActions
                          canEdit={canEdit}
                          onEdit={() => setDialog({ type: 'edit', item })}
                          onHistory={() => setDialog({ type: 'history', item })}
                          onDelete={() => setDialog({ type: 'delete', item })}
                        />
                      </td>
                    </tr>
                    {expanded && (
                      <tr>
                        <td colSpan={5} className="border-b border-border/60 bg-muted/30 px-4 py-3">
                          <WorkComponentsTable item={item} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {dialog?.type === 'edit' && (
        <WorkItemDialog
          item={dialog.item}
          onSave={(fields) => saveWorkItem(fields, dialog.item?.id)}
          onClose={() => setDialog(null)}
        />
      )}
      <RowDialogs dialog={dialog} repository={repository} onDelete={deleteWorkItem} onClose={() => setDialog(null)} />
    </div>
  )
}
