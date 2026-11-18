import { useEffect } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes, useParams } from 'react-router'
import RequireAuth from './components/auth/RequireAuth'
import { fr } from './i18n/fr'
import EditorPage from './pages/EditorPage'
import HomePage from './pages/HomePage'
import IntroPage from './pages/IntroPage'
import InvitePage from './pages/InvitePage'
import LoginPage from './pages/LoginPage'
import ProjectPage from './pages/ProjectPage'
import VersionPreviewPage from './pages/VersionPreviewPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import SettingsPage from './pages/SettingsPage'
import SharePage from './pages/SharePage'
import { useAuthStore } from './stores/authStore'

/** Ancienne adresse d'essai de l'éditeur de Pascal (A2) : c'est désormais `/p/:projectId`. */
function PascalRedirect() {
  const { projectId = '' } = useParams()
  return <Navigate to={`/p/${encodeURIComponent(projectId)}`} replace />
}

export default function App() {
  const initAuth = useAuthStore((state) => state.init)
  useEffect(() => initAuth(), [initAuth])

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RequireAuth />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/reglages" element={<SettingsPage />} />
          <Route path="/p/:projectId" element={<ProjectPage />} />
          {/* Ancien éditeur (Konva), en secours pendant la transition vers celui de Pascal (retiré en A7). */}
          <Route path="/p/:projectId/ancien" element={<EditorPage />} />
          <Route path="/p/:projectId/pascal" element={<PascalRedirect />} />
          <Route path="/p/:projectId/versions/:versionId" element={<VersionPreviewPage />} />
          <Route path="/i/:token" element={<InvitePage />} />
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
    </BrowserRouter>
  )
}
