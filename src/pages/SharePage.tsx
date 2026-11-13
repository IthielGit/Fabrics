import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router'
import ReadOnlyViewer from '../components/editor/ReadOnlyViewer'
import Button from '../components/ui/Button'
import type { SharedResult } from '../features/sharing/shareLogic'
import { fetchSharedProject } from '../features/sharing/sharesApi'
import { fr } from '../i18n/fr'
import { cloudEnabled } from '../lib/supabase'
import { useEditorStore } from '../stores/editorStore'

type View =
  | { type: 'loading' }
  | { type: 'password'; wrong: boolean }
  | { type: 'unavailable' }
  | { type: 'unsupported' }
  | { type: 'error' }
  | { type: 'ready' }

function Frame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-semibold text-slate-950">{title}</h1>
      <div className="mt-4">{children}</div>
    </main>
  )
}

/**
 * Page publique d'un plan partagé par lien, en lecture seule : le plan, la 3D et la planche.
 * Rien n'est enregistré depuis cette page (pas d'enregistrement automatique, pas de raccourcis
 * d'édition), et la base n'accepte de toute façon aucune écriture d'un visiteur.
 */
export default function SharePage() {
  const { token } = useParams()
  const loadProject = useEditorStore((state) => state.loadProject)
  const closeProject = useEditorStore((state) => state.closeProject)
  const [view, setView] = useState<View>({ type: 'loading' })
  const [password, setPassword] = useState('')

  const applyResult = useCallback(
    (result: SharedResult) => {
      if (result.status === 'ok') {
        loadProject(result.project)
        setView({ type: 'ready' })
      } else if (result.status === 'password_required') {
        setView({ type: 'password', wrong: false })
      } else if (result.status === 'wrong_password') {
        setView({ type: 'password', wrong: true })
      } else {
        setView({ type: result.status === 'unsupported' ? 'unsupported' : 'unavailable' })
      }
    },
    [loadProject],
  )

  /** Nouvelle tentative (mot de passe saisi, ou « Réessayer » après une panne). */
  const retry = (pw: string) => {
    if (!token) return
    setView({ type: 'loading' })
    fetchSharedProject(token, pw)
      .then(applyResult)
      .catch(() => setView({ type: 'error' }))
  }

  useEffect(() => {
    if (!token || !cloudEnabled) return
    let cancelled = false
    fetchSharedProject(token, '')
      .then((result) => {
        if (!cancelled) applyResult(result)
      })
      .catch(() => {
        if (!cancelled) setView({ type: 'error' })
      })
    return () => {
      cancelled = true
      closeProject()
    }
  }, [token, applyResult, closeProject])

  const t = fr.sharedView

  if (!cloudEnabled || !token) {
    return (
      <Frame title={t.unavailableTitle}>
        <p className="text-sm text-slate-600">{t.notAvailableHere}</p>
      </Frame>
    )
  }
  if (view.type === 'loading') return <p className="p-8 text-slate-500">{t.loading}</p>
  if (view.type === 'unavailable' || view.type === 'unsupported') {
    return (
      <Frame title={t.unavailableTitle}>
        <p className="text-sm leading-relaxed text-slate-600">
          {view.type === 'unsupported' ? t.unsupportedText : t.unavailableText}
        </p>
      </Frame>
    )
  }
  if (view.type === 'error') {
    return (
      <Frame title={t.unavailableTitle}>
        <p role="alert" className="text-sm text-slate-600">
          {t.loadError}
        </p>
        <Button className="mt-4" onClick={() => retry(password)}>
          {fr.common.retry}
        </Button>
      </Frame>
    )
  }
  if (view.type === 'password') {
    const submit = (event: FormEvent) => {
      event.preventDefault()
      if (password !== '') retry(password)
    }
    return (
      <Frame title={t.passwordTitle}>
        <p className="text-sm text-slate-600">{t.passwordIntro}</p>
        <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            {t.passwordLabel}
            <input
              type="password"
              autoComplete="off"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-normal focus:border-indigo-500 focus:outline-none"
            />
          </label>
          {view.wrong && (
            <p role="alert" className="text-sm text-red-700">
              {t.wrongPassword}
            </p>
          )}
          <Button type="submit" variant="primary" className="justify-center">
            {t.passwordSubmit}
          </Button>
        </form>
      </Frame>
    )
  }

  return <ReadOnlyViewer />
}
