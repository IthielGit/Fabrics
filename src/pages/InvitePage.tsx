import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import Button from '../components/ui/Button'
import { acceptInvite } from '../features/sharing/membersApi'
import { fr } from '../i18n/fr'
import { cloudEnabled } from '../lib/supabase'

type View =
  | { type: 'loading' }
  | { type: 'joined'; projectId: string }
  | { type: 'unavailable' }
  | { type: 'error' }

function Frame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-semibold text-slate-950">{title}</h1>
      <div className="mt-4">{children}</div>
    </main>
  )
}

/**
 * Page d'un lien d'invitation (`/i/<jeton>`). Elle est derrière la garde de connexion : sans
 * compte, la personne se connecte (ou en crée un) puis revient ici. Le projet est rejoint,
 * puis ouvert (lecteur : en lecture seule ; éditeur : dans l'éditeur).
 */
export default function InvitePage() {
  const { token } = useParams()
  const [view, setView] = useState<View>({ type: 'loading' })
  // Incrémenté par « Réessayer » : relance la demande.
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!token || !cloudEnabled) return
    let cancelled = false
    acceptInvite(token)
      .then((result) => {
        if (cancelled) return
        setView(
          result.status === 'unavailable'
            ? { type: 'unavailable' }
            : { type: 'joined', projectId: result.projectId },
        )
      })
      .catch(() => {
        if (!cancelled) setView({ type: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [token, attempt])

  const t = fr.invitePage

  if (!cloudEnabled || !token) {
    return (
      <Frame title={t.unavailableTitle}>
        <p className="text-sm text-slate-600">{t.notAvailableHere}</p>
      </Frame>
    )
  }
  if (view.type === 'joined') return <Navigate to={`/p/${view.projectId}`} replace />
  if (view.type === 'loading') return <p className="p-8 text-slate-500">{t.loading}</p>
  if (view.type === 'error') {
    return (
      <Frame title={t.unavailableTitle}>
        <p role="alert" className="text-sm text-slate-600">
          {t.errorText}
        </p>
        <Button
          className="mt-4"
          onClick={() => {
            setView({ type: 'loading' })
            setAttempt((n) => n + 1)
          }}
        >
          {fr.common.retry}
        </Button>
      </Frame>
    )
  }
  return (
    <Frame title={t.unavailableTitle}>
      <p className="text-sm leading-relaxed text-slate-600">{t.unavailableText}</p>
      <Link to="/" className="mt-4 inline-block text-indigo-600 underline">
        {t.backToHome}
      </Link>
    </Frame>
  )
}
