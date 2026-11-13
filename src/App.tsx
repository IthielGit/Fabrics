import { useEffect } from 'react'
import { BrowserRouter, Link, Route, Routes } from 'react-router'
import RequireAuth from './components/auth/RequireAuth'
import { fr } from './i18n/fr'
import HomePage from './pages/HomePage'
import IntroPage from './pages/IntroPage'
import InvitePage from './pages/InvitePage'
import LoginPage from './pages/LoginPage'
import ProjectPage from './pages/ProjectPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import SharePage from './pages/SharePage'
import { useAuthStore } from './stores/authStore'

export default function App() {
  const initAuth = useAuthStore((state) => state.init)
  useEffect(() => initAuth(), [initAuth])

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RequireAuth />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/p/:projectId" element={<ProjectPage />} />
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
