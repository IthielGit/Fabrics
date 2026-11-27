import { useState } from 'react'
import { formatK1, k1Millionths, type EstimateSettings } from '../../features/pricing/estimate'
import { formatRate, parseRateInput } from '../../features/pricing/money'
import { useT } from '../../i18n/useT'
import { FIELD_INPUT, FIELD_LABEL } from './styles'

type Part = 'a1Bp' | 'a2Bp' | 'a3Bp'
const PARTS: readonly [Part, 'dqe.a1' | 'dqe.a2' | 'dqe.a3'][] = [
  ['a1Bp', 'dqe.a1'],
  ['a2Bp', 'dqe.a2'],
  ['a3Bp', 'dqe.a3'],
]

interface DqeSettingsSectionProps {
  settings: EstimateSettings
  /** Vrai tant que les valeurs du classeur n'ont pas été réglées pour ce projet. */
  isExample: boolean
  canEdit: boolean
  onSave: (patch: Partial<Record<Part, number>>) => Promise<void>
}

/** Parts de K1 réglées dans ce devis (D23-13), K1 et TVA affichés. */
export default function DqeSettingsSection({ settings, isExample, canEdit, onSave }: DqeSettingsSectionProps) {
  const t = useT()
  const [drafts, setDrafts] = useState<Partial<Record<Part, string>>>({})
  const [invalid, setInvalid] = useState(false)

  const commit = (part: Part) => {
    const text = drafts[part]
    if (text === undefined) return
    const value = parseRateInput(text)
    if (value === null) {
      setInvalid(true)
      return
    }
    setInvalid(false)
    setDrafts((d) => ({ ...d, [part]: undefined }))
    if (value !== settings[part]) void onSave({ [part]: value }).catch((error: unknown) => console.error('Réglages du devis :', error))
  }

  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase text-muted-foreground">{t('dqe.settings')}</h3>
      <div className="grid grid-cols-3 gap-2">
        {PARTS.map(([part, label]) => (
          <label key={part} className="block">
            <span className={FIELD_LABEL}>{t(label)}</span>
            <input
              className={FIELD_INPUT}
              inputMode="decimal"
              disabled={!canEdit}
              value={drafts[part] ?? formatRate(settings[part]).replace(/ %$/, '')}
              onChange={(event) => setDrafts((d) => ({ ...d, [part]: event.target.value }))}
              onBlur={() => commit(part)}
              onKeyDown={(event) => event.key === 'Enter' && commit(part)}
            />
          </label>
        ))}
      </div>
      <p className="text-xs">{t('dqe.k1', { k1: formatK1(k1Millionths(settings)), vat: formatRate(settings.vatRateBp) })}</p>
      {isExample && <p className="text-xs text-amber-600">{t('dqe.exampleValues')}</p>}
      {invalid && <p className="text-xs text-red-600">{t('dqe.invalidRate')}</p>}
    </section>
  )
}
