import { Suspense, useEffect } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes, useParams } from 'react-router'
import RequireAuth from './components/auth/RequireAuth'
import { fr } from './i18n/fr'
import HomePage from './pages/HomePage'
import {
  IntroPage,
  InvitePage,
  PriceLibraryPage,
  ProjectPage,
  ResetPasswordPage,
  SettingsPage,
  SharePage,
  VersionPreviewPage,
  WorkspaceInvitePage,
} from './pages/lazyPages'
import LoginPage from './pages/LoginPage'
import { useAuthStore } from './stores/authStore'

/** Anciennes adresses (essai de Pascal en A2, ancien éditeur) : tout plan s'ouvre à `/p/:projectId`. */
function PascalRedirect() {
  const { projectId = '' } = useParams()
  return <Navigate to={`/p/${encodeURIComponent(projectId)}`} replace />
}

export default function App() {
  const initAuth = useAuthStore((state) => state.init)
  useEffect(() => initAuth(), [initAuth])

  return (
    <BrowserRouter>
      <Suspense fallback={<p className="p-8 text-slate-500">{fr.common.loading}</p>}>
      <Routes>
        <Route element={<RequireAuth />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/reglages" element={<SettingsPage />} />
          <Route path="/p/:projectId" element={<ProjectPage />} />
          {/* Ancienne adresse de secours de l'ancien éditeur : une seule version, celle de Pascal. */}
          <Route path="/p/:projectId/ancien" element={<PascalRedirect />} />
          <Route path="/p/:projectId/pascal" element={<PascalRedirect />} />
          <Route path="/p/:projectId/versions/:versionId" element={<VersionPreviewPage />} />
          <Route path="/i/:token" element={<InvitePage />} />
          <Route path="/prix" element={<PriceLibraryPage />} />
          <Route path="/espace/:token" element={<WorkspaceInvitePage />} />
        </Route>
        <Route path="/bienvenue" element={<IntroPage />} />
        <Route path="/s/:token" element={<SharePage />} />
        <Route path="/connexion" element={<LoginPage />} />
        <Route path="/nouveau-mot-de-passe" element={<ResetPasswordPage />} />
        <Route
          path="*"
          element={
            <main className="p-8">
              <h1 className="text-2xl font-bold">{fr.notFound.title}</h1>
              <Link to="/" className="text-indigo-600 underline">
                {fr.notFound.backToHome}
              </Link>
            </main>
          }
        />
      </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
