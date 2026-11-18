import clsx from 'clsx'
import { PencilRuler } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useT } from '../../i18n/useT'

/** Coque sombre des pages hors éditeur (accueil, connexion, réglages), d'après `app-shell.tsx` de Pascal. */
export function AppShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('pascal-shell font-sans', className)}>{children}</div>
}

export function FabricsLogo({ className }: { className?: string }) {
  const t = useT()
  return (
    <span className={clsx('inline-flex items-center gap-2.5', className)}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <PencilRuler size={16} aria-hidden="true" />
      </span>
      <span className="text-base font-semibold tracking-tight">{t('app.name')}</span>
    </span>
  )
}

export function AppHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-sidebar">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-6">
        <Link to="/" className="rounded-lg focus-visible:outline-2 focus-visible:outline-ring">
          <FabricsLogo />
        </Link>
        <div className="flex items-center gap-2">{children}</div>
      </div>
    </header>
  )
}

/** Carte centrée des pages à usage unique (connexion, nouveau mot de passe), d'après `AppCard` de Pascal. */
export function AppCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <AppShell className="flex items-center justify-center p-6">
      <div
        className={clsx(
          'w-full max-w-sm rounded-2xl border border-border bg-background p-6 shadow-2xl',
          className,
        )}
      >
        <FabricsLogo />
        {children}
      </div>
    </AppShell>
  )
}

export const PRIMARY_PILL =
  'inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50'

export const SECONDARY_PILL =
  'inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50'

export const ICON_BUTTON =
  'inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
