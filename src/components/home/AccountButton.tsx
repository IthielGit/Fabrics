import { LogIn, LogOut } from 'lucide-react'
import { Link } from 'react-router'
import { fr } from '../../i18n/fr'
import { useAuthStore } from '../../stores/authStore'
import Button from '../ui/Button'

/** Compte en haut de l'accueil. Invisible en mode local (Supabase non configuré). */
export default function AccountButton() {
  const status = useAuthStore((state) => state.status)
  const user = useAuthStore((state) => state.user)
  const signOut = useAuthStore((state) => state.signOut)

  if (status === 'disabled' || status === 'loading') return null

  if (status === 'signedIn') {
    return (
      <div className="ml-auto flex items-center gap-3">
        <span className="hidden max-w-56 truncate text-sm text-slate-600 sm:inline" title={user?.email}>
          {fr.auth.signedInAs(user?.email ?? '')}
        </span>
        <Button onClick={() => void signOut()}>
          <LogOut size={16} aria-hidden="true" />
          {fr.auth.signOut}
        </Button>
      </div>
    )
  }

  return (
    <Link
      to="/connexion"
      className="ml-auto inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
    >
      <LogIn size={16} aria-hidden="true" />
      {fr.auth.signIn}
    </Link>
  )
}
