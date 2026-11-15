import clsx from 'clsx'
import { useState } from 'react'
import { initialsOf } from '../../features/collab/presence'

interface UserAvatarProps {
  name: string
  /** Couleur de la personne (`#rrggbb`), fond des initiales. */
  color: string
  /** Photo en https ; si elle ne charge pas, les initiales s'affichent. */
  avatarUrl?: string
  /** Texte lu par les lecteurs d'écran (sinon le nom). */
  label?: string
  size?: 'sm' | 'md'
}

/** Pastille d'une personne : sa photo, ou ses initiales sur sa couleur (présence, historique). */
export default function UserAvatar({ name, color, avatarUrl, label, size = 'md' }: UserAvatarProps) {
  const [failed, setFailed] = useState(false)
  return (
    <span
      title={name}
      aria-label={label ?? name}
      role="img"
      className={clsx(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white ring-2 ring-white',
        size === 'md' ? 'size-7 text-[11px]' : 'size-5 text-[9px]',
      )}
      style={{ backgroundColor: color }}
    >
      {avatarUrl && !failed ? (
        <img
          src={avatarUrl}
          alt=""
          referrerPolicy="no-referrer"
          draggable={false}
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        initialsOf(name)
      )}
    </span>
  )
}
