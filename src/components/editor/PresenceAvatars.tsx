import { useMemo } from 'react'
import { uniqueUsers } from '../../features/collab/presence'
import { fr } from '../../i18n/fr'
import { useAuthStore } from '../../stores/authStore'
import { useCollabStore } from '../../stores/collabStore'
import UserAvatar from '../ui/UserAvatar'

/** Au-delà, les autres personnes sont regroupées dans une pastille « +N ». */
const MAX_VISIBLE = 4

/** Avatars des autres personnes qui ont le plan ouvert (M14, lot E) ; rien si personne d'autre. */
export default function PresenceAvatars() {
  const peers = useCollabStore((state) => state.peers)
  const selfId = useAuthStore((state) => state.user?.id ?? null)
  const users = useMemo(() => uniqueUsers(peers, selfId), [peers, selfId])
  if (users.length === 0) return null

  const visible = users.slice(0, MAX_VISIBLE)
  const hidden = users.length - visible.length
  return (
    <div role="group" aria-label={fr.presence.others} className="flex items-center -space-x-2">
      {visible.map((user) => (
        <UserAvatar
          key={user.id}
          name={user.name}
          color={user.color}
          avatarUrl={user.avatarUrl}
          label={fr.presence.avatarLabel(user.name)}
        />
      ))}
      {hidden > 0 && (
        <span
          title={fr.presence.more(hidden)}
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[11px] font-semibold text-slate-700 ring-2 ring-white"
        >
          +{hidden}
        </span>
      )}
    </div>
  )
}
