import type { ReactNode } from 'react'
import AuthBrandPanel from './AuthBrandPanel'
import AuthLogo from './AuthLogo'

interface AuthLayoutProps {
  title: string
  intro?: string
  children: ReactNode
}

/**
 * Cadre commun des pages de connexion. Bureau : panneau de marque à gauche, formulaire
 * à droite. Mobile : une colonne avec le logo en tête. Pas de carte : le formulaire
 * repose directement sur la page.
 */
export default function AuthLayout({ title, intro, children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-white text-slate-900 lg:grid-cols-2">
      <AuthBrandPanel />
      <div className="flex min-w-0 flex-col">
        <header className="border-b border-slate-200 px-6 py-4 lg:hidden">
          <AuthLogo />
        </header>
        <main className="flex flex-1 items-center justify-center px-6 py-12 lg:px-16">
          <div className="rise w-full max-w-sm">
            <h1 className="text-balance text-2xl font-semibold tracking-tight text-slate-950 lg:text-3xl">
              {title}
            </h1>
            {intro && <p className="mt-2 text-sm leading-relaxed text-slate-600">{intro}</p>}
            <div className="mt-8">{children}</div>
          </div>
        </main>
      </div>
    </div>
  )
}
