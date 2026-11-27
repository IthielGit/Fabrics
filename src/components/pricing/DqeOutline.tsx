import { useEffect, useState } from 'react'
import type { OutlineLine } from '../../features/pricing/estimateVersions'
import type { PricingRepository } from '../../features/pricing/repository'
import { formatQuantity } from '../../features/pricing/estimate'
import { useT } from '../../i18n/useT'

/**
 * Personne qui a accès au projet mais pas à l'espace qui le chiffre (D23-8) : postes, désignations et
 * quantités de la dernière version figée, jamais de prix ni de montant.
 */
export default function DqeOutline({ repository, projectId }: { repository: PricingRepository; projectId: string }) {
  const t = useT()
  const [lines, setLines] = useState<OutlineLine[] | null>(null)

  useEffect(() => {
    if (!repository.shared) return
    let cancelled = false
    repository.projectEstimateOutline(projectId).then(
      (list) => !cancelled && setLines(list),
      () => !cancelled && setLines([]),
    )
    return () => {
      cancelled = true
    }
  }, [repository, projectId])

  if (!lines || lines.length === 0) return null
  return (
    <section className="space-y-2 text-xs">
      <h3 className="font-semibold uppercase text-muted-foreground">{t('dqe.outlineTitle')}</h3>
      <p className="text-muted-foreground">{t('dqe.outlineNote')}</p>
      <ul className="space-y-0.5">
        {lines.map((line, index) => (
          <li key={`${line.code}-${index}`} className="flex justify-between gap-2">
            <span>
              <span className="tabular-nums text-muted-foreground">{line.code}</span> {line.designation}
            </span>
            <span className="whitespace-nowrap tabular-nums">
              {formatQuantity(BigInt(line.quantity), line.quantityDecimals)} {line.unit}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
