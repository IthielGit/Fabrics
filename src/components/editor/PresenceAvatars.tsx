import { useMemo, useState } from 'react'
import { initialsOf, uniqueUsers, type PresenceUser } from '../../features/collab/presence'
import { fr } from '../../i18n/fr'
import { useAuthStore } from '../../stores/authStore'
import { useCollabStore } from '../../stores/collabStore'

/** Au-delà, les autres personnes sont regroupées dans une pastille « +N ». */
const MAX_VISIBLE = 4

function Avatar({ user }: { user: PresenceUser }) {
  // Photo du compte si elle charge ; sinon les initiales sur la couleur de la personne.
  const [failed, setFailed] = useState(false)
  return (
    <span
      title={user.name}
      aria-label={fr.presence.avatarLabel(user.name)}
      role="img"
      className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full text-[11px] font-semibold text-white ring-2 ring-white"
      style={{ backgroundColor: user.color }}
    >
      {user.avatarUrl && !failed ? (
        <img
          src={user.avatarUrl}
          alt=""
          referrerPolicy="no-referrer"
          draggable={false}
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        initialsOf(user.name)
      )}
    </span>
  )
}

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
        <Avatar key={user.id} user={user} />
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
