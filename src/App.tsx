import { BrowserRouter, Link, Route, Routes } from 'react-router'
import { fr } from './i18n/fr'
import EditorPage from './pages/EditorPage'
import HomePage from './pages/HomePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/p/:projectId" element={<EditorPage />} />
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
