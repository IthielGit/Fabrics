import { useState, type FormEvent } from 'react'
import { useT } from '../../i18n/useT'
import { usePricingStore } from '../../stores/pricingStore'
import Button from '../ui/Button'
import { FIELD_INPUT, FIELD_LABEL, SECTION } from './styles'

/** Création d'un espace : la personne en devient admin, avec une bibliothèque vide. */
export default function CreateWorkspaceForm({ onDone }: { onDone?: () => void }) {
  const t = useT()
  const createWorkspace = usePricingStore((state) => state.createWorkspace)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    setFailed(false)
    try {
      await createWorkspace(name)
      onDone?.()
    } catch (error) {
      console.error('Création de l’espace :', error)
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className={`${SECTION} grid max-w-xl gap-3`}>
      <h2 className="text-base font-semibold">{t('pricing.create.title')}</h2>
      <p className="text-sm text-muted-foreground">{t('pricing.create.text')}</p>
      <label className="block">
        <span className={FIELD_LABEL}>{t('pricing.create.nameLabel')}</span>
        <input
          className={FIELD_INPUT}
          value={name}
          maxLength={120}
          placeholder={t('pricing.create.placeholder')}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      {failed && (
        <p className="text-sm text-red-600" role="alert">
          {t('pricing.create.error')} {t('pricing.sqlHint')}
        </p>
      )}
      <div>
        <Button type="submit" variant="primary" disabled={busy || !name.trim()}>
          {t('pricing.create.submit')}
        </Button>
      </div>
    </form>
  )
}
