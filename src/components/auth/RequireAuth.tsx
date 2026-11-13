import { Navigate, Outlet, useLocation } from 'react-router'
import { fr } from '../../i18n/fr'
import { useAuthStore } from '../../stores/authStore'

/**
 * Route « enveloppe » : n'affiche les pages enfants qu'à un utilisateur connecté
 * (ou en mode local sans Supabase). Sinon, renvoie vers la page d'accueil publique
 * en mémorisant la page demandée (`state.from`) pour y revenir après connexion.
 */
export default function RequireAuth() {
  const status = useAuthStore((state) => state.status)
  const location = useLocation()

  if (status === 'signedIn' || status === 'disabled') return <Outlet />

  if (status === 'loading') {
    return (
      <div role="status" className="min-h-screen bg-slate-50">
        <span className="sr-only">{fr.common.loading}</span>
      </div>
    )
  }

  return (
    <Navigate
      to="/bienvenue"
      replace
      state={{ from: location.pathname + location.search + location.hash }}
    />
  )
}
