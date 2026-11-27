import { useState } from 'react'
import { expiryToDateInput } from '../../features/sharing/shareLogic'
import { fr } from '../../i18n/fr'
import Button from '../ui/Button'
import { SHARE_INPUT } from './shareStyles'

interface LinkExpiryFieldProps {
  /** Date limite actuelle du lien (`null` : sans limite). */
  expiresAt: string | null
  onSetExpiry: (date: string) => Promise<void>
}

/** Date limite d'un lien (lien public ou invitation) : champ date et bouton « Enregistrer ». */
export default function LinkExpiryField({ expiresAt, onSetExpiry }: LinkExpiryFieldProps) {
  const t = fr.share
  const [expiry, setExpiry] = useState(expiryToDateInput(expiresAt))

  return (
    <div className="mt-3 flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-1 text-xs text-slate-600">
        {t.expiryField}
        <input type="date" value={expiry} onChange={(event) => setExpiry(event.target.value)} className={SHARE_INPUT} />
      </label>
      <Button
        disabled={expiry === expiryToDateInput(expiresAt)}
        onClick={() => void onSetExpiry(expiry)}
        className="px-3 py-1.5"
      >
        {t.saveExpiry}
      </Button>
      {!expiresAt && <span className="pb-2 text-xs text-slate-500">{t.noExpiry}</span>}
    </div>
  )
}
