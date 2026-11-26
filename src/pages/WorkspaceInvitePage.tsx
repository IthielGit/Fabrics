import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { SECONDARY_PILL } from '../components/shell/AppShell'
import { useT } from '../i18n/useT'
import { cloudEnabled } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { pricingRepositoryFor, rememberWorkspace } from '../stores/pricingStore'

type View = { type: 'loading' } | { type: 'joined' } | { type: 'unavailable' } | { type: 'error' }

/**
 * Lien d'invitation à un espace (`/espace/<jeton>`), derrière la garde de connexion. L'espace est
 * rejoint, puis la bibliothèque de prix s'ouvre sur cet espace.
 */
export default function WorkspaceInvitePage() {
  const t = useT()
  const { token } = useParams()
  const userId = useAuthStore((state) => state.user?.id ?? null)
  const [view, setView] = useState<View>({ type: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!token || !cloudEnabled || !userId) return
    let cancelled = false
    pricingRepositoryFor(userId)
      .acceptInvite(token)
      .then((result) => {
        if (cancelled) return
        if (result.status === 'ok') {
          rememberWorkspace(result.workspaceId)
          setView({ type: 'joined' })
        } else {
          setView({ type: 'unavailable' })
        }
      })
      .catch((error: unknown) => {
        console.error('Invitation à un espace :', error)
        if (!cancelled) setView({ type: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [token, userId, attempt])

  if (view.type === 'joined') return <Navigate to="/prix" replace />

  const unavailable = !cloudEnabled || !token || view.type === 'unavailable'
  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-semibold">{t('pricing.join.title')}</h1>
      <div className="mt-4 space-y-4 text-sm text-muted-foreground">
        {view.type === 'loading' && !unavailable && <p>{t('pricing.join.joining')}</p>}
        {unavailable && <p>{t('pricing.join.unavailable')}</p>}
        {view.type === 'error' && (
          <>
            <p role="alert">{t('pricing.join.error')}</p>
            <button
              type="button"
              className={SECONDARY_PILL}
              onClick={() => {
                setView({ type: 'loading' })
                setAttempt((n) => n + 1)
              }}
            >
              {t('common.retry')}
            </button>
          </>
        )}
        <p>
          <Link to="/" className="underline">
            {t('auth.backToHome')}
          </Link>
        </p>
      </div>
    </main>
  )
}
