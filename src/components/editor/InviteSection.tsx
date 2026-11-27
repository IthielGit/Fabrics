import clsx from 'clsx'
import { useCallback, useEffect, useState } from 'react'
import {
  createInvite,
  deleteInvite,
  listInvites,
  listMembers,
  removeMember,
  setInviteActive,
  setInviteExpiry,
  setMemberRole,
} from '../../features/sharing/membersApi'
import {
  inviteUrl,
  isInviteRole,
  type Invite,
  type InviteRole,
  type Member,
} from '../../features/sharing/membersLogic'
import { dateInputToExpiry, shareStatus } from '../../features/sharing/shareLogic'
import { fr } from '../../i18n/fr'
import Button from '../ui/Button'
import CopyLinkField from './CopyLinkField'
import LinkExpiryField from './LinkExpiryField'
import { SHARE_INPUT, SHARE_STATUS_STYLE } from './shareStyles'
import { useRunThenReload } from './useRunThenReload'

function roleLabel(role: InviteRole): string {
  return role === 'editor' ? fr.collab.roleEditor : fr.collab.roleViewer
}

interface InviteSectionProps {
  projectId: string
}

/** Invitation d'autres comptes par lien (lecteur ou éditeur) et gestion des membres. Réservé au propriétaire. */
export default function InviteSection({ projectId }: InviteSectionProps) {
  const t = fr.collab
  const [invites, setInvites] = useState<Invite[] | null>(null)
  const [members, setMembers] = useState<Member[] | null>(null)
  const [invitesFailed, setInvitesFailed] = useState(false)
  const [membersFailed, setMembersFailed] = useState(false)
  const [role, setRole] = useState<InviteRole>('viewer')
  const [expiry, setExpiry] = useState('')
  const [creating, setCreating] = useState(false)
  const [now, setNow] = useState(() => new Date())

  const reload = useCallback(async () => {
    const [invitesResult, membersResult] = await Promise.allSettled([listInvites(projectId), listMembers(projectId)])
    if (invitesResult.status === 'fulfilled') setInvites(invitesResult.value)
    setInvitesFailed(invitesResult.status === 'rejected')
    if (membersResult.status === 'fulfilled') setMembers(membersResult.value)
    setMembersFailed(membersResult.status === 'rejected')
    setNow(new Date())
  }, [projectId])
  const { run, actionFailed } = useRunThenReload(reload)

  useEffect(() => {
    // Lecture initiale : même chose que `reload`, mais sans mise à jour après un démontage.
    let cancelled = false
    void Promise.allSettled([listInvites(projectId), listMembers(projectId)]).then(([invitesResult, membersResult]) => {
      if (cancelled) return
      if (invitesResult.status === 'fulfilled') setInvites(invitesResult.value)
      setInvitesFailed(invitesResult.status === 'rejected')
      if (membersResult.status === 'fulfilled') setMembers(membersResult.value)
      setMembersFailed(membersResult.status === 'rejected')
      setNow(new Date())
    })
    return () => {
      cancelled = true
    }
  }, [projectId])


  const handleCreate = async () => {
    setCreating(true)
    await run(async () => {
      await createInvite(projectId, { role, expiresAt: dateInputToExpiry(expiry) })
      setExpiry('')
    })
    setCreating(false)
  }

  return (
    <section className="mt-6 border-t border-slate-200 pt-5">
      <h3 className="text-sm font-semibold text-slate-900">{t.sectionTitle}</h3>
      <p className="mt-1 text-sm leading-relaxed text-slate-600">{t.intro}</p>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-slate-600">
          {t.roleLabel}
          <select
            value={role}
            onChange={(event) => {
              if (isInviteRole(event.target.value)) setRole(event.target.value)
            }}
            className={SHARE_INPUT}
          >
            <option value="viewer">{t.roleViewer}</option>
            <option value="editor">{t.roleEditor}</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-600">
          {t.expiryLabel}
          <input type="date" value={expiry} onChange={(event) => setExpiry(event.target.value)} className={SHARE_INPUT} />
        </label>
        <Button variant="primary" disabled={creating} onClick={() => void handleCreate()}>
          {creating ? t.creating : t.create}
        </Button>
      </div>

      {actionFailed && (
        <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {t.actionError}
        </p>
      )}

      <h4 className="mt-5 text-sm font-semibold text-slate-900">{t.invitesTitle}</h4>
      {invitesFailed && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {t.inviteLoadError}
        </p>
      )}
      {!invitesFailed && invites === null && <p className="mt-2 text-sm text-slate-500">{t.loadingInvites}</p>}
      {invites?.length === 0 && <p className="mt-2 text-sm text-slate-500">{t.noInvites}</p>}
      <ul className="mt-2 flex max-h-60 flex-col gap-3 overflow-y-auto">
        {invites?.map((invite) => (
          <InviteItem
            key={invite.id}
            invite={invite}
            now={now}
            onToggle={() => void run(() => setInviteActive(invite.id, !invite.active))}
            onRemove={() => void run(() => deleteInvite(invite.id))}
            onSetExpiry={(value) => run(() => setInviteExpiry(invite.id, dateInputToExpiry(value)))}
          />
        ))}
      </ul>

      <h4 className="mt-5 text-sm font-semibold text-slate-900">{t.membersTitle}</h4>
      {membersFailed && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {t.memberLoadError}
        </p>
      )}
      {!membersFailed && members === null && <p className="mt-2 text-sm text-slate-500">{t.loadingMembers}</p>}
      {members?.length === 0 && <p className="mt-2 text-sm text-slate-500">{t.noMembers}</p>}
      <ul className="mt-2 flex max-h-48 flex-col gap-2 overflow-y-auto">
        {members?.map((member) => {
          const label = member.email || t.unknownAccount
          return (
            <li key={member.userId} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 p-2">
              <span className="min-w-0 flex-1 truncate text-sm text-slate-800">{label}</span>
              <select
                aria-label={t.changeRole(label)}
                value={member.role}
                onChange={(event) => {
                  const next = event.target.value
                  if (isInviteRole(next)) void run(() => setMemberRole(projectId, member.userId, next))
                }}
                className={SHARE_INPUT}
              >
                <option value="viewer">{t.roleViewer}</option>
                <option value="editor">{t.roleEditor}</option>
              </select>
              <Button
                variant="danger"
                className="px-3 py-1"
                onClick={() => void run(() => removeMember(projectId, member.userId))}
              >
                {t.removeMember}
              </Button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

interface InviteItemProps {
  invite: Invite
  now: Date
  onToggle: () => void
  onRemove: () => void
  onSetExpiry: (date: string) => Promise<void>
}

function InviteItem({ invite, now, onToggle, onRemove, onSetExpiry }: InviteItemProps) {
  const t = fr.share
  const status = shareStatus(invite, now)
  const url = inviteUrl(window.location.origin, invite.token)
  const statusLabel = { active: t.statusActive, disabled: t.statusDisabled, expired: t.statusExpired }[status]

  return (
    <li className="rounded-lg border border-slate-200 p-3">
      <CopyLinkField url={url} />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-800">
          {roleLabel(invite.role)}
        </span>
        <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', SHARE_STATUS_STYLE[status])}>
          {statusLabel}
        </span>
        <span className="ml-auto flex gap-2">
          <Button onClick={onToggle} className="px-3 py-1">
            {invite.active ? t.disable : t.enable}
          </Button>
          <Button variant="danger" onClick={onRemove} className="px-3 py-1">
            {t.remove}
          </Button>
        </span>
      </div>
      <LinkExpiryField expiresAt={invite.expiresAt} onSetExpiry={onSetExpiry} />
    </li>
  )
}
