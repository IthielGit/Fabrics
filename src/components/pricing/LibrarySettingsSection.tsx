import { useState } from 'react'
import { formatRate, parseRateInput } from '../../features/pricing/money'
import { useT } from '../../i18n/useT'
import { usePricingStore } from '../../stores/pricingStore'
import { FIELD_INPUT, FIELD_LABEL, SECTION } from './styles'

/** Réglages de l'espace et de sa bibliothèque (nom, TVA, date des prix). Lecture seule pour un membre. */
export default function LibrarySettingsSection({ canEdit }: { canEdit: boolean }) {
  const t = useT()
  const workspace = usePricingStore((state) => state.workspace)
  const library = usePricingStore((state) => state.library)
  const renameWorkspace = usePricingStore((state) => state.renameWorkspace)
  const updateLibrary = usePricingStore((state) => state.updateLibrary)
  const setVatRate = usePricingStore((state) => state.setVatRate)
  const [rateText, setRateText] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  if (!workspace || !library) return null

  const save = (action: Promise<void>) => {
    setFailed(false)
    action.catch((error: unknown) => {
      console.error('Réglages de la bibliothèque :', error)
      setFailed(true)
    })
  }

  const rateShown = rateText ?? formatRate(library.vatRateBp).replace(/ %$/, '')
  const parsedRate = rateText === null ? library.vatRateBp : parseRateInput(rateText)

  const commitRate = () => {
    if (rateText === null) return
    if (parsedRate !== null && parsedRate !== library.vatRateBp) save(setVatRate(parsedRate))
    if (parsedRate !== null) setRateText(null)
  }

  return (
    <section className={`${SECTION} grid max-w-xl gap-4`}>
      <label className="block">
        <span className={FIELD_LABEL}>{t('pricing.settings.workspaceName')}</span>
        <input
          className={FIELD_INPUT}
          defaultValue={workspace.name}
          maxLength={120}
          disabled={!canEdit}
          onBlur={(event) => {
            const name = event.target.value.trim()
            if (name && name !== workspace.name) save(renameWorkspace(name))
          }}
        />
      </label>
      <label className="block">
        <span className={FIELD_LABEL}>{t('pricing.settings.libraryName')}</span>
        <input
          className={FIELD_INPUT}
          defaultValue={library.name}
          maxLength={120}
          disabled={!canEdit}
          onBlur={(event) => {
            const name = event.target.value.trim()
            if (name && name !== library.name) save(updateLibrary({ name }))
          }}
        />
      </label>
      <label className="block">
        <span className={FIELD_LABEL}>{t('pricing.settings.vat')} (%)</span>
        <input
          className={`${FIELD_INPUT} max-w-32`}
          inputMode="decimal"
          value={rateShown}
          disabled={!canEdit}
          onChange={(event) => setRateText(event.target.value)}
          onBlur={commitRate}
          onKeyDown={(event) => event.key === 'Enter' && commitRate()}
        />
        <span className="mt-1 block text-xs text-muted-foreground">{t('pricing.settings.vatHelp')}</span>
        {parsedRate === null && <span className="mt-1 block text-xs text-red-600">{t('pricing.settings.invalidRate')}</span>}
      </label>
      <label className="block">
        <span className={FIELD_LABEL}>{t('pricing.settings.priceDate')}</span>
        <input
          type="date"
          className={`${FIELD_INPUT} max-w-48`}
          defaultValue={library.priceDate ?? ''}
          disabled={!canEdit}
          onBlur={(event) => {
            const value = event.target.value || null
            if (value !== library.priceDate) save(updateLibrary({ priceDate: value }))
          }}
        />
      </label>
      {failed && <p className="text-sm text-red-600">{t('pricing.saveError')}</p>}
    </section>
  )
}
