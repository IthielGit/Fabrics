import { PencilRuler } from 'lucide-react'
import clsx from 'clsx'
import { Link } from 'react-router'
import { fr } from '../../i18n/fr'

interface AuthLogoProps {
  /** Variante claire, pour un fond sombre (panneau de marque). */
  inverse?: boolean
}

/** Logo cliquable vers l'accueil, identique sur mobile et sur le panneau de marque. */
export default function AuthLogo({ inverse = false }: AuthLogoProps) {
  return (
    <Link
      to="/"
      aria-label={fr.auth.backToHome}
      className={clsx(
        'inline-flex items-center gap-3 rounded-lg outline-offset-4 focus-visible:outline-2',
        inverse ? 'focus-visible:outline-indigo-300' : 'focus-visible:outline-indigo-600',
      )}
    >
      <span
        className={clsx(
          'flex size-9 items-center justify-center rounded-xl',
          inverse ? 'bg-indigo-400/15 text-indigo-200 ring-1 ring-inset ring-indigo-300/25' : 'bg-indigo-950 text-indigo-200',
        )}
      >
        <PencilRuler size={18} aria-hidden="true" />
      </span>
      <span className={clsx('text-xl font-bold tracking-tight', inverse ? 'text-white' : 'text-indigo-950')}>
        {fr.app.name}
      </span>
    </Link>
  )
}
