import { Plus } from 'lucide-react'
import { useState } from 'react'
import { QUANTITY_DIMENSIONS } from '../../features/measurements/quantities/types'
import { formatRate } from '../../features/pricing/money'
import { unitCompatible, type PricingRule, type RuleFilter } from '../../features/pricing/rules'
import { fr } from '../../i18n/fr'
import { useT, type Translate } from '../../i18n/useT'
import { usePricingStore } from '../../stores/pricingStore'
import Button from '../ui/Button'
import ConfirmDialog from './ConfirmDialog'
import RuleDialog from './RuleDialog'
import { LINK_BUTTON, TABLE_CELL, TABLE_HEAD } from './styles'

/** Résumé lisible du filtre d'une règle. */
function filterText(filter: RuleFilter, t: Translate): string {
  const parts: string[] = []
  if (filter.wallMaterial) parts.push(fr.materials.walls[filter.wallMaterial])
  if (filter.layerMaterial) parts.push(fr.measurements.layerMaterials[filter.layerMaterial] ?? filter.layerMaterial)
  if (filter.minThickness !== null || filter.maxThickness !== null) {
    const range =
      filter.minThickness !== null && filter.maxThickness !== null
        ? `${filter.minThickness} à ${filter.maxThickness}`
        : filter.minThickness !== null
          ? `≥ ${filter.minThickness}`
          : `≤ ${filter.maxThickness}`
    parts.push(t('pricing.rules.thickness', { range }))
  }
  if (filter.openingKind) parts.push(t(`pricing.rules.opening.${filter.openingKind}`))
  return parts.length > 0 ? parts.join(' · ') : t('pricing.rules.allElements')
}

type Dialog = { type: 'edit'; rule: PricingRule | null } | { type: 'delete'; rule: PricingRule }

/** Règles de l'espace (D23-15) : liste, et pour un admin ajout, modification, activation. */
export default function RulesTable({ canEdit }: { canEdit: boolean }) {
  const t = useT()
  const rules = usePricingStore((state) => state.rules)
  const workItems = usePricingStore((state) => state.workItems)
  const saveRule = usePricingStore((state) => state.saveRule)
  const deleteRule = usePricingStore((state) => state.deleteRule)
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const byId = new Map(workItems.map((w) => [w.id, w]))

  const toggle = (rule: PricingRule) => {
    const { id, libraryId: _l, updatedAt: _u, updatedByEmail: _e, ...fields } = rule
    void saveRule({ ...fields, enabled: !rule.enabled }, id).catch((error: unknown) => console.error('Règle :', error))
  }

  return (
    <div className="space-y-3">
      <p className="max-w-3xl text-xs text-muted-foreground">{t('pricing.rules.intro')}</p>
      {canEdit && (
        <Button variant="primary" onClick={() => setDialog({ type: 'edit', rule: null })}>
          <Plus size={14} aria-hidden="true" />
          {t('pricing.rules.add')}
        </Button>
      )}
      {rules.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">{t('pricing.rules.empty')}</p>}
      {rules.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={TABLE_HEAD}>{t('pricing.rules.col.name')}</th>
                <th className={TABLE_HEAD}>{t('pricing.rules.col.quantity')}</th>
                <th className={TABLE_HEAD}>{t('pricing.rules.col.filter')}</th>
                <th className={TABLE_HEAD}>{t('pricing.rules.col.work')}</th>
                <th className={`${TABLE_HEAD} text-right`}>{t('pricing.rules.col.waste')}</th>
                <th className={TABLE_HEAD}>
                  <span className="sr-only">{t('pricing.col.actions')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => {
                const work = rule.workItemId ? byId.get(rule.workItemId) : undefined
                const dimension = QUANTITY_DIMENSIONS[rule.quantityCode]
                const mismatch = work && !unitCompatible(dimension, work.unit)
                return (
                  <tr key={rule.id} className={rule.enabled ? '' : 'opacity-60'}>
                    <td className={TABLE_CELL}>
                      {rule.name}
                      {!rule.enabled && <span className="ml-2 text-xs text-muted-foreground">{t('pricing.rules.disabled')}</span>}
                    </td>
                    <td className={TABLE_CELL}>{fr.measurements.quantities.codes[rule.quantityCode] ?? rule.quantityCode}</td>
                    <td className={`${TABLE_CELL} text-xs`}>{filterText(rule.filter, t)}</td>
                    <td className={TABLE_CELL}>
                      {work ? (
                        <>
                          <span className="tabular-nums">{work.code}</span> · {work.designation} ({work.unit})
                        </>
                      ) : (
                        <span className="text-amber-600">{t('pricing.rules.workRemoved')}</span>
                      )}
                      {mismatch && (
                        <span className="block text-xs text-amber-600">
                          {t('pricing.rules.unitMismatch', { unit: work.unit, expected: t(`pricing.rules.unit.${dimension}`) })}
                        </span>
                      )}
                    </td>
                    <td className={`${TABLE_CELL} text-right tabular-nums`}>{formatRate(rule.wasteBp)}</td>
                    <td className={`${TABLE_CELL} whitespace-nowrap text-right`}>
                      {canEdit && (
                        <>
                          <button type="button" className={LINK_BUTTON} onClick={() => setDialog({ type: 'edit', rule })}>
                            {t('pricing.edit')}
                          </button>
                          <button type="button" className={LINK_BUTTON} onClick={() => toggle(rule)}>
                            {t(rule.enabled ? 'pricing.rules.disable' : 'pricing.rules.enable')}
                          </button>
                          <button type="button" className={LINK_BUTTON} onClick={() => setDialog({ type: 'delete', rule })}>
                            {t('pricing.delete')}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {dialog?.type === 'edit' && <RuleDialog rule={dialog.rule} onClose={() => setDialog(null)} />}
      {dialog?.type === 'delete' && (
        <ConfirmDialog
          title={t('pricing.rules.deleteTitle')}
          message={t('pricing.rules.deleteMessage', { name: dialog.rule.name })}
          confirmLabel={t('pricing.delete')}
          onConfirm={() => {
            const id = dialog.rule.id
            setDialog(null)
            void deleteRule(id).catch((error: unknown) => console.error('Suppression de la règle :', error))
          }}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  )
}
