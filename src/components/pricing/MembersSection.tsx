import { Copy, Link2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import type { WorkspaceInvite, WorkspaceMember, WorkspaceRole } from '../../features/pricing/model'
import { LastAdminError } from '../../features/pricing/repository'
import { workspaceInviteUrl } from '../../features/pricing/invites'
import { useT } from '../../i18n/useT'
import { useAuthStore } from '../../stores/authStore'
import { usePricingStore } from '../../stores/pricingStore'
import Button from '../ui/Button'
import ConfirmDialog from './ConfirmDialog'
import { LINK_BUTTON, SECTION, TABLE_CELL } from './styles'

/** Membres de l'espace (D23-7) : tout membre voit la liste ; un admin invite, change un rôle, retire. */
export default function MembersSection() {
  const t = useT()
  const repository = usePricingStore((state) => state.repository)
  const workspace = usePricingStore((state) => state.workspace)
  const reload = usePricingStore((state) => state.load)
  const userId = useAuthStore((state) => state.user?.id ?? null)
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [invites, setInvites] = useState<WorkspaceInvite[]>([])
  const [message, setMessage] = useState<'error' | 'lastAdmin' | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<WorkspaceMember | null>(null)

  const isAdmin = workspace?.role === 'admin'

  const fetchLists = useCallback(async () => {
    if (!repository || !workspace || !repository.shared) return null
    const [memberList, inviteList] = await Promise.all([
      repository.listMembers(workspace.id),
      isAdmin ? repository.listInvites(workspace.id) : Promise.resolve([]),
    ])
    return { memberList, inviteList }
  }, [repository, workspace, isAdmin])

  const apply = (lists: Awaited<ReturnType<typeof fetchLists>>) => {
    if (!lists) return
    setMembers(lists.memberList)
    setInvites(lists.inviteList)
  }

  const refresh = async () => apply(await fetchLists())

  useEffect(() => {
    let cancelled = false
    fetchLists().then(
      (lists) => {
        if (cancelled || !lists) return
        setMembers(lists.memberList)
        setInvites(lists.inviteList)
      },
      (error: unknown) => {
        console.error('Membres de l’espace :', error)
        if (!cancelled) setMessage('error')
      },
    )
    return () => {
      cancelled = true
    }
  }, [fetchLists])

  if (!repository || !workspace) return null
  if (!repository.shared) {
    return <p className={`${SECTION} text-sm text-muted-foreground`}>{t('pricing.members.localOnly')}</p>
  }

  const run = async (action: () => Promise<void>) => {
    setMessage(null)
    try {
      await action()
      await refresh()
    } catch (error) {
      setMessage(error instanceof LastAdminError ? 'lastAdmin' : 'error')
      if (!(error instanceof LastAdminError)) console.error('Membres de l’espace :', error)
    }
  }

  const createInvite = (role: WorkspaceRole) => run(async () => void (await repository.createInvite(workspace.id, role)))

  const copy = async (invite: WorkspaceInvite) => {
    try {
      await navigator.clipboard.writeText(workspaceInviteUrl(invite.token))
      setCopied(invite.id)
    } catch {
      setMessage('error')
    }
  }

  return (
    <div className="grid gap-4">
      <section className={SECTION}>
        <h2 className="mb-3 text-sm font-semibold">{t('pricing.members.title')}</h2>
        <table className="w-full border-collapse">
          <tbody>
            {members.map((member) => {
              const self = member.userId === userId
              return (
                <tr key={member.userId}>
                  <td className={`${TABLE_CELL} break-all`}>
                    {member.email} {self && <span className="text-muted-foreground">{t('pricing.members.you')}</span>}
                  </td>
                  <td className={TABLE_CELL}>{t(`pricing.role.${member.role}`)}</td>
                  <td className={`${TABLE_CELL} whitespace-nowrap text-right`}>
                    {isAdmin && !self && (
                      <button
                        type="button"
                        className={LINK_BUTTON}
                        onClick={() =>
                          void run(() =>
                            repository.setMemberRole(workspace.id, member.userId, member.role === 'admin' ? 'member' : 'admin'),
                          )
                        }
                      >
                        {t(member.role === 'admin' ? 'pricing.members.makeMember' : 'pricing.members.makeAdmin')}
                      </button>
                    )}
                    {(isAdmin || self) && (
                      <button type="button" className={LINK_BUTTON} onClick={() => setConfirm(member)}>
                        {t(self ? 'pricing.members.leave' : 'pricing.members.remove')}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {message && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {t(message === 'lastAdmin' ? 'pricing.members.lastAdmin' : 'pricing.members.error')}
          </p>
        )}
      </section>

      {isAdmin && (
        <section className={SECTION}>
          <h2 className="mb-1 text-sm font-semibold">{t('pricing.invites.title')}</h2>
          <p className="mb-3 text-xs text-muted-foreground">{t('pricing.invites.text')}</p>
          <div className="mb-3 flex flex-wrap gap-2">
            <Button onClick={() => void createInvite('member')}>
              <Link2 size={14} aria-hidden="true" />
              {t('pricing.invites.createMember')}
            </Button>
            <Button onClick={() => void createInvite('admin')}>
              <Link2 size={14} aria-hidden="true" />
              {t('pricing.invites.createAdmin')}
            </Button>
          </div>
          {invites.length === 0 && <p className="text-xs text-muted-foreground">{t('pricing.invites.empty')}</p>}
          <ul className="space-y-2">
            {invites.map((invite) => (
              <li key={invite.id} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded bg-secondary px-1.5 py-0.5 text-xs">{t(`pricing.role.${invite.role}`)}</span>
                <code className={`min-w-0 flex-1 truncate text-xs ${invite.active ? '' : 'line-through opacity-60'}`}>
                  {workspaceInviteUrl(invite.token)}
                </code>
                {invite.active ? (
                  <>
                    <button type="button" className={LINK_BUTTON} onClick={() => void copy(invite)}>
                      <Copy size={12} aria-hidden="true" className="mr-1 inline" />
                      {t(copied === invite.id ? 'pricing.invites.copied' : 'pricing.invites.copy')}
                    </button>
                    <button
                      type="button"
                      className={LINK_BUTTON}
                      onClick={() => void run(() => repository.setInviteActive(invite.id, false))}
                    >
                      {t('pricing.invites.disable')}
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">{t('pricing.invites.inactive')}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {confirm && (
        <ConfirmDialog
          title={t(confirm.userId === userId ? 'pricing.members.leaveTitle' : 'pricing.members.removeTitle')}
          message={
            confirm.userId === userId
              ? t('pricing.members.leaveMessage')
              : t('pricing.members.removeMessage', { email: confirm.email })
          }
          confirmLabel={t(confirm.userId === userId ? 'pricing.members.leave' : 'pricing.members.remove')}
          onConfirm={() => {
            const member = confirm
            setConfirm(null)
            void run(async () => {
              await repository.removeMember(workspace.id, member.userId)
              // Quitter l'espace : on recharge la liste des espaces.
              if (member.userId === userId) await reload(userId)
            })
          }}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  )
}
