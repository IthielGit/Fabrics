import { useState } from 'react'
import { WALL_MATERIALS } from '../../features/building/materials'
import { QUANTITY_DIMENSIONS, type QuantityCode } from '../../features/measurements/quantities/types'
import { formatRate, parseRateInput } from '../../features/pricing/money'
import { EMPTY_FILTER, RULE_QUANTITY_CODES, validateRule, type OpeningKind, type PricingRule, type PricingRuleFields } from '../../features/pricing/rules'
import { searchItems } from '../../features/pricing/search'
import { fr } from '../../i18n/fr'
import { useT } from '../../i18n/useT'
import { usePricingStore } from '../../stores/pricingStore'
import type { WallMaterial } from '../../types/document'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { FIELD_INPUT, FIELD_LABEL } from './styles'
import { useSaveForm } from './useSaveForm'

const OPENING_KINDS: readonly OpeningKind[] = ['door', 'window', 'bay']

function parseMm(text: string): number | null | 'invalid' {
  const trimmed = text.trim()
  if (trimmed === '') return null
  return /^\d+$/.test(trimmed) ? Number(trimmed) : 'invalid'
}

/** Ajout ou modification d'une règle de l'espace (admins). */
export default function RuleDialog({ rule, onClose }: { rule: PricingRule | null; onClose: () => void }) {
  const t = useT()
  const workItems = usePricingStore((state) => state.workItems)
  const rules = usePricingStore((state) => state.rules)
  const saveRule = usePricingStore((state) => state.saveRule)
  const [fields, setFields] = useState<PricingRuleFields>(
    () =>
      rule ?? {
        name: '',
        quantityCode: 'wall.netArea',
        filter: EMPTY_FILTER,
        workItemId: null,
        wasteBp: 0,
        enabled: true,
        position: rules.reduce((max, r) => Math.max(max, r.position + 1), 0),
      },
  )
  const [minText, setMinText] = useState(rule?.filter.minThickness?.toString() ?? '')
  const [maxText, setMaxText] = useState(rule?.filter.maxThickness?.toString() ?? '')
  const [wasteText, setWasteText] = useState(rule ? formatRate(rule.wasteBp).replace(/ %$/, '') : '0')
  const [query, setQuery] = useState('')
  const { saving, saveError, submit } = useSaveForm(
    (value: PricingRuleFields) => saveRule(value, rule?.id),
    onClose,
  )

  const min = parseMm(minText)
  const max = parseMm(maxText)
  const waste = parseRateInput(wasteText)
  const candidate: PricingRuleFields = {
    ...fields,
    filter: {
      ...fields.filter,
      minThickness: min === 'invalid' ? -1 : min,
      maxThickness: max === 'invalid' ? -1 : max,
      layerMaterial: fields.filter.layerMaterial?.trim() || null,
    },
    wasteBp: waste ?? -1,
  }
  const byId = new Map(workItems.map((w) => [w.id, w]))
  const dimension = QUANTITY_DIMENSIONS[fields.quantityCode]
  const errors = validateRule(candidate, byId, dimension)
  const chosen = fields.workItemId ? byId.get(fields.workItemId) : undefined
  const { shown } = searchItems(workItems, query, 50)
  const options = chosen && !shown.includes(chosen) ? [chosen, ...shown] : shown

  const patchFilter = (change: Partial<PricingRuleFields['filter']>) =>
    setFields((current) => ({ ...current, filter: { ...current.filter, ...change } }))
  const isWall = fields.quantityCode.startsWith('wall')
  const isOpening = fields.quantityCode.startsWith('opening')

  return (
    <Modal title={t(rule ? 'pricing.rules.editTitle' : 'pricing.rules.addTitle')} onClose={onClose} size="wide">
      <form onSubmit={(event) => submit(event, candidate, errors.length > 0)} className="grid gap-3 text-sm">
        <label className="block">
          <span className={FIELD_LABEL}>{t('pricing.rules.field.name')}</span>
          <input
            className={FIELD_INPUT}
            value={fields.name}
            maxLength={200}
            onChange={(event) => setFields((c) => ({ ...c, name: event.target.value }))}
          />
        </label>
        <label className="block">
          <span className={FIELD_LABEL}>{t('pricing.rules.field.quantity')}</span>
          <select
            className={FIELD_INPUT}
            value={fields.quantityCode}
            onChange={(event) => setFields((c) => ({ ...c, quantityCode: event.target.value as QuantityCode }))}
          >
            {RULE_QUANTITY_CODES.map((code) => (
              <option key={code} value={code}>
                {fr.measurements.quantities.codes[code]} ({t(`pricing.rules.unit.${QUANTITY_DIMENSIONS[code]}`)})
              </option>
            ))}
          </select>
        </label>
        {isWall && (
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={FIELD_LABEL}>{t('pricing.rules.field.wallMaterial')}</span>
              <select
                className={FIELD_INPUT}
                value={fields.filter.wallMaterial ?? ''}
                onChange={(event) => patchFilter({ wallMaterial: (event.target.value || null) as WallMaterial | null })}
              >
                <option value="">{t('pricing.rules.field.any')}</option>
                {WALL_MATERIALS.map((m) => (
                  <option key={m} value={m}>
                    {fr.materials.walls[m]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={FIELD_LABEL}>{t('pricing.rules.field.layerMaterial')}</span>
              <select
                className={FIELD_INPUT}
                value={fields.filter.layerMaterial ?? ''}
                onChange={(event) => patchFilter({ layerMaterial: event.target.value || null })}
              >
                <option value="">{t('pricing.rules.field.any')}</option>
                {Object.entries(fr.measurements.layerMaterials).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={FIELD_LABEL}>{t('pricing.rules.field.minThickness')}</span>
              <input className={FIELD_INPUT} inputMode="numeric" value={minText} onChange={(e) => setMinText(e.target.value)} />
            </label>
            <label className="block">
              <span className={FIELD_LABEL}>{t('pricing.rules.field.maxThickness')}</span>
              <input className={FIELD_INPUT} inputMode="numeric" value={maxText} onChange={(e) => setMaxText(e.target.value)} />
            </label>
          </div>
        )}
        {isOpening && (
          <label className="block">
            <span className={FIELD_LABEL}>{t('pricing.rules.field.openingKind')}</span>
            <select
              className={FIELD_INPUT}
              value={fields.filter.openingKind ?? ''}
              onChange={(event) => patchFilter({ openingKind: (event.target.value || null) as OpeningKind | null })}
            >
              <option value="">{t('pricing.rules.field.any')}</option>
              {OPENING_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {t(`pricing.rules.opening.${kind}`)}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="block">
          <span className={FIELD_LABEL}>{t('pricing.rules.field.work')}</span>
          <input
            type="search"
            className={`${FIELD_INPUT} mb-1`}
            placeholder={t('pricing.rules.field.workSearch')}
            aria-label={t('pricing.rules.field.workSearch')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select
            className={FIELD_INPUT}
            size={6}
            aria-label={t('pricing.rules.field.work')}
            value={fields.workItemId ?? ''}
            onChange={(event) => setFields((c) => ({ ...c, workItemId: event.target.value || null }))}
          >
            {options.map((w) => (
              <option key={w.id} value={w.id}>
                {w.code} · {w.designation} ({w.unit})
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={FIELD_LABEL}>{t('pricing.rules.field.waste')}</span>
            <input className={FIELD_INPUT} inputMode="decimal" value={wasteText} onChange={(e) => setWasteText(e.target.value)} />
          </label>
          <label className="mt-5 flex items-center gap-2">
            <input
              type="checkbox"
              checked={fields.enabled}
              onChange={(event) => setFields((c) => ({ ...c, enabled: event.target.checked }))}
            />
            {t('pricing.rules.field.enabled')}
          </label>
        </div>
        <ul className="space-y-1 text-xs text-red-600" aria-live="polite">
          {errors.map((error) => (
            <li key={error}>
              {error === 'unitMismatch' && chosen
                ? t('pricing.rules.unitMismatch', { unit: chosen.unit, expected: t(`pricing.rules.unit.${dimension}`) })
                : t(`pricing.rules.error.${error === 'unitMismatch' ? 'work' : error}`)}
            </li>
          ))}
          {saveError && <li>{t('pricing.saveError')}</li>}
        </ul>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" variant="primary" disabled={errors.length > 0 || saving}>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
