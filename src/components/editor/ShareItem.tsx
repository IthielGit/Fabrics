import clsx from 'clsx'
import { useState } from 'react'
import { shareStatus, shareUrl, type Share } from '../../features/sharing/shareLogic'
import { fr } from '../../i18n/fr'
import Button from '../ui/Button'
import CopyLinkField from './CopyLinkField'
import LinkExpiryField from './LinkExpiryField'
import { SHARE_INPUT, SHARE_STATUS_STYLE } from './shareStyles'

interface ShareItemProps {
  share: Share
  /** Heure de référence pour savoir si le lien est expiré. */
  now: Date
  onToggle: () => void
  onRemove: () => void
  onSetPassword: (password: string) => Promise<void>
  onSetExpiry: (date: string) => Promise<void>
}

/** Un lien de partage : adresse à copier, état, mot de passe, date limite. */
export default function ShareItem({ share, now, onToggle, onRemove, onSetPassword, onSetExpiry }: ShareItemProps) {
  const t = fr.share
  const status = shareStatus(share, now)
  const url = shareUrl(window.location.origin, share.token)
  const [newPassword, setNewPassword] = useState('')

  const statusLabel = { active: t.statusActive, disabled: t.statusDisabled, expired: t.statusExpired }[status]

  return (
    <li className="rounded-lg border border-slate-200 p-3">
      <CopyLinkField url={url} />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', SHARE_STATUS_STYLE[status])}>
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
            className={`${SHARE_INPUT} w-40`}
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

      <LinkExpiryField expiresAt={share.expiresAt} onSetExpiry={onSetExpiry} />
    </li>
  )
}
