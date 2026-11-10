import { Link } from 'react-router'
import { fr } from '../i18n/fr'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 p-8 text-slate-900">
      <h1 className="text-4xl font-bold text-indigo-600">{fr.app.name}</h1>
      <p className="mt-2 text-slate-600">{fr.app.tagline}</p>
      <h2 className="mt-8 text-xl font-semibold">{fr.home.title}</h2>
      <p className="mt-2 text-slate-500">{fr.home.placeholder}</p>
      <Link
        to="/p/test"
        className="mt-6 inline-block rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
      >
        /p/test
      </Link>
    </main>
  )
}
