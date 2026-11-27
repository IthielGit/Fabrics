import { FileDown } from 'lucide-react'
import { useState } from 'react'
import type { Estimate } from '../../features/pricing/estimate'
import type { EstimateVersion } from '../../features/pricing/estimateVersions'
import type { PriceLibrary } from '../../features/pricing/model'
import { useT } from '../../i18n/useT'
import Button from '../ui/Button'
import { exportEstimate } from './exportEstimate'

interface DqeExportSectionProps {
  estimate: Estimate
  projectName: string
  workspaceName: string
  library: PriceLibrary
  versions: readonly EstimateVersion[]
  fingerprint: string | null
  canEdit: boolean
}

/** Exports XLSX et PDF du DQE affiché (admins seulement, D23-8) ; ils portent la date des prix. */
export default function DqeExportSection(props: DqeExportSectionProps) {
  const t = useT()
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  if (!props.canEdit) return <p className="text-xs text-muted-foreground">{t('dqe.export.adminOnly')}</p>

  const run = async (format: 'xlsx' | 'pdf') => {
    setBusy(true)
    setFailed(false)
    try {
      // Une version figée identique à l'état actuel est nommée dans l'en-tête ; sinon « non figé ».
      const version = props.versions.find((v) => v.fingerprint === props.fingerprint) ?? null
      await exportEstimate(
        format,
        props.estimate,
        { projectName: props.projectName, workspaceName: props.workspaceName, library: props.library, version, now: new Date() },
        t,
      )
    } catch (error) {
      console.error('Export du devis :', error)
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="space-y-2 text-xs">
      <h3 className="font-semibold uppercase text-muted-foreground">{t('dqe.export.title')}</h3>
      <div className="flex flex-wrap gap-2">
        <Button disabled={busy} onClick={() => void run('xlsx')}>
          <FileDown size={14} aria-hidden="true" />
          {t('dqe.export.xlsx')}
        </Button>
        <Button disabled={busy} onClick={() => void run('pdf')}>
          <FileDown size={14} aria-hidden="true" />
          {t('dqe.export.pdf')}
        </Button>
      </div>
      {failed && <p className="text-red-600">{t('dqe.export.error')}</p>}
    </section>
  )
}
