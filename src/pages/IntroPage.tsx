import { ArrowRight } from 'lucide-react'
import { Link, Navigate, useLocation } from 'react-router'
import AuthLogo from '../components/auth/AuthLogo'
import BuildingViews from '../components/intro/BuildingViews'
import IntroMotion from '../components/intro/IntroMotion'
import MeasuredRoom from '../components/intro/MeasuredRoom'
import SketchToPlan from '../components/intro/SketchToPlan'
import { fr } from '../i18n/fr'
import { useAuthStore } from '../stores/authStore'

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
const PRIMARY = `inline-flex h-12 items-center gap-2 rounded-xl bg-indigo-600 px-6 text-[0.9375rem] font-semibold text-white shadow-md shadow-indigo-950/15 transition-colors duration-150 hover:bg-indigo-700 ${FOCUS}`
const TEXT_LINK = `rounded-sm text-[0.9375rem] font-medium text-indigo-700 underline decoration-indigo-300 underline-offset-4 transition-colors hover:text-indigo-900 hover:decoration-indigo-700 ${FOCUS}`
const CAVEAT_URL = 'https://fonts.googleapis.com/css2?family=Caveat:wght@500;600&display=swap'

/**
 * Page d'introduction publique (`/bienvenue`). Toute l'application demande une connexion :
 * on arrive ici quand on n'est pas connecté, et les boutons mènent à la page de connexion.
 */
export default function IntroPage() {
  const status = useAuthStore((state) => state.status)
  const location = useLocation()

  // Mode local (sans Supabase) ou déjà connecté : l'application est directement accessible.
  if (status === 'disabled' || status === 'signedIn') return <Navigate to="/" replace />
  if (status === 'loading') {
    return (
      <div role="status" className="min-h-screen bg-white">
        <span className="sr-only">{fr.common.loading}</span>
      </div>
    )
  }

  // La page demandée avant la redirection suit jusqu'à la connexion, puis on y revient.
  const from = (location.state as { from?: unknown } | null)?.from
  const linkState = typeof from === 'string' ? { from } : undefined

  const actions = (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
      <Link to="/connexion?mode=inscription" state={linkState} className={PRIMARY}>
        {fr.intro.createAccount}
        <ArrowRight size={18} aria-hidden="true" />
      </Link>
      <Link to="/connexion" state={linkState} className={TEXT_LINK}>
        {fr.intro.haveAccount}
      </Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Police manuscrite (OFL) du croquis ; React la place dans <head>. */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" href={CAVEAT_URL} precedence="default" />

      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5 lg:px-10">
        <AuthLogo />
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-6 pb-20 pt-6 lg:px-10 lg:pb-28 lg:pt-10">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
            <h1 data-hero className="text-balance text-[2.5rem] font-bold leading-[1.04] tracking-[-0.035em] text-indigo-950 sm:text-5xl lg:text-[4rem]">
              {fr.intro.title}
            </h1>
            <div data-hero className="flex flex-col gap-6 lg:pb-2">
              <p className="max-w-md text-lg leading-relaxed text-slate-600">{fr.intro.lead}</p>
              {actions}
            </div>
          </div>
          <div className="mt-10 lg:mt-14">
            <SketchToPlan />
          </div>
        </section>

        <section className="border-t border-slate-200">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20 lg:px-10 lg:py-28">
            <div data-reveal className="max-w-md">
              <h2 className="text-balance text-3xl font-bold tracking-[-0.03em] text-indigo-950 lg:text-[2.75rem] lg:leading-[1.08]">
                {fr.intro.measureTitle}
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-slate-600">{fr.intro.measureText}</p>
            </div>
            <div data-reveal>
              <MeasuredRoom />
            </div>
          </div>
        </section>

        <section className="bg-indigo-950 text-indigo-100">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-28">
            <div data-reveal className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
              <h2 className="text-balance text-3xl font-bold tracking-[-0.03em] text-white lg:text-[2.75rem] lg:leading-[1.08]">
                {fr.intro.buildingTitle}
              </h2>
              <div className="flex flex-col gap-3 text-lg leading-relaxed">
                <p className="text-indigo-200">{fr.intro.buildingText}</p>
                <p className="text-indigo-300">{fr.intro.examplesText}</p>
              </div>
            </div>
            <div data-reveal className="mt-12 lg:mt-16">
              <BuildingViews />
            </div>
          </div>
        </section>

        <section>
          <div data-reveal className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-20 lg:flex-row lg:items-end lg:justify-between lg:px-10 lg:py-28">
            <h2 className="text-balance text-4xl font-bold tracking-[-0.035em] text-indigo-950 lg:text-[3.5rem] lg:leading-[1.04]">
              {fr.intro.closingTitle}
            </h2>
            {actions}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <AuthLogo />
          <p>{fr.intro.footerPrivacy}</p>
        </div>
      </footer>
      <IntroMotion />
    </div>
  )
}
