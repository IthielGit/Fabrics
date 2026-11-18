import type { ReactNode } from 'react'
import { AppCard } from '../shell/AppShell'

interface AuthLayoutProps {
  title: string
  intro?: string
  children: ReactNode
}

/** Cadre commun des pages de connexion : carte centrée sur la coque sombre, d'après `app/login/page.tsx` de Pascal. */
export default function AuthLayout({ title, intro, children }: AuthLayoutProps) {
  return (
    <AppCard className="max-w-md">
      <h1 className="mt-6 text-balance text-lg font-semibold">{title}</h1>
      {intro && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{intro}</p>}
      <div className="mt-6">{children}</div>
    </AppCard>
  )
}
