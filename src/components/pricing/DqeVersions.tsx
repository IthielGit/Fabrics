import { useState } from 'react'
import { diffEstimates, freezeEstimate, type EstimateStatus, type EstimateVersion } from '../../features/pricing/estimateVersions'
import type { Estimate } from '../../features/pricing/estimate'
import { formatAriary } from '../../features/pricing/money'
import { useT } from '../../i18n/useT'
import { formatIsoDay } from '../../lib/date'
import Button from '../ui/Button'
import { FIELD_INPUT, LINK_BUTTON } from './styles'

interface DqeVersionsProps {
  estimate: Estimate
  versions: readonly EstimateVersion[]
  /** Empreinte de l'état actuel (même empreinte qu'une version : rien n'a changé). */
  fingerprint: string | null
  canEdit: boolean
  onFreeze: (status: EstimateStatus, note: string) => Promise<void>
}

/** Versions figées du devis : figer (brouillon ou définitif), état à jour ou non, comparaison. */
export default function DqeVersions({ estimate, versions, fingerprint, canEdit, onFreeze }: DqeVersionsProps) {
  const t = useT()
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const [compare, setCompare] = useState<string | null>(null)
  const latest = versions[0]

  const freeze = async (status: EstimateStatus) => {
    setBusy(true)
    setFailed(false)
    try {
      await onFreeze(status, note)
      setNote('')
    } catch (error) {
      console.error('Version du devis :', error)
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  const compared = versions.find((v) => v.id === compare)
  const diff = compared ? diffEstimates(compared.snapshot, freezeEstimate(estimate)) : null
  const signed = (value: bigint) => `${value > 0n ? '+' : value < 0n ? '−' : ''}${formatAriary(value < 0n ? -value : value, { decimals: 0 })}`

  return (
    <section className="space-y-2 text-xs">
      <h3 className="font-semibold uppercase text-muted-foreground">{t('dqe.versions')}</h3>
      {latest && fingerprint && (
        <p className={latest.fingerprint === fingerprint ? 'text-emerald-600' : 'text-amber-600'}>
          {t(latest.fingerprint === fingerprint ? 'dqe.upToDate' : 'dqe.changed')}
        </p>
      )}
      {canEdit && (
        <div className="space-y-2">
          <input
            className={FIELD_INPUT}
            value={note}
            maxLength={200}
            placeholder={t('dqe.notePlaceholder')}
            aria-label={t('dqe.notePlaceholder')}
            onChange={(event) => setNote(event.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy || !fingerprint} onClick={() => void freeze('draft')}>
              {t('dqe.freezeDraft')}
            </Button>
            <Button variant="primary" disabled={busy || !fingerprint || estimate.linesWithoutPrice > 0 || estimate.lots.length === 0} onClick={() => void freeze('final')}>
              {t('dqe.freezeFinal')}
            </Button>
          </div>
          {estimate.linesWithoutPrice > 0 && <p className="text-red-600">{t('dqe.finalBlocked', { count: estimate.linesWithoutPrice })}</p>}
          {failed && <p className="text-red-600">{t('dqe.freezeError')}</p>}
        </div>
      )}
      {versions.length === 0 && <p className="text-muted-foreground">{t('dqe.noVersions')}</p>}
      <ul className="space-y-1">
        {versions.map((version) => (
          <li key={version.id}>
            {t('dqe.versionLine', {
              number: version.number,
              status: t(`dqe.status.${version.status}`),
              date: formatIsoDay(version.createdAt),
              who: version.createdByEmail || '—',
              total: formatAriary(BigInt(version.snapshot.totalHt), { decimals: 0 }),
            })}
            {version.note && <span className="block text-muted-foreground">{version.note}</span>}
            <button type="button" className={LINK_BUTTON} onClick={() => setCompare(compare === version.id ? null : version.id)}>
              {t(compare === version.id ? 'dqe.hideCompare' : 'dqe.compare')}
            </button>
          </li>
        ))}
      </ul>
      {diff && (
        <div className="rounded border border-border/60 p-2">
          {diff.lines.length === 0 && <p>{t('dqe.diffEmpty')}</p>}
          <ul className="space-y-0.5">
            {diff.lines.map((line) => (
              <li key={line.workItemId} className="flex justify-between gap-2">
                <span>
                  <span className="tabular-nums text-muted-foreground">{line.code}</span> {t(`dqe.diff.${line.change}`)}
                </span>
                <span className="tabular-nums">{signed(line.amountDelta)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-1 font-medium">{t('dqe.diffTotal', { delta: signed(diff.totalHtDelta) })}</p>
        </div>
      )}
    </section>
  )
}
