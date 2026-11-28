import { useEffect, useState } from 'react'
import { journalEntries, type AuditEvent } from '../../features/audit/journal'
import { useT } from '../../i18n/useT'
import { journalLabels } from './journalLabels'

/**
 * Journal d'audit (M24, 24.3, D24-4) : une phrase par événement, la plus récente d'abord. `load` lit
 * les événements (projet ou espace de prix) ; une lecture impossible le dit au lieu d'afficher vide.
 */
export default function JournalPanel({ load, intro }: { load: () => Promise<AuditEvent[]>; intro: string }) {
  const t = useT()
  const [state, setState] = useState<{ status: 'loading' } | { status: 'error' } | { status: 'ready'; events: AuditEvent[] }>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    load()
      .then((events) => !cancelled && setState({ status: 'ready', events }))
      .catch((error: unknown) => {
        console.error('Journal :', error)
        if (!cancelled) setState({ status: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [load])

  return (
    <section aria-label={t('journal.title')} className="space-y-3 p-4 text-sm">
      <div>
        <h2 className="text-base font-semibold">{t('journal.title')}</h2>
        <p className="text-xs text-muted-foreground">{intro}</p>
      </div>
      {state.status === 'loading' && <p className="text-xs text-muted-foreground">{t('common.loading')}</p>}
      {state.status === 'error' && <p className="text-xs text-red-600">{t('journal.loadError')}</p>}
      {state.status === 'ready' && state.events.length === 0 && <p className="text-xs text-muted-foreground">{t('journal.empty')}</p>}
      {state.status === 'ready' && state.events.length > 0 && (
        <ol className="space-y-1.5">
          {journalEntries(state.events, journalLabels(t)).map((entry) => (
            <li key={entry.id} className="border-b border-border/60 pb-1.5 text-xs">
              <time dateTime={entry.at} className="block text-muted-foreground">
                {new Date(entry.at).toLocaleString('fr-FR')}
              </time>
              {entry.text}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
