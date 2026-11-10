import { Link, useParams } from 'react-router'
import { fr } from '../i18n/fr'

export default function EditorPage() {
  const { projectId } = useParams()

  return (
    <main className="min-h-screen bg-slate-100 p-8 text-slate-900">
      <h1 className="text-3xl font-bold text-indigo-600">{fr.editor.title}</h1>
      <p className="mt-2 text-slate-600">
        {fr.editor.projectLabel} <strong>{projectId}</strong>
      </p>
      <p className="mt-2 text-slate-500">{fr.editor.placeholder}</p>
      <Link to="/" className="mt-6 inline-block text-indigo-600 underline">
        {fr.editor.backToHome}
      </Link>
    </main>
  )
}
