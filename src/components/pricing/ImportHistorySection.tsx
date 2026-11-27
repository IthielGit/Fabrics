import { useEffect, useState } from 'react'
import type { ImportBatch } from '../../features/pricing/repository'
import { useT } from '../../i18n/useT'
import { formatIsoDay } from '../../lib/date'
import { usePricingStore } from '../../stores/pricingStore'
import { SECTION } from './styles'

/** Journal des imports de la bibliothèque (version, fichier, auteur, date, lignes changées). */
export default function ImportHistorySection() {
  const t = useT()
  const repository = usePricingStore((state) => state.repository)
  const library = usePricingStore((state) => state.library)
  const [batches, setBatches] = useState<ImportBatch[] | null>(null)

  const libraryId = library?.id
  const version = library?.version
  useEffect(() => {
    if (!repository || !libraryId) return
    let cancelled = false
    repository.listImports(libraryId).then(
      (list) => !cancelled && setBatches(list),
      (error: unknown) => console.error('Journal des imports :', error),
    )
    return () => {
      cancelled = true
    }
  }, [repository, libraryId, version])

  return (
    <section className={`${SECTION} max-w-3xl`}>
      <h2 className="mb-2 text-sm font-semibold">{t('pricing.import.history')}</h2>
      {batches?.length === 0 && <p className="text-xs text-muted-foreground">{t('pricing.import.historyEmpty')}</p>}
      <ul className="space-y-1 text-xs">
        {batches?.map((batch) => (
          <li key={batch.id} title={batch.sha256 ? `SHA-256 ${batch.sha256}` : undefined}>
            {t('pricing.import.historyLine', {
              version: batch.version,
              file: batch.fileName,
              who: batch.importedByEmail || '—',
              when: formatIsoDay(batch.importedAt),
              added: batch.summary.added ?? 0,
              updated: batch.summary.updated ?? 0,
              removed: batch.summary.removed ?? 0,
            })}
          </li>
        ))}
      </ul>
    </section>
  )
}
