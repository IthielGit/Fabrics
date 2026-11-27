import { useState } from 'react'
import {
  emptyPriceItem,
  PRICE_KINDS,
  priceHtFromSource,
  type PriceItem,
  type PriceItemFields,
  type PriceKind,
  type SourceBasis,
} from '../../features/pricing/model'
import { formatAriary, formatRate, parseMoneyInput } from '../../features/pricing/money'
import { normalizeUnit } from '../../features/pricing/units'
import { validatePriceItem } from '../../features/pricing/validate'
import { useT } from '../../i18n/useT'
import Modal from '../ui/Modal'
import { FormFooter } from './ListParts'
import { FIELD_INPUT, FIELD_LABEL } from './styles'
import { useSaveForm } from './useSaveForm'

interface PriceItemDialogProps {
  /** Ligne à modifier ; absente : nouvelle ligne du type `kind`. */
  item: PriceItem | null
  kind: PriceKind
  vatRateBp: number
  onSave: (fields: PriceItemFields) => Promise<void>
  onClose: () => void
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Prix d'affichage dans le champ : le prix source s'il existe, sinon le HT. */
function initialPriceText(item: PriceItem | null): string {
  const value = item?.sourcePrice ?? item?.priceHt ?? null
  return value === null ? '' : formatAriary(value, { unit: false })
}

/** Ajout ou modification d'une ligne de prix (admins). Le prix HT est calculé ici, en un seul endroit. */
export default function PriceItemDialog({ item, kind, vatRateBp, onSave, onClose }: PriceItemDialogProps) {
  const t = useT()
  const [fields, setFields] = useState<PriceItemFields>(() => item ?? emptyPriceItem(kind, today()))
  const [priceText, setPriceText] = useState(() => initialPriceText(item))
  const [basis, setBasis] = useState<SourceBasis>(item?.sourceBasis ?? 'ht')
  const { saving, saveError, submit } = useSaveForm(onSave, onClose)

  const money = priceText.trim() === '' ? null : parseMoneyInput(priceText)
  const entered = money?.ok ? money.value : null
  const vatExempt = basis === 'ttc_delivered' && fields.vatExempt
  const priceHt = priceHtFromSource(basis, entered, vatExempt, vatRateBp)
  const candidate: PriceItemFields = {
    ...fields,
    unit: normalizeUnit(fields.unit).unit,
    sourceBasis: basis,
    sourcePrice: basis === 'ttc_delivered' ? entered : null,
    vatExempt,
    priceHt,
  }
  const { errors, warnings } = validatePriceItem(candidate)
  const moneyError = money && !money.ok ? money.error : null
  const blocked = errors.length > 0 || moneyError !== null

  const patch = (change: Partial<PriceItemFields>) => setFields((current) => ({ ...current, ...change }))

  const text = (key: keyof PriceItemFields, label: string, maxLength = 200) => (
    <label className="block">
      <span className={FIELD_LABEL}>{label}</span>
      <input
        className={FIELD_INPUT}
        value={String(fields[key] ?? '')}
        maxLength={maxLength}
        onChange={(event) => patch({ [key]: event.target.value } as Partial<PriceItemFields>)}
      />
    </label>
  )

  return (
    <Modal title={t(item ? 'pricing.dialog.editTitle' : 'pricing.dialog.addTitle')} onClose={onClose}>
      <form onSubmit={(event) => submit(event, candidate, blocked)} className="grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={FIELD_LABEL}>{t('pricing.field.kind')}</span>
            <select
              className={FIELD_INPUT}
              value={fields.kind}
              onChange={(event) => patch({ kind: event.target.value as PriceKind })}
            >
              {PRICE_KINDS.map((k) => (
                <option key={k} value={k}>
                  {t(`pricing.tab.${k}`)}
                </option>
              ))}
            </select>
          </label>
          {text('code', t('pricing.col.code'), 40)}
        </div>
        {text('designation', t('pricing.col.designation'), 500)}
        <div className="grid grid-cols-2 gap-3">
          {text('category', t('pricing.col.category'), 120)}
          {text('unit', t('pricing.col.unit'), 30)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={FIELD_LABEL}>{t('pricing.field.price')}</span>
            <input
              className={FIELD_INPUT}
              inputMode="decimal"
              value={priceText}
              placeholder="45 000,0"
              onChange={(event) => setPriceText(event.target.value)}
            />
          </label>
          <label className="block">
            <span className={FIELD_LABEL}>{t('pricing.field.basis')}</span>
            <select className={FIELD_INPUT} value={basis} onChange={(event) => setBasis(event.target.value as SourceBasis)}>
              <option value="ht">{t('pricing.basis.ht')}</option>
              <option value="ttc_delivered">{t('pricing.basis.ttc_delivered')}</option>
            </select>
          </label>
        </div>
        {basis === 'ttc_delivered' && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={fields.vatExempt}
              onChange={(event) => patch({ vatExempt: event.target.checked })}
            />
            {t('pricing.field.vatExempt')}
          </label>
        )}
        {basis === 'ttc_delivered' && priceHt !== null && (
          <p className="text-xs text-muted-foreground">
            {vatExempt
              ? t('pricing.computedHtExempt', { price: formatAriary(priceHt) })
              : t('pricing.computedHt', { price: formatAriary(priceHt), rate: formatRate(vatRateBp) })}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          {text('supplier', t('pricing.col.supplier'), 200)}
          {text('region', t('pricing.field.region'), 120)}
        </div>
        <label className="block">
          <span className={FIELD_LABEL}>{t('pricing.field.date')}</span>
          <input
            type="date"
            className={FIELD_INPUT}
            value={fields.effectiveDate ?? ''}
            onChange={(event) => patch({ effectiveDate: event.target.value || null })}
          />
        </label>

        <FormFooter
          moneyError={moneyError}
          errors={errors}
          warnings={warnings}
          saveError={saveError}
          disabled={blocked || saving}
          onCancel={onClose}
        />
      </form>
    </Modal>
  )
}
