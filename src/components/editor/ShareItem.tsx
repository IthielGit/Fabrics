import clsx from 'clsx'
import { useState } from 'react'
import {
  expiryToDateInput,
  shareStatus,
  shareUrl,
  type Share,
  type ShareStatus,
} from '../../features/sharing/shareLogic'
import { fr } from '../../i18n/fr'
import Button from '../ui/Button'

interface ShareItemProps {
  share: Share
  /** Heure de référence pour savoir si le lien est expiré. */
  now: Date
  onToggle: () => void
  onRemove: () => void
  onSetPassword: (password: string) => Promise<void>
  onSetExpiry: (date: string) => Promise<void>
}

const INPUT =
  'rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none'

const STATUS_STYLE: Record<ShareStatus, string> = {
  active: 'bg-emerald-50 text-emerald-800',
  disabled: 'bg-slate-100 text-slate-700',
  expired: 'bg-amber-50 text-amber-800',
}

/** Un lien de partage : adresse à copier, état, mot de passe, date limite. */
export default function ShareItem({ share, now, onToggle, onRemove, onSetPassword, onSetExpiry }: ShareItemProps) {
  const t = fr.share
  const status = shareStatus(share, now)
  const url = shareUrl(window.location.origin, share.token)
  const [copied, setCopied] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [expiry, setExpiry] = useState(expiryToDateInput(share.expiresAt))

  const statusLabel = { active: t.statusActive, disabled: t.statusDisabled, expired: t.statusExpired }[status]

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Presse-papiers refusé : l'adresse reste sélectionnable dans le champ.
    }
  }

  return (
    <li className="rounded-lg border border-slate-200 p-3">
      <div className="flex items-center gap-2">
        <input
          readOnly
          aria-label={t.linkLabel}
          value={url}
          onFocus={(event) => event.target.select()}
          className={`${INPUT} min-w-0 flex-1 bg-slate-50 text-xs`}
        />
        <Button onClick={() => void copy()} className="px-3 py-1.5">
          {copied ? t.copied : t.copy}
        </Button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_STYLE[status])}>
          {statusLabel}
        </span>
        <span className="text-xs text-slate-500">{share.hasPassword ? t.protectedBy : t.notProtected}</span>
        <span className="ml-auto flex gap-2">
          <Button onClick={onToggle} className="px-3 py-1">
            {share.active ? t.disable : t.enable}
          </Button>
          <Button variant="danger" onClick={onRemove} className="px-3 py-1">
            {t.remove}
          </Button>
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs text-slate-600">
          {t.newPasswordLabel}
          <input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className={`${INPUT} w-40`}
          />
        </label>
        <Button
          disabled={newPassword === ''}
          onClick={() => {
            void onSetPassword(newPassword).then(() => setNewPassword(''))
          }}
          className="px-3 py-1.5"
        >
          {t.setPassword}
        </Button>
        {share.hasPassword && (
          <Button onClick={() => void onSetPassword('')} className="px-3 py-1.5">
            {t.removePassword}
          </Button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs text-slate-600">
          {t.expiryField}
          <input
            type="date"
            value={expiry}
            onChange={(event) => setExpiry(event.target.value)}
            className={INPUT}
          />
        </label>
        <Button
          disabled={expiry === expiryToDateInput(share.expiresAt)}
          onClick={() => void onSetExpiry(expiry)}
          className="px-3 py-1.5"
        >
          {t.saveExpiry}
        </Button>
        {!share.expiresAt && <span className="pb-2 text-xs text-slate-500">{t.noExpiry}</span>}
      </div>
    </li>
  )
}
