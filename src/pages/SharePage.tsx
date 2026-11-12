import clsx from 'clsx'
import { Box, Eye, PanelsTopLeft, PencilRuler } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import EditorStage from '../components/editor/EditorStage'
import LevelSelector from '../components/editor/LevelSelector'
import Notice from '../components/editor/Notice'
import ZoomControls from '../components/editor/ZoomControls'
import Button from '../components/ui/Button'
import ViewsScreen from '../components/views/ViewsScreen'
import Viewer3DPanel from '../components/viewer3d/Viewer3DPanel'
import type { SharedResult } from '../features/sharing/shareLogic'
import { fetchSharedProject } from '../features/sharing/sharesApi'
import { fr } from '../i18n/fr'
import { cloudEnabled } from '../lib/supabase'
import { useEditorStore } from '../stores/editorStore'
import { useViewer3DStore } from '../stores/viewer3dStore'
import { useViewsStore } from '../stores/viewsStore'

type View =
  | { type: 'loading' }
  | { type: 'password'; wrong: boolean }
  | { type: 'unavailable' }
  | { type: 'unsupported' }
  | { type: 'error' }
  | { type: 'ready' }

const ICON_BUTTON =
  'rounded-md p-2 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40'

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

/** Plan, 3D et planche d'un projet déjà chargé dans l'éditeur, sans aucun outil de modification. */
function ReadOnlyViewer() {
  const projectName = useEditorStore((state) => state.project?.name ?? '')
  const viewer3DOpen = useViewer3DStore((state) => state.open)
  const toggleViewer3D = useViewer3DStore((state) => state.toggleOpen)
  const openViews = useViewsStore((state) => state.openViews)

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-3">
        <Link to="/" className="flex items-center gap-2" title={fr.sharedView.madeWith}>
          <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-950 text-indigo-200">
            <PencilRuler size={14} aria-hidden="true" />
          </span>
          <span className="font-bold text-indigo-950">{fr.app.name}</span>
        </Link>
        <h1 className="min-w-0 truncate font-medium text-slate-900">{projectName}</h1>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
          <Eye size={12} aria-hidden="true" />
          {fr.sharedView.badge}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={toggleViewer3D}
            aria-pressed={viewer3DOpen}
            title={viewer3DOpen ? fr.viewer3d.close : fr.viewer3d.open}
            aria-label={viewer3DOpen ? fr.viewer3d.close : fr.viewer3d.open}
            className={clsx(ICON_BUTTON, viewer3DOpen && 'bg-indigo-50 text-indigo-700')}
          >
            <Box size={18} />
          </button>
          <button
            type="button"
            onClick={openViews}
            title={fr.views.open}
            aria-label={fr.views.open}
            className="flex items-center gap-1.5 rounded-md px-2 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            <PanelsTopLeft size={18} aria-hidden="true" />
            {fr.views.openLabel}
          </button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1">
          <EditorStage readOnly />
          <div className="pointer-events-none absolute left-3 right-3 top-3 z-10 flex items-start gap-2">
            <LevelSelector />
          </div>
          <ZoomControls />
          <Notice />
        </div>
        <Viewer3DPanel />
      </div>
      <ViewsScreen />
    </div>
  )
}
