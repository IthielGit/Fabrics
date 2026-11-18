import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import AccountButton from '../components/home/AccountButton'
import { AppHeader, AppShell, ICON_BUTTON } from '../components/shell/AppShell'
import { readSoundsEnabled, writeSoundsEnabled } from '../features/settings/soundSetting'
import { useT } from '../i18n/useT'

/** Réglages de l'application, d'après `app/settings/page.tsx` de Pascal (M19 A1). */
export default function SettingsPage() {
  const t = useT()
  const [sounds, setSounds] = useState(() => readSoundsEnabled())

  const toggle = () => {
    const next = !sounds
    setSounds(next)
    writeSoundsEnabled(next)
  }

  return (
    <AppShell>
      <AppHeader>
        <AccountButton />
      </AppHeader>
      <main className="mx-auto max-w-2xl px-6 pb-16 pt-10">
        <div className="mb-8 flex items-center gap-3">
          <Link to="/" aria-label={t('auth.backToHome')} title={t('auth.backToHome')} className={ICON_BUTTON}>
            <ArrowLeft size={16} aria-hidden="true" />
          </Link>
          <h1 className="text-lg font-semibold">{t('settings.title')}</h1>
        </div>
        <section className="rounded-xl border border-border/60 bg-background p-5">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h2 id="sounds-label" className="text-sm font-medium">
                {t('settings.sounds')}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t('settings.soundsHelp')}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={sounds}
              aria-labelledby="sounds-label"
              onClick={toggle}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${sounds ? 'bg-primary' : 'bg-secondary'}`}
            >
              <span
                aria-hidden="true"
                className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-background transition-transform ${sounds ? 'translate-x-5 bg-primary-foreground' : ''}`}
              />
            </button>
          </div>
        </section>
      </main>
    </AppShell>
  )
}
