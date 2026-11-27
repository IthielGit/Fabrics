import { useState } from 'react'
import type { WorkItem, WorkItemFields } from '../../features/pricing/model'
import { formatAriary, parseMoneyInput } from '../../features/pricing/money'
import { normalizeUnit } from '../../features/pricing/units'
import { validateWorkItem } from '../../features/pricing/validate'
import { useT } from '../../i18n/useT'
import Modal from '../ui/Modal'
import { FormFooter } from './ListParts'
import { FIELD_INPUT, FIELD_LABEL } from './styles'
import { useSaveForm } from './useSaveForm'

interface WorkItemDialogProps {
  item: WorkItem | null
  onSave: (fields: WorkItemFields) => Promise<void>
  onClose: () => void
}

const EMPTY: WorkItemFields = {
  code: '',
  category: '',
  designation: '',
  unit: '',
  priceHt: null,
  referencePrice: null,
  sourceCoefficient: '',
  output: '',
  components: [],
  sourceRow: '',
  sourceKey: '',
}

/**
 * Ajout ou modification d'un poste (admins) : code, désignation, unité et prix brut (débours sec HT,
 * D23-12). La composition importée est gardée telle quelle.
 */
export default function WorkItemDialog({ item, onSave, onClose }: WorkItemDialogProps) {
  const t = useT()
  const [fields, setFields] = useState<WorkItemFields>(() => item ?? EMPTY)
  const [priceText, setPriceText] = useState(() =>
    item === null || item.priceHt === null ? '' : formatAriary(item.priceHt, { unit: false }),
  )
  const { saving, saveError, submit } = useSaveForm(onSave, onClose)

  const money = priceText.trim() === '' ? null : parseMoneyInput(priceText)
  const candidate: WorkItemFields = {
    ...fields,
    unit: normalizeUnit(fields.unit).unit,
    priceHt: money?.ok ? money.value : null,
  }
  const { errors, warnings } = validateWorkItem(candidate)
  const moneyError = money && !money.ok ? money.error : null
  const blocked = errors.length > 0 || moneyError !== null

  const text = (key: 'code' | 'category' | 'designation' | 'unit', label: string, maxLength: number) => (
    <label className="block">
      <span className={FIELD_LABEL}>{label}</span>
      <input
        className={FIELD_INPUT}
        value={fields[key]}
        maxLength={maxLength}
        onChange={(event) => setFields((current) => ({ ...current, [key]: event.target.value }))}
      />
    </label>
  )

  return (
    <Modal title={t(item ? 'pricing.work.editTitle' : 'pricing.work.addTitle')} onClose={onClose}>
      <form onSubmit={(event) => submit(event, candidate, blocked)} className="grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          {text('code', t('pricing.col.code'), 40)}
          {text('unit', t('pricing.col.unit'), 30)}
        </div>
        {text('designation', t('pricing.col.designation'), 500)}
        {text('category', t('pricing.col.category'), 200)}
        <label className="block">
          <span className={FIELD_LABEL}>{t('pricing.work.price')}</span>
          <input
            className={FIELD_INPUT}
            inputMode="decimal"
            value={priceText}
            placeholder="45 000,0"
            onChange={(event) => setPriceText(event.target.value)}
          />
        </label>
        {item && item.components.length > 0 && (
          <p className="text-xs text-muted-foreground">{t('pricing.work.componentsNote')}</p>
        )}
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
