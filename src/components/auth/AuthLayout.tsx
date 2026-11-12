import { PencilRuler } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { fr } from '../../i18n/fr'

interface AuthLayoutProps {
  title: string
  intro?: string
  children: ReactNode
}

/** Cadre commun des pages de connexion : logo, titre, carte blanche. */
export default function AuthLayout({ title, intro, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-4">
          <Link to="/" className="flex items-center gap-3" aria-label={fr.auth.backToHome}>
            <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-950 text-indigo-200">
              <PencilRuler size={18} aria-hidden="true" />
            </span>
            <span className="text-xl font-bold tracking-tight text-indigo-950">{fr.app.name}</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-md px-6 pb-16 pt-12">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
        {intro && <p className="mt-2 text-sm leading-relaxed text-slate-600">{intro}</p>}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">{children}</div>
      </main>
    </div>
  )
}
